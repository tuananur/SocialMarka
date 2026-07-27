import { NextResponse } from "next/server";
import { prisma, PlatformType, SenderType, AccountStatus } from "@socialmarka/db";
import { enqueueWebhook } from "@socialmarka/queue";

const PROVIDERS: Record<string, PlatformType> = {
  facebook: PlatformType.FACEBOOK,
  instagram: PlatformType.INSTAGRAM,
  linkedin: PlatformType.LINKEDIN,
  youtube: PlatformType.YOUTUBE,
  x: PlatformType.X,
  twitter: PlatformType.X,
  tiktok: PlatformType.TIKTOK,
  pinterest: PlatformType.PINTEREST,
};

async function processWebhookInline(platform: PlatformType, payload: any) {
  console.log("[Webhook Inline] Processing webhook event...", {
    platform,
    object: payload.object,
    hasEntry: !!payload.entry,
  });

  let senderName = String(payload.senderName || "Bilinmeyen");
  let messageText = String(payload.message || payload.text || "");
  let socialAccountId = String(payload.socialAccountId || "");
  let workspaceId = String(payload.workspaceId || "");
  let type: "COMMENT" | "DIRECT_MESSAGE" = payload.type === "COMMENT" ? "COMMENT" : "DIRECT_MESSAGE";
  let remoteId = payload.remoteId ? String(payload.remoteId) : null;
  let senderAvatar = payload.senderAvatar ? String(payload.senderAvatar) : null;

  // 1. Parse Meta raw payload
  if (platform === PlatformType.INSTAGRAM && payload.object === "instagram") {
    const entry = payload.entry?.[0];
    if (entry) {
      const igAccountId = String(entry.id);
      console.log("[Webhook Inline] Meta Instagram entry parsed:", { igAccountId });

      let account;
      if (igAccountId === "0") {
        console.log("[Webhook Inline] Test payload detected (ID 0). Finding first active Instagram account...");
        account = await prisma.socialAccount.findFirst({
          where: {
            provider: PlatformType.INSTAGRAM,
            status: { not: AccountStatus.DISCONNECTED },
          },
        });
      } else {
        account = await prisma.socialAccount.findFirst({
          where: {
            provider: PlatformType.INSTAGRAM,
            providerAccountId: igAccountId,
            status: { not: AccountStatus.DISCONNECTED },
          },
        });
      }

      console.log("[Webhook Inline] DB Account lookup result:", {
        found: !!account,
        id: account?.id || null,
        workspaceId: account?.workspaceId || null,
      });

      if (account) {
        socialAccountId = account.id;
        workspaceId = account.workspaceId;

        // Check for comments
        if (entry.changes?.[0]) {
          const change = entry.changes[0];
          console.log("[Webhook Inline] change detail:", { field: change.field });
          if (change.field === "comments" && change.value) {
            senderName = change.value.from?.username || "instagram_user";
            messageText = change.value.text || "";
            remoteId = change.value.id || null;
            type = "COMMENT";
          }
        }
        // Check for DMs
        else if (entry.messaging?.[0]) {
          const msg = entry.messaging[0];
          senderName = msg.sender?.username || "instagram_user";
          messageText = msg.message?.text || "";
          remoteId = msg.message?.mid || null;
          type = "DIRECT_MESSAGE";
        }
      }
    }
  }

  console.log("[Webhook Inline] Final parsed fields:", {
    socialAccountId,
    workspaceId,
    senderName,
    messageText: messageText.slice(0, 30),
    type,
  });

  if (socialAccountId && workspaceId && messageText) {
    let conversation = await prisma.inboxConversation.findFirst({
      where: {
        socialAccountId,
        senderName,
        type,
      },
    });

    if (!conversation) {
      console.log("[Webhook Inline] Creating new conversation...");
      conversation = await prisma.inboxConversation.create({
        data: {
          workspaceId,
          socialAccountId,
          senderName,
          senderAvatar,
          lastMessage: messageText,
          lastMessageAt: new Date(),
          type,
          remoteId,
        },
      });
    } else {
      console.log("[Webhook Inline] Updating existing conversation...", { id: conversation.id });
      await prisma.inboxConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: messageText,
          lastMessageAt: new Date(),
          isRead: false,
        },
      });
    }

    console.log("[Webhook Inline] Creating inbox message...");
    await prisma.inboxMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: SenderType.USER,
        messageText,
      },
    });
    console.log("[Webhook Inline] Webhook processed successfully!");
  } else {
    console.warn("[Webhook Inline] Skipped DB write due to missing socialAccountId/workspaceId/messageText");
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === (process.env.META_WEBHOOK_VERIFY_TOKEN || "socialmarka-verify")
  ) {
    return new NextResponse(challenge || "", { status: 200 });
  }

  return NextResponse.json({
    ok: true,
    provider,
    message: "Webhook endpoint hazır",
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerKey } = await params;
  const platform = PROVIDERS[providerKey.toLowerCase()];
  if (!platform) {
    return NextResponse.json({ error: "Bilinmeyen sağlayıcı" }, { status: 400 });
  }

  const payload = await req.json().catch(() => ({}));
  const signature = req.headers.get("x-hub-signature-256");
  const signatureValid = !process.env.META_WEBHOOK_SECRET || !!signature;

  const eventId =
    (payload as { id?: string }).id ||
    (payload as { entry?: { id?: string }[] }).entry?.[0]?.id ||
    `${Date.now()}`;

  try {
    const event = await prisma.webhookEvent.create({
      data: {
        provider: platform,
        eventId: String(eventId),
        payload,
        signatureValid,
        status: "PENDING",
      },
    });

    // Process inline immediately for Vercel / serverless environment
    let inlineSuccess = false;
    try {
      await processWebhookInline(platform, payload);
      inlineSuccess = true;
    } catch (err) {
      console.error("[Webhook Inline Process Error]:", err);
    }

    if (inlineSuccess) {
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
    }

    if (process.env.INLINE_PUBLISH !== "true") {
      try {
        await enqueueWebhook({ webhookEventId: event.id });
      } catch (err) {
        console.warn("[Webhook Queueing Error - Skipping queue]:", err);
      }
    }
    return NextResponse.json({ ok: true, id: event.id });
  } catch {
    return NextResponse.json({ ok: true, duplicate: true });
  }
}

import { NextResponse } from "next/server";
import { prisma, SenderType } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { enqueueInboxReply } from "@socialmarka/queue";
import { getPlatformAdapter } from "@socialmarka/shared";
import { getFreshAccessToken } from "@/lib/tokens";

export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const conversationId = String(body.conversationId || "");
  const messageText = String(body.message || "").trim();
  const parentMessageId = body.parentMessageId ? String(body.parentMessageId) : null;
  
  if (!conversationId || !messageText) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const conversation = await prisma.inboxConversation.findFirst({
    where: { id: conversationId, workspaceId: ctx.workspaceId },
    include: { socialAccount: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Konuşma bulunamadı" }, { status: 404 });
  }
  
  let targetRemoteId = conversation.remoteId || conversation.id;
  if (parentMessageId) {
    const parentMsg = await prisma.inboxMessage.findFirst({
      where: { id: parentMessageId, conversationId }
    });
    if (parentMsg && parentMsg.remoteId) {
      targetRemoteId = parentMsg.remoteId;
    }
  }

  // Publish reply synchronously to platform
  let apiError: string | null = null;
  let sentRemoteId: string | undefined = undefined;
  try {
    const account = conversation.socialAccount;
    const accessToken = await getFreshAccessToken(account.id);

    const adapter = getPlatformAdapter(account.provider);
    if (adapter.sendInboxReply) {
      const result = await adapter.sendInboxReply({
        accessToken,
        conversationRemoteId: targetRemoteId,
        message: messageText,
      });
      if (!result.success) {
        apiError = result.errorMessage || "API yanıt hatası";
      } else {
        sentRemoteId = result.remoteMessageId;
      }
    } else {
      apiError = "Bu platform için yorum yanıtlama desteklenmiyor";
    }
  } catch (err: any) {
    apiError = err?.message || String(err);
  }

  if (apiError) {
    return NextResponse.json({ error: `Yorum iletilemedi: ${apiError}` }, { status: 502 });
  }
  
  const message = await prisma.inboxMessage.create({
    data: {
      conversationId,
      senderType: SenderType.AGENT,
      messageText,
      remoteId: sentRemoteId,
    },
  });

  await prisma.inboxConversation.update({
    where: { id: conversationId },
    data: {
      lastMessage: messageText,
      lastMessageAt: new Date(),
      isRead: true,
    },
  });


  // Enqueue as background task fallback
  try {
    void enqueueInboxReply({ conversationId, messageId: message.id }).catch(() => {});
  } catch {
    /* ignore queue failures in serverless */
  }

  return NextResponse.json({ message });
}

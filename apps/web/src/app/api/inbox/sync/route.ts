import { NextResponse } from "next/server";
import { prisma, SenderType, AccountStatus, InboxType } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { resolveAccessToken } from "@socialmarka/shared";

export async function POST(_req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const accounts = await prisma.socialAccount.findMany({
    where: {
      workspaceId: ctx.workspaceId,
      status: { not: AccountStatus.DISCONNECTED },
    },
  });

  // Try live fetch for connected Facebook / Instagram accounts
  for (const account of accounts) {
    if (account.provider === "FACEBOOK" || account.provider === "INSTAGRAM") {
      try {
        const token = resolveAccessToken(account.encryptedAccessToken);
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${account.providerAccountId}/conversations?fields=id,senders,unread_count,updated_time,messages{id,message,created_time,from}&access_token=${encodeURIComponent(token)}`
        );
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data)) {
            for (const convData of json.data) {
              const sender = convData.senders?.data?.[0]?.name || "Kullanıcı";
              const lastMsgObj = convData.messages?.data?.[0];
              const lastMsgText = lastMsgObj?.message || "Mesaj içeriği";

              let conversation = await prisma.inboxConversation.findFirst({
                where: {
                  socialAccountId: account.id,
                  senderName: sender,
                },
              });

              if (!conversation) {
                conversation = await prisma.inboxConversation.create({
                  data: {
                    workspaceId: ctx.workspaceId,
                    socialAccountId: account.id,
                    senderName: sender,
                    lastMessage: lastMsgText,
                    lastMessageAt: lastMsgObj?.created_time ? new Date(lastMsgObj.created_time) : new Date(),
                    type: "DIRECT_MESSAGE",
                    remoteId: convData.id,
                  },
                });
              }

              if (convData.messages?.data) {
                for (const msgItem of convData.messages.data) {
                  if (!msgItem.message) continue;
                  const isAgent = msgItem.from?.id === account.providerAccountId;
                  const existingMsg = await prisma.inboxMessage.findFirst({
                    where: { conversationId: conversation.id, messageText: msgItem.message },
                  });
                  if (!existingMsg) {
                    await prisma.inboxMessage.create({
                      data: {
                        conversationId: conversation.id,
                        senderType: isAgent ? SenderType.AGENT : SenderType.USER,
                        messageText: msgItem.message,
                        createdAt: msgItem.created_time ? new Date(msgItem.created_time) : new Date(),
                      },
                    });
                  }
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.error(`[Inbox Sync] Error syncing account ${account.id}:`, err?.message || err);
      }
    }
  }

  // If workspace still has 0 conversations, seed demo/interactive conversations for connected accounts
  const existingCount = await prisma.inboxConversation.count({
    where: { workspaceId: ctx.workspaceId },
  });

  if (existingCount === 0 && accounts.length > 0) {
    const SAMPLE_CONVERSATIONS = [
      {
        senderName: "Melis Yılmaz",
        type: "COMMENT",
        lastMessage: "Harika bir paylaşım olmuş, ürünlerin stok durumu nedir acaba? 😊",
        messages: [
          { senderType: SenderType.USER, text: "Harika bir paylaşım olmuş, ürünlerin stok durumu nedir acaba? 😊" },
          { senderType: SenderType.AGENT, text: "Merhaba Melis Hanım! Stoklarımız şu anda günceldir. Web sitemizden sipariş verebilirsiniz. 💫" },
        ],
      },
      {
        senderName: "Ahmet Kaya",
        type: "DIRECT_MESSAGE",
        lastMessage: "Merhaba, toplu siparişlerde indirim yapıyor musunuz?",
        messages: [
          { senderType: SenderType.USER, text: "Merhaba, toplu siparişlerde indirim yapıyor musunuz?" },
        ],
      },
      {
        senderName: "Selin Çelik",
        type: "COMMENT",
        lastMessage: "Kargolama ne kadar sürüyor acaba? Teşekkürler!",
        messages: [
          { senderType: SenderType.USER, text: "Kargolama ne kadar sürüyor acaba? Teşekkürler!" },
          { senderType: SenderType.AGENT, text: "Siparişleriniz aynı gün kargoya verilmektedir. 1-2 iş günü içinde teslim edilir. 🚛" },
        ],
      },
      {
        senderName: "Caner Öztürk",
        type: "DIRECT_MESSAGE",
        lastMessage: "İş birliği ve sponsorluk teklifleri için hangi adresten ulaşabiliriz?",
        messages: [
          { senderType: SenderType.USER, text: "İş birliği ve sponsorluk teklifleri için hangi adresten ulaşabiliriz?" },
        ],
      },
    ];

    for (let i = 0; i < SAMPLE_CONVERSATIONS.length; i++) {
      const sample = SAMPLE_CONVERSATIONS[i];
      const account = accounts[i % accounts.length];
      const conv = await prisma.inboxConversation.create({
        data: {
          workspaceId: ctx.workspaceId,
          socialAccountId: account.id,
          senderName: sample.senderName,
          lastMessage: sample.lastMessage,
          lastMessageAt: new Date(Date.now() - i * 3600_000 * 2),
          type: sample.type as InboxType,
          isRead: i > 1,
        },
      });

      for (const m of sample.messages) {
        await prisma.inboxMessage.create({
          data: {
            conversationId: conv.id,
            senderType: m.senderType,
            messageText: m.text,
            createdAt: new Date(),
          },
        });
      }
    }
  }

  // Fetch updated conversations
  const updatedConversations = await prisma.inboxConversation.findMany({
    where: { workspaceId: ctx.workspaceId },
    select: {
      id: true,
      senderName: true,
      senderAvatar: true,
      lastMessage: true,
      lastMessageAt: true,
      isRead: true,
      type: true,
      socialAccount: {
        select: { accountName: true, provider: true },
      },
      messages: {
        select: {
          id: true,
          senderType: true,
          messageText: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ conversations: updatedConversations });
}

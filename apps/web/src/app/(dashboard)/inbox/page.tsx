import dynamic from "next/dynamic";
import { requireWorkspace } from "@/lib/rbac";
import { prisma, SenderType, AccountStatus, InboxType } from "@socialmarka/db";
import { toClientJson } from "@/lib/serialize";
import { PanelSkeleton } from "@/components/dashboard/panel-skeleton";

const InboxClient = dynamic(
  () => import("@/components/inbox/inbox-client").then((m) => m.InboxClient),
  { loading: () => <PanelSkeleton /> }
);

export default async function InboxPage() {
  const { workspaceId } = await requireWorkspace();
  let conversations = await prisma.inboxConversation.findMany({
    where: { workspaceId },
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

  // Konuşma yoksa bağlı hesaplar için otomatik ilk mesajlar oluştur
  if (conversations.length === 0) {
    const accounts = await prisma.socialAccount.findMany({
      where: { workspaceId, status: { not: AccountStatus.DISCONNECTED } },
    });

    if (accounts.length > 0) {
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
            workspaceId,
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

      conversations = await prisma.inboxConversation.findMany({
        where: { workspaceId },
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
    }
  }

  return <InboxClient conversations={toClientJson(conversations)} />;
}

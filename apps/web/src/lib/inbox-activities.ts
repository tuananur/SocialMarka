import { prisma } from "@socialmarka/db";

export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Şimdi";
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  return `${diffDays} gün önce`;
}

export async function getLiveActivities(workspaceId: string) {
  const activitiesList: any[] = [];

  // A. Comments
  const recentConversations = await prisma.inboxConversation.findMany({
    where: { workspaceId },
    include: { socialAccount: true, messages: { take: 1, orderBy: { createdAt: "desc" } } },
    orderBy: { lastMessageAt: "desc" },
    take: 15,
  });
  for (const conv of recentConversations) {
    const lastMsg = conv.messages[0];
    activitiesList.push({
      id: lastMsg ? lastMsg.id : `act-conv-${conv.id}`,
      remoteId: lastMsg?.remoteId || null,
      thanked: lastMsg?.isLiked || false,
      senderName: conv.senderName,
      senderAvatar: conv.senderAvatar || null,
      actionText: `gönderinize yorum yaptı: "${conv.lastMessage?.slice(0, 60)}"`,
      platform: conv.socialAccount.provider,
      time: formatRelativeTime(conv.lastMessageAt),
      type: "LIKE",
      timestamp: conv.lastMessageAt.getTime(),
    });
  }

  // B. Published posts
  const recentPubs = await prisma.postTarget.findMany({
    where: {
      post: { workspaceId, isDeleted: false },
      status: "PUBLISHED",
    },
    include: { socialAccount: true, post: true },
    orderBy: { publishedAt: "desc" },
    take: 10,
  });
  for (const pub of recentPubs) {
    if (!pub.socialAccount) continue;
    activitiesList.push({
      id: `act-pub-${pub.id}`,
      senderName: "Sistem Otomasyonu",
      senderAvatar: null,
      actionText: `gönderinizi başarıyla yayınladı.`,
      platform: pub.socialAccount.provider,
      time: formatRelativeTime(pub.publishedAt || new Date()),
      targetPost: pub.post.content?.slice(0, 100) || undefined,
      type: "REPOST",
      timestamp: (pub.publishedAt || new Date()).getTime(),
      isSystem: true,
    });
  }

  // C. Audit logs (Connected accounts)
  const recentConns = await prisma.auditLog.findMany({
    where: {
      workspaceId,
      action: "ACCOUNT_CONNECTED",
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  for (const conn of recentConns) {
    const details: any = conn.details || {};
    activitiesList.push({
      id: `act-conn-${conn.id}`,
      senderName: "Sistem Güvenliği",
      senderAvatar: null,
      actionText: `yeni bir sosyal medya hesabı bağladı: ${details.accountName || details.provider || "Hesap"}`,
      platform: details.provider || "FACEBOOK",
      time: formatRelativeTime(conn.createdAt),
      type: "FOLLOW",
      timestamp: conn.createdAt.getTime(),
      isSystem: true,
    });
  }

  // Sort combined activities by timestamp desc
  activitiesList.sort((a, b) => b.timestamp - a.timestamp);
  return activitiesList;
}

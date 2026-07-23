import {
  Worker,
  getConnectionOptions,
  QUEUE_NAMES,
  type WebhookJobData,
  type AnalyticsJobData,
  type TokenRefreshJobData,
  type InboxReplyJobData,
} from "@socialmarka/queue";
import { prisma, SenderType } from "@socialmarka/db";
import { decryptToken, encryptToken, getPlatformAdapter } from "@socialmarka/shared";

console.log("[worker-general] başlatılıyor...");

new Worker<WebhookJobData>(
  QUEUE_NAMES.WEBHOOK,
  async (job) => {
    const event = await prisma.webhookEvent.findUnique({
      where: { id: job.data.webhookEventId },
    });
    if (!event) return;

    const payload = event.payload as Record<string, unknown>;
    const senderName = String(payload.senderName || "Bilinmeyen");
    const messageText = String(payload.message || payload.text || "");
    const socialAccountId = String(payload.socialAccountId || "");
    const workspaceId = String(payload.workspaceId || "");
    const type = payload.type === "COMMENT" ? "COMMENT" : "DIRECT_MESSAGE";

    if (socialAccountId && workspaceId && messageText) {
      let conversation = await prisma.inboxConversation.findFirst({
        where: {
          socialAccountId,
          senderName,
          type,
        },
      });

      if (!conversation) {
        conversation = await prisma.inboxConversation.create({
          data: {
            workspaceId,
            socialAccountId,
            senderName,
            senderAvatar: payload.senderAvatar ? String(payload.senderAvatar) : null,
            lastMessage: messageText,
            lastMessageAt: new Date(),
            type,
            remoteId: payload.remoteId ? String(payload.remoteId) : null,
          },
        });
      } else {
        await prisma.inboxConversation.update({
          where: { id: conversation.id },
          data: {
            lastMessage: messageText,
            lastMessageAt: new Date(),
            isRead: false,
          },
        });
      }

      await prisma.inboxMessage.create({
        data: {
          conversationId: conversation.id,
          senderType: SenderType.USER,
          messageText,
        },
      });
    }

    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
  },
  { connection: getConnectionOptions() }
);

new Worker<AnalyticsJobData>(
  QUEUE_NAMES.ANALYTICS,
  async (job) => {
    const account = await prisma.socialAccount.findUnique({
      where: { id: job.data.socialAccountId },
    });
    if (!account) return;

    const prev = await prisma.analyticsSnapshot.findFirst({
      where: { socialAccountId: account.id },
      orderBy: { capturedAt: "desc" },
    });

    await prisma.analyticsSnapshot.create({
      data: {
        socialAccountId: account.id,
        followers: (prev?.followers ?? 1000) + Math.floor(Math.random() * 20),
        following: prev?.following ?? 200,
        impressions: (prev?.impressions ?? 5000) + Math.floor(Math.random() * 500),
        reach: (prev?.reach ?? 3000) + Math.floor(Math.random() * 300),
        likes: (prev?.likes ?? 100) + Math.floor(Math.random() * 50),
        comments: (prev?.comments ?? 20) + Math.floor(Math.random() * 10),
        postsCount: prev?.postsCount ?? 0,
      },
    });
  },
  { connection: getConnectionOptions() }
);

new Worker<TokenRefreshJobData>(
  QUEUE_NAMES.TOKEN_REFRESH,
  async (job) => {
    const account = await prisma.socialAccount.findUnique({
      where: { id: job.data.socialAccountId },
    });
    if (!account?.encryptedRefreshToken) return;

    try {
      const refresh = decryptToken(account.encryptedRefreshToken);
      const adapter = getPlatformAdapter(account.provider);
      if (!adapter.refreshToken) return;
      const result = await adapter.refreshToken(refresh);
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          encryptedAccessToken: encryptToken(result.accessToken),
          encryptedRefreshToken: result.refreshToken
            ? encryptToken(result.refreshToken)
            : account.encryptedRefreshToken,
          tokenExpiresAt: result.expiresAt,
          status: "CONNECTED",
        },
      });
    } catch (e) {
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: { status: "REQUIRES_REAUTH" },
      });
      console.error("[token-refresh] hata", e);
    }
  },
  { connection: getConnectionOptions() }
);

new Worker<InboxReplyJobData>(
  QUEUE_NAMES.INBOX_REPLY,
  async (job) => {
    const message = await prisma.inboxMessage.findUnique({
      where: { id: job.data.messageId },
      include: {
        conversation: { include: { socialAccount: true } },
      },
    });
    if (!message) return;

    const account = message.conversation.socialAccount;
    let accessToken = "stub-token";
    if (account.encryptedAccessToken) {
      accessToken = decryptToken(account.encryptedAccessToken);
    }

    const adapter = getPlatformAdapter(account.provider);
    if (adapter.sendInboxReply) {
      await adapter.sendInboxReply({
        accessToken,
        conversationRemoteId: message.conversation.remoteId || message.conversation.id,
        message: message.messageText,
      });
    }
  },
  { connection: getConnectionOptions() }
);

/** Sistem metrik snapshot — saatte bir (admin panel SystemMetricSnapshot) */
async function writeSystemMetricSnapshot() {
  try {
    const [
      totalUsers,
      totalWorkspaces,
      totalSocialAccounts,
      totalPublishedPosts,
      totalQueuedPosts,
      totalFailedPosts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.socialAccount.count({ where: { status: "CONNECTED" } }),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.post.count({ where: { status: "SCHEDULED" } }),
      prisma.post.count({ where: { status: { in: ["FAILED", "PARTIAL_FAILED"] } } }),
    ]);

    await prisma.systemMetricSnapshot.create({
      data: {
        totalUsers,
        totalWorkspaces,
        totalSocialAccounts,
        totalPublishedPosts,
        totalQueuedPosts,
        totalFailedPosts,
      },
    });
    console.log("[worker-general] SystemMetricSnapshot yazıldı");
  } catch (e) {
    console.error("[worker-general] SystemMetricSnapshot hata", e);
  }
}

void writeSystemMetricSnapshot();
setInterval(writeSystemMetricSnapshot, 60 * 60_000);

console.log("[worker-general] kuyruklar dinleniyor: webhook, analytics, token-refresh, inbox-reply");

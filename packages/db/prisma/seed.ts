import {
  PrismaClient,
  Role,
  PlatformType,
  AccountStatus,
  PostStatus,
  TargetStatus,
  InboxType,
  SenderType,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo123!";

const IDS = {
  wsBA: "00000000-0000-0000-0000-000000000001",
  wsBNI: "00000000-0000-0000-0000-000000000002",
  wsPassive: "00000000-0000-0000-0000-000000000003",
  groupBA: "00000000-0000-0000-0000-000000000011",
  groupBNI: "00000000-0000-0000-0000-000000000012",
  accIgBA: "00000000-0000-0000-0000-000000000021",
  accLiBA: "00000000-0000-0000-0000-000000000022",
  accYtBA: "00000000-0000-0000-0000-000000000023",
  accXBA: "00000000-0000-0000-0000-000000000024",
  accFbBNI: "00000000-0000-0000-0000-000000000025",
  accIgBNI: "00000000-0000-0000-0000-000000000026",
  accTkBA: "00000000-0000-0000-0000-000000000027",
  postDraft: "00000000-0000-0000-0000-000000000101",
  postQueued: "00000000-0000-0000-0000-000000000102",
  postPublished: "00000000-0000-0000-0000-000000000103",
  postFailed: "00000000-0000-0000-0000-000000000104",
  postReview: "00000000-0000-0000-0000-000000000105",
  postPartial: "00000000-0000-0000-0000-000000000106",
  inbox1: "00000000-0000-0000-0000-000000000201",
  inbox2: "00000000-0000-0000-0000-000000000202",
  inbox3: "00000000-0000-0000-0000-000000000203",
};

async function upsertUser(
  email: string,
  name: string,
  passwordHash: string
) {
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });
}

async function main() {
  const passwordHash = await hash(DEMO_PASSWORD, 12);

  const admin = await upsertUser(
    "admin@socialmarka.com",
    "Sistem Yöneticisi",
    passwordHash
  );
  const editor = await upsertUser(
    "editor@socialmarka.com",
    "Ayşe Editör",
    passwordHash
  );
  const viewer = await upsertUser(
    "viewer@socialmarka.com",
    "Mehmet Müşteri",
    passwordHash
  );
  const brandAdmin = await upsertUser(
    "marka@socialmarka.com",
    "Zeynep Marka Admin",
    passwordHash
  );

  const workspace = await prisma.workspace.upsert({
    where: { id: IDS.wsBA },
    update: { name: "Beyin Atölyesi Dijital Ajans", isActive: true },
    create: {
      id: IDS.wsBA,
      name: "Beyin Atölyesi Dijital Ajans",
      isActive: true,
    },
  });

  const workspaceBNI = await prisma.workspace.upsert({
    where: { id: IDS.wsBNI },
    update: { name: "BNI DINAMIK", isActive: true },
    create: {
      id: IDS.wsBNI,
      name: "BNI DINAMIK",
      isActive: true,
    },
  });

  const workspacePassive = await prisma.workspace.upsert({
    where: { id: IDS.wsPassive },
    update: { name: "Eski Müşteri (Pasif)", isActive: false },
    create: {
      id: IDS.wsPassive,
      name: "Eski Müşteri (Pasif)",
      isActive: false,
    },
  });

  const memberships: Array<{
    userId: string;
    workspaceId: string;
    role: Role;
  }> = [
    { userId: admin.id, workspaceId: workspace.id, role: Role.SYSTEM_ADMIN },
    { userId: editor.id, workspaceId: workspace.id, role: Role.MEMBER },
    { userId: viewer.id, workspaceId: workspace.id, role: Role.VIEWER },
    { userId: brandAdmin.id, workspaceId: workspace.id, role: Role.ADMIN },
    { userId: admin.id, workspaceId: workspaceBNI.id, role: Role.SYSTEM_ADMIN },
    { userId: brandAdmin.id, workspaceId: workspaceBNI.id, role: Role.ADMIN },
    { userId: admin.id, workspaceId: workspacePassive.id, role: Role.SYSTEM_ADMIN },
  ];

  for (const m of memberships) {
    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: { userId: m.userId, workspaceId: m.workspaceId },
      },
      update: { role: m.role },
      create: m,
    });
  }

  const groupBA = await prisma.accountGroup.upsert({
    where: { id: IDS.groupBA },
    update: { name: "Beyin Atölyesi" },
    create: {
      id: IDS.groupBA,
      name: "Beyin Atölyesi",
      workspaceId: workspace.id,
    },
  });

  const groupBNI = await prisma.accountGroup.upsert({
    where: { id: IDS.groupBNI },
    update: { name: "BNI DINAMIK" },
    create: {
      id: IDS.groupBNI,
      name: "BNI DINAMIK",
      workspaceId: workspace.id,
    },
  });

  const accounts = [
    {
      id: IDS.accIgBA,
      provider: PlatformType.INSTAGRAM,
      providerAccountId: "seed_ig_beyinatolyesi",
      accountName: "Beyin Atölyesi Instagram",
      groups: [groupBA.id],
      status: AccountStatus.CONNECTED,
    },
    {
      id: IDS.accLiBA,
      provider: PlatformType.LINKEDIN,
      providerAccountId: "seed_li_beyinatolyesi",
      accountName: "Beyin Atölyesi Dijital Ajans Ltd.",
      groups: [groupBA.id],
      status: AccountStatus.CONNECTED,
    },
    {
      id: IDS.accYtBA,
      provider: PlatformType.YOUTUBE,
      providerAccountId: "seed_yt_beyinatolyesi",
      accountName: "Beyin Atölyesi YouTube",
      groups: [groupBA.id],
      status: AccountStatus.CONNECTED,
    },
    {
      id: IDS.accXBA,
      provider: PlatformType.X,
      providerAccountId: "seed_x_beyinatolyesi",
      accountName: "Beyin Atölyesi X",
      groups: [groupBA.id],
      status: AccountStatus.REQUIRES_REAUTH,
    },
    {
      id: IDS.accFbBNI,
      provider: PlatformType.FACEBOOK,
      providerAccountId: "seed_fb_bnidinamik",
      accountName: "BNI DINAMIK Facebook",
      groups: [groupBNI.id],
      status: AccountStatus.CONNECTED,
    },
    {
      id: IDS.accIgBNI,
      provider: PlatformType.INSTAGRAM,
      providerAccountId: "seed_ig_bnidinamik",
      accountName: "BNI DINAMIK Instagram",
      groups: [groupBNI.id],
      status: AccountStatus.CONNECTED,
    },
    {
      id: IDS.accTkBA,
      provider: PlatformType.TIKTOK,
      providerAccountId: "seed_tt_beyinatolyesi",
      accountName: "Beyin Atölyesi TikTok",
      groups: [groupBA.id],
      status: AccountStatus.CONNECTED,
    },
  ];

  for (const a of accounts) {
    await prisma.socialAccount.upsert({
      where: { id: a.id },
      update: {
        accountName: a.accountName,
        status: a.status,
        lastConnectedBy: admin.name ?? admin.email,
        encryptedAccessToken: "sm_access_seed_local_token",
        groups: { set: a.groups.map((id) => ({ id })) },
      },
      create: {
        id: a.id,
        provider: a.provider,
        providerAccountId: a.providerAccountId,
        accountName: a.accountName,
        status: a.status,
        lastConnectedBy: admin.name ?? admin.email,
        encryptedAccessToken: "sm_access_seed_local_token",
        workspaceId: workspace.id,
        groups: { connect: a.groups.map((id) => ({ id })) },
      },
    });
  }

  // Demo postları yeniden oluştur (idempotent)
  const demoPostIds = [
    IDS.postDraft,
    IDS.postQueued,
    IDS.postPublished,
    IDS.postFailed,
    IDS.postReview,
    IDS.postPartial,
  ];
  await prisma.postTarget.deleteMany({ where: { postId: { in: demoPostIds } } });
  await prisma.mediaAsset.deleteMany({ where: { postId: { in: demoPostIds } } });
  await prisma.post.deleteMany({ where: { id: { in: demoPostIds } } });

  const now = Date.now();
  const inHours = (h: number) => new Date(now + h * 60 * 60_000);
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60_000);

  await prisma.post.create({
    data: {
      id: IDS.postDraft,
      content: "Taslak: Yaz kampanyası fikri — henüz yayınlanmadı.",
      status: PostStatus.DRAFT,
      workspaceId: workspace.id,
      targets: {
        create: [{ socialAccountId: IDS.accIgBA, status: TargetStatus.PENDING }],
      },
    },
  });

  await prisma.post.create({
    data: {
      id: IDS.postQueued,
      content:
        "Yeni dönem kampanyamız yayında! Marka hikâyenizi sosyal medyada büyütün. #SocialMarka",
      status: PostStatus.SCHEDULED,
      scheduledAt: inHours(26),
      workspaceId: workspace.id,
      targets: {
        create: [
          {
            socialAccountId: IDS.accIgBA,
            platformContent:
              "Yeni dönem kampanyamız yayında! 🚀 Marka hikâyenizi büyütün. #SocialMarka",
            status: TargetStatus.PENDING,
          },
          {
            socialAccountId: IDS.accLiBA,
            platformContent:
              "Ajans müşterilerimiz için yeni içerik takvimi hazır. Detaylar LinkedIn'de.",
            status: TargetStatus.PENDING,
          },
        ],
      },
      media: {
        create: {
          originalUrl: "https://picsum.photos/seed/sm-queued/1200/800",
          mimeType: "image/jpeg",
          thumbnailUrl: "https://picsum.photos/seed/sm-queued/400/300",
          status: "READY",
        },
      },
    },
  });

  await prisma.post.create({
    data: {
      id: IDS.postPublished,
      content: "Başarıyla yayınlanan örnek gönderi — Q2 rapor özeti.",
      status: PostStatus.PUBLISHED,
      scheduledAt: daysAgo(2),
      workspaceId: workspace.id,
      targets: {
        create: [
          {
            socialAccountId: IDS.accIgBA,
            status: TargetStatus.PUBLISHED,
            publishedAt: daysAgo(2),
            remotePostId: "ig_remote_1001",
          },
          {
            socialAccountId: IDS.accLiBA,
            status: TargetStatus.PUBLISHED,
            publishedAt: daysAgo(2),
            remotePostId: "li_remote_1001",
          },
        ],
      },
      media: {
        create: {
          originalUrl: "https://picsum.photos/seed/sm-pub/1200/800",
          mimeType: "image/jpeg",
          thumbnailUrl: "https://picsum.photos/seed/sm-pub/400/300",
          status: "READY",
        },
      },
    },
  });

  await prisma.post.create({
    data: {
      id: IDS.postFailed,
      content: "Bu gönderi canlı OAuth olmadığı için yayınlanamadı (demo hata).",
      status: PostStatus.FAILED,
      scheduledAt: daysAgo(1),
      workspaceId: workspace.id,
      targets: {
        create: [
          {
            socialAccountId: IDS.accXBA,
            status: TargetStatus.FAILED,
            errorMessage:
              "Hesap canlı bağlı değil (yerel seed token). Lütfen yeniden bağlayın.",
          },
        ],
      },
    },
  });

  await prisma.post.create({
    data: {
      id: IDS.postReview,
      content: "Onay bekleyen müşteri içeriği — VIEWER onay sonrası yayınlanacak.",
      status: PostStatus.PENDING_REVIEW,
      scheduledAt: inHours(48),
      workspaceId: workspace.id,
      targets: {
        create: [
          {
            socialAccountId: IDS.accFbBNI,
            status: TargetStatus.PENDING,
          },
          {
            socialAccountId: IDS.accIgBNI,
            status: TargetStatus.PENDING,
          },
        ],
      },
    },
  });

  await prisma.post.create({
    data: {
      id: IDS.postPartial,
      content: "Kısmi başarısız: Instagram OK, LinkedIn hata.",
      status: PostStatus.PARTIAL_FAILED,
      scheduledAt: daysAgo(0.5),
      workspaceId: workspace.id,
      targets: {
        create: [
          {
            socialAccountId: IDS.accIgBA,
            status: TargetStatus.PUBLISHED,
            publishedAt: daysAgo(0.5),
            remotePostId: "ig_remote_2002",
          },
          {
            socialAccountId: IDS.accLiBA,
            status: TargetStatus.FAILED,
            errorMessage: "LinkedIn API rate limit (demo).",
          },
        ],
      },
    },
  });

  // Takvim yoğunluğu için ek zamanlanmış postlar
  for (let i = 0; i < 5; i++) {
    const id = `00000000-0000-0000-0000-00000000011${i}`;
    await prisma.postTarget.deleteMany({ where: { postId: id } });
    await prisma.post.deleteMany({ where: { id } });
    await prisma.post.create({
      data: {
        id,
        content: `Takvim demo #${i + 1}: Haftalık içerik planı parçası.`,
        status: PostStatus.SCHEDULED,
        scheduledAt: inHours(12 + i * 18),
        workspaceId: workspace.id,
        targets: {
          create: [
            {
              socialAccountId: i % 2 === 0 ? IDS.accIgBA : IDS.accYtBA,
              status: TargetStatus.PENDING,
            },
          ],
        },
      },
    });
  }

  // Inbox
  await prisma.inboxMessage.deleteMany({
    where: { conversationId: { in: [IDS.inbox1, IDS.inbox2, IDS.inbox3] } },
  });
  await prisma.inboxConversation.deleteMany({
    where: { id: { in: [IDS.inbox1, IDS.inbox2, IDS.inbox3] } },
  });

  await prisma.inboxConversation.create({
    data: {
      id: IDS.inbox1,
      workspaceId: workspace.id,
      socialAccountId: IDS.accIgBA,
      senderName: "Elif Kaya",
      senderAvatar: "https://i.pravatar.cc/100?u=elif",
      lastMessage: "Kampanya görselleri harika olmuş, teşekkürler!",
      lastMessageAt: new Date(now - 2 * 60_000),
      isRead: false,
      type: InboxType.DIRECT_MESSAGE,
      messages: {
        create: [
          {
            senderType: SenderType.USER,
            messageText: "Merhaba, işbirliği için yazıyorum.",
            createdAt: new Date(now - 30 * 60_000),
          },
          {
            senderType: SenderType.AGENT,
            messageText: "Merhaba Elif! Size nasıl yardımcı olabiliriz?",
            createdAt: new Date(now - 20 * 60_000),
          },
          {
            senderType: SenderType.USER,
            messageText: "Kampanya görselleri harika olmuş, teşekkürler!",
            createdAt: new Date(now - 2 * 60_000),
          },
        ],
      },
    },
  });

  await prisma.inboxConversation.create({
    data: {
      id: IDS.inbox2,
      workspaceId: workspace.id,
      socialAccountId: IDS.accLiBA,
      senderName: "Can Demir",
      senderAvatar: "https://i.pravatar.cc/100?u=can",
      lastMessage: "Fiyat teklifinizi bekliyorum.",
      lastMessageAt: new Date(now - 3 * 60 * 60_000),
      isRead: true,
      type: InboxType.DIRECT_MESSAGE,
      messages: {
        create: [
          {
            senderType: SenderType.USER,
            messageText: "LinkedIn üzerinden ajans hizmetleriniz hakkında bilgi alabilir miyim?",
          },
          {
            senderType: SenderType.USER,
            messageText: "Fiyat teklifinizi bekliyorum.",
          },
        ],
      },
    },
  });

  await prisma.inboxConversation.create({
    data: {
      id: IDS.inbox3,
      workspaceId: workspace.id,
      socialAccountId: IDS.accIgBNI,
      senderName: "Selin Yılmaz",
      senderAvatar: "https://i.pravatar.cc/100?u=selin",
      lastMessage: "Bu etkinlik ne zaman?",
      lastMessageAt: new Date(now - 45 * 60_000),
      isRead: false,
      type: InboxType.COMMENT,
      messages: {
        create: [
          {
            senderType: SenderType.USER,
            messageText: "Bu etkinlik ne zaman?",
          },
        ],
      },
    },
  });

  // Analytics
  for (const accId of [
    IDS.accIgBA,
    IDS.accLiBA,
    IDS.accYtBA,
    IDS.accFbBNI,
    IDS.accIgBNI,
    IDS.accTkBA,
  ]) {
    await prisma.analyticsSnapshot.deleteMany({ where: { socialAccountId: accId } });
    const base = 800 + Math.floor(Math.random() * 4000);
    for (let d = 6; d >= 0; d--) {
      await prisma.analyticsSnapshot.create({
        data: {
          socialAccountId: accId,
          followers: base + (6 - d) * 12,
          following: 180 + d,
          impressions: 4000 + (6 - d) * 350,
          reach: 2500 + (6 - d) * 200,
          likes: 80 + (6 - d) * 15,
          comments: 12 + (6 - d) * 3,
          postsCount: 20 + (6 - d),
          capturedAt: daysAgo(d),
        },
      });
    }
  }

  // Audit logs (seed işareti ile)
  for (const a of [
    { action: "POST_CREATED", userId: editor.id },
    { action: "POST_UPDATED", userId: editor.id },
    { action: "ACCOUNT_CONNECTED", userId: brandAdmin.id },
    { action: "ROLE_CHANGED", userId: admin.id },
    { action: "MEMBER_ADDED", userId: admin.id },
    { action: "WORKSPACE_CREATED", userId: admin.id },
    { action: "RETRY_FAILED", userId: admin.id },
  ] as const) {
    await prisma.auditLog.create({
      data: {
        action: a.action,
        details: { seed: true },
        userId: a.userId,
        workspaceId: workspace.id,
      },
    });
  }

  await prisma.systemMetricSnapshot.create({
    data: {
      totalUsers: 4,
      totalWorkspaces: 3,
      totalSocialAccounts: accounts.filter((a) => a.status === AccountStatus.CONNECTED).length,
      totalPublishedPosts: 1,
      totalQueuedPosts: 6,
      totalFailedPosts: 2,
    },
  });

  console.log("\n✅ Demo seed tamamlandı\n");
  console.log("Giriş (şifre hepsi aynı):", DEMO_PASSWORD);
  console.log("  admin@socialmarka.com   → SYSTEM_ADMIN (Yönetim paneli)");
  console.log("  marka@socialmarka.com   → ADMIN");
  console.log("  editor@socialmarka.com  → MEMBER (Editör)");
  console.log("  viewer@socialmarka.com  → VIEWER");
  console.log("\nWorkspace'ler:");
  console.log("  •", workspace.name);
  console.log("  •", workspaceBNI.name);
  console.log("  •", workspacePassive.name, "(pasif)");
  console.log("\nVeri: 7 hesap, 11 post, 3 inbox, analitik, audit log\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

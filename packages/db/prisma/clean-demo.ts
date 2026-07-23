/**
 * Demo / seed verilerini temizler.
 * Tek temiz admin hesabı bırakır: admin@socialmarka.com / Demo123!
 */
import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAILS = [
  "admin@socialmarka.com",
  "editor@socialmarka.com",
  "viewer@socialmarka.com",
  "marka@socialmarka.com",
];

const SEED_IDS = [
  "00000000-0000-0000-0000-000000000001",
  "00000000-0000-0000-0000-000000000002",
  "00000000-0000-0000-0000-000000000003",
  "00000000-0000-0000-0000-000000000011",
  "00000000-0000-0000-0000-000000000012",
  "00000000-0000-0000-0000-000000000021",
  "00000000-0000-0000-0000-000000000022",
  "00000000-0000-0000-0000-000000000023",
  "00000000-0000-0000-0000-000000000024",
  "00000000-0000-0000-0000-000000000025",
  "00000000-0000-0000-0000-000000000026",
  "00000000-0000-0000-0000-000000000027",
  "00000000-0000-0000-0000-000000000101",
  "00000000-0000-0000-0000-000000000102",
  "00000000-0000-0000-0000-000000000103",
  "00000000-0000-0000-0000-000000000104",
  "00000000-0000-0000-0000-000000000105",
  "00000000-0000-0000-0000-000000000106",
  "00000000-0000-0000-0000-000000000110",
  "00000000-0000-0000-0000-000000000111",
  "00000000-0000-0000-0000-000000000112",
  "00000000-0000-0000-0000-000000000113",
  "00000000-0000-0000-0000-000000000114",
  "00000000-0000-0000-0000-000000000201",
  "00000000-0000-0000-0000-000000000202",
  "00000000-0000-0000-0000-000000000203",
];

async function main() {
  console.log("Demo veriler temizleniyor...");

  await prisma.inboxMessage.deleteMany({});
  await prisma.inboxConversation.deleteMany({});
  await prisma.analyticsSnapshot.deleteMany({});
  await prisma.systemMetricSnapshot.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.webhookEvent.deleteMany({});
  await prisma.postTarget.deleteMany({});
  await prisma.mediaAsset.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.socialAccount.deleteMany({});
  await prisma.accountGroup.deleteMany({});
  await prisma.workspaceMember.deleteMany({});
  await prisma.workspace.deleteMany({});

  // Demo kullanıcılar + oturumlar
  const demoUsers = await prisma.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { id: true },
  });
  const demoIds = demoUsers.map((u) => u.id);
  if (demoIds.length) {
    await prisma.session.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.account.deleteMany({ where: { userId: { in: demoIds } } });
    await prisma.user.deleteMany({ where: { id: { in: demoIds } } });
  }

  // Sabit seed id artıkları (varsa)
  await prisma.post.deleteMany({ where: { id: { in: SEED_IDS } } });
  await prisma.socialAccount.deleteMany({ where: { id: { in: SEED_IDS } } });
  await prisma.workspace.deleteMany({ where: { id: { in: SEED_IDS } } });

  const passwordHash = await hash("Demo123!", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@socialmarka.com",
      name: "Sistem Yöneticisi",
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: "Benim Çalışma Alanım",
      members: {
        create: { userId: admin.id, role: Role.SYSTEM_ADMIN },
      },
    },
  });

  console.log("\n✅ Demo veriler silindi. Temiz başlangıç hazır.\n");
  console.log("Giriş:");
  console.log("  E-posta: admin@socialmarka.com");
  console.log("  Şifre:   Demo123!");
  console.log("  Workspace:", workspace.name);
  console.log("\nHesaplar, gönderiler, inbox boş — kendin bağlayıp deneyebilirsin.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

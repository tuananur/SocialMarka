import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const local = await prisma.socialAccount.deleteMany({
    where: {
      provider: "LINKEDIN",
      OR: [
        { providerAccountId: { startsWith: "local_" } },
        { encryptedAccessToken: { startsWith: "sm_access_" } },
      ],
    },
  });
  console.log("Silinen yerel LinkedIn:", local.count);

  const remaining = await prisma.socialAccount.findMany({
    where: { provider: "LINKEDIN" },
    select: { accountName: true, status: true, providerAccountId: true },
  });
  console.log("Kalan LinkedIn:", remaining);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

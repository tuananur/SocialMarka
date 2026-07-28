const { PrismaClient } = require("c:/Users/Casper/Desktop/socailmarka/node_modules/@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_z6TouiV9LBHG@ep-soft-union-alyt40nb-pooler.c-3.eu-central-1.aws.neon.tech/socialmarka?sslmode=require"
    }
  }
});

async function main() {
  console.log("=== ALL SOCIAL ACCOUNTS ===");
  const accounts = await prisma.socialAccount.findMany({
    select: {
      id: true,
      provider: true,
      accountName: true,
      providerAccountId: true,
      status: true,
      createdAt: true
    }
  });
  console.log(accounts);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

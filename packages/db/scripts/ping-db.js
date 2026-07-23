const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

prisma
  .$queryRaw`SELECT 1 as ok`
  .then(() => {
    console.log("DB_OK");
    return prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("DB_FAIL", e.message);
    await prisma.$disconnect();
    process.exit(1);
  });

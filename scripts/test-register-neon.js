const { PrismaClient, Role } = require("@prisma/client");
const { hash } = require("bcryptjs");

async function main() {
  const prisma = new PrismaClient();
  const email = `sm${Date.now()}@test.com`;
  try {
    const passwordHash = await hash("Demo123!", 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: "Test User",
        passwordHash,
      },
    });
    const workspace = await prisma.workspace.create({
      data: {
        name: `${user.name} Çalışma Alanı`,
        members: {
          create: { userId: user.id, role: Role.ADMIN },
        },
      },
    });
    console.log("OK", { userId: user.id, workspaceId: workspace.id });
  } catch (e) {
    console.error("FAIL", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

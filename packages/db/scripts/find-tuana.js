const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: "tuana", mode: "insensitive" } },
        { email: { contains: "tuana", mode: "insensitive" } },
      ],
    },
    include: {
      workspaceMembers: { include: { workspace: true } },
      accounts: true,
      sessions: true,
    },
  });

  if (users.length === 0) {
    const all = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    console.log("Tuana bulunamadı. Son kullanıcılar:");
    console.log(JSON.stringify(all, null, 2));
    return;
  }

  console.log("Bulunan kullanıcılar:");
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

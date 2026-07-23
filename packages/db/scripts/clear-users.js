const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, passwordHash: true },
  });
  console.log("BEFORE_USERS", JSON.stringify(users, null, 2));
  console.log("BEFORE_COUNT", users.length);

  // AuditLog has no cascade — delete first
  const audit = await prisma.auditLog.deleteMany({});
  console.log("deleted_audit", audit.count);

  const sessions = await prisma.session.deleteMany({});
  console.log("deleted_sessions", sessions.count);

  const accounts = await prisma.account.deleteMany({});
  console.log("deleted_accounts", accounts.count);

  const members = await prisma.workspaceMember.deleteMany({});
  console.log("deleted_members", members.count);

  const deletedUsers = await prisma.user.deleteMany({});
  console.log("deleted_users", deletedUsers.count);

  // Clean empty workspaces and related data
  await prisma.postTarget.deleteMany({});
  await prisma.mediaAsset.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.inboxMessage.deleteMany({});
  await prisma.inboxConversation.deleteMany({});
  await prisma.analyticsSnapshot.deleteMany({});
  await prisma.socialAccount.deleteMany({});
  await prisma.accountGroup.deleteMany({});
  await prisma.workspace.deleteMany({});

  const after = await prisma.user.count();
  console.log("AFTER_USER_COUNT", after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

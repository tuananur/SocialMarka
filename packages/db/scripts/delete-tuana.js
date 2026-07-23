const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const USER_ID = "cmrv0ih8b0001uaco51dvi5wl";
const WORKSPACE_ID = "916e7f95-1eb5-40de-967a-adaec22fe657";

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: USER_ID },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    console.log("Kullanıcı zaten yok.");
    return;
  }

  console.log("Siliniyor:", user.name, user.email);

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany({
      where: { OR: [{ userId: USER_ID }, { workspaceId: WORKSPACE_ID }] },
    });

    // Inbox / posts / accounts cascade from workspace
    await tx.inboxMessage.deleteMany({
      where: { conversation: { workspaceId: WORKSPACE_ID } },
    });
    await tx.inboxConversation.deleteMany({ where: { workspaceId: WORKSPACE_ID } });
    await tx.postTarget.deleteMany({ where: { post: { workspaceId: WORKSPACE_ID } } });
    await tx.mediaAsset.deleteMany({ where: { post: { workspaceId: WORKSPACE_ID } } });
    await tx.post.deleteMany({ where: { workspaceId: WORKSPACE_ID } });
    await tx.analyticsSnapshot.deleteMany({
      where: { socialAccount: { workspaceId: WORKSPACE_ID } },
    });
    await tx.socialAccount.deleteMany({ where: { workspaceId: WORKSPACE_ID } });
    await tx.accountGroup.deleteMany({ where: { workspaceId: WORKSPACE_ID } });
    await tx.workspaceMember.deleteMany({ where: { workspaceId: WORKSPACE_ID } });
    await tx.workspace.deleteMany({ where: { id: WORKSPACE_ID } });

    await tx.account.deleteMany({ where: { userId: USER_ID } });
    await tx.session.deleteMany({ where: { userId: USER_ID } });
    await tx.workspaceMember.deleteMany({ where: { userId: USER_ID } });
    await tx.user.delete({ where: { id: USER_ID } });
  });

  console.log("Tuana kullanıcısı, workspace ve ilişkili tüm veriler silindi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

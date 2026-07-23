import { NextResponse } from "next/server";
import { prisma, AccountStatus } from "@socialmarka/db";
import { getWorkspaceContext, canManageAccounts } from "@/lib/rbac";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canManageAccounts(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const account = await prisma.socialAccount.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!account) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  await prisma.socialAccount.update({
    where: { id },
    data: {
      status: AccountStatus.DISCONNECTED,
      encryptedAccessToken: null,
      encryptedRefreshToken: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "ACCOUNT_DISCONNECTED",
      details: { accountId: id },
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });

  return NextResponse.json({ ok: true });
}

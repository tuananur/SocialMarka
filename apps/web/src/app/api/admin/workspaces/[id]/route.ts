import { NextResponse } from "next/server";
import { prisma, Role } from "@socialmarka/db";
import { getWorkspaceContext, canAccessAdmin } from "@/lib/rbac";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canAccessAdmin(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  // SYSTEM_ADMIN tüm workspace'leri; ADMIN yalnızca kendi workspace'ini
  if (ctx.role !== Role.SYSTEM_ADMIN && id !== ctx.workspaceId) {
    return NextResponse.json({ error: "Bu workspace için yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const isActive = !!body.isActive;

  const workspace = await prisma.workspace.update({
    where: { id },
    data: { isActive },
  });

  await prisma.auditLog.create({
    data: {
      action: isActive ? "WORKSPACE_ACTIVATED" : "WORKSPACE_DEACTIVATED",
      details: { workspaceId: id, isActive },
      userId: ctx.userId,
      workspaceId: id,
    },
  });

  return NextResponse.json({ workspace });
}

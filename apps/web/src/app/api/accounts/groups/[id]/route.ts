import { NextResponse } from "next/server";
import { prisma } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Params) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

  const { id } = await params;

  const group = await prisma.accountGroup.findFirst({
    where: { id, workspaceId: ctx.workspaceId }
  });

  if (!group) return NextResponse.json({ error: "Grup bulunamadı" }, { status: 404 });

  await prisma.accountGroup.delete({
    where: { id }
  });

  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: Params) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

  const { id } = await params;

  const body = await req.json();
  const name = String(body.name || "").trim();
  const accountIds = body.accountIds;

  const group = await prisma.accountGroup.findFirst({
    where: { id, workspaceId: ctx.workspaceId }
  });

  if (!group) return NextResponse.json({ error: "Grup bulunamadı" }, { status: 404 });

  const updated = await prisma.accountGroup.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(Array.isArray(accountIds) ? {
        accounts: {
          set: accountIds.map((id: string) => ({ id }))
        }
      } : {})
    },
    include: { accounts: true }
  });

  return NextResponse.json({ success: true, group: updated });
}

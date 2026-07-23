import { NextResponse } from "next/server";
import { prisma, Role } from "@socialmarka/db";
import { getWorkspaceContext, canAccessAdmin } from "@/lib/rbac";

export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canAccessAdmin(ctx.role) || ctx.role !== Role.SYSTEM_ADMIN) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Ad gerekli" }, { status: 400 });

  const workspace = await prisma.workspace.create({
    data: {
      name,
      members: {
        create: { userId: ctx.userId, role: Role.ADMIN },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "WORKSPACE_CREATED",
      details: { workspaceId: workspace.id },
      userId: ctx.userId,
      workspaceId: workspace.id,
    },
  });

  return NextResponse.json({ workspace });
}

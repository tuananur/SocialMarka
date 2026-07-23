import { NextResponse } from "next/server";
import { prisma, Role } from "@socialmarka/db";
import { getWorkspaceContext, canAccessAdmin } from "@/lib/rbac";

/** Workspace üyelerini listele */
export async function GET() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canAccessAdmin(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: ctx.workspaceId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { role: "asc" },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      userId: m.userId,
      user: m.user,
    })),
  });
}

/** E-posta ile üye ekle (mevcut kullanıcı) */
export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canAccessAdmin(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const role = (body.role as Role) || Role.MEMBER;

  if (!email) return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  if (role !== Role.ADMIN && role !== Role.MEMBER && role !== Role.VIEWER) {
    return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "Bu e-posta ile kayıtlı kullanıcı yok. Önce kayıt olmalı." },
      { status: 404 }
    );
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: user.id, workspaceId: ctx.workspaceId },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Kullanıcı zaten bu workspace’te" }, { status: 409 });
  }

  const member = await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId: ctx.workspaceId,
      role,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "MEMBER_ADDED",
      details: { userId: user.id, email, role },
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });

  return NextResponse.json({
    member: {
      id: member.id,
      role: member.role,
      userId: member.userId,
      user: member.user,
    },
  });
}

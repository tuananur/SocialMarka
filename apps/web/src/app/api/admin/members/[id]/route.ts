import { NextResponse } from "next/server";
import { prisma, Role } from "@socialmarka/db";
import { getWorkspaceContext, canAccessAdmin } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

/** Üye rolünü değiştir veya üyeyi çıkar */
export async function PATCH(req: Request, { params }: Params) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canAccessAdmin(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const role = body.role as Role;

  const member = await prisma.workspaceMember.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!member) return NextResponse.json({ error: "Üye bulunamadı" }, { status: 404 });

  if (member.userId === ctx.userId && role && role !== member.role) {
    return NextResponse.json({ error: "Kendi rolünüzü değiştiremezsiniz" }, { status: 400 });
  }

  if (member.role === Role.SYSTEM_ADMIN && ctx.role !== Role.SYSTEM_ADMIN) {
    return NextResponse.json({ error: "SYSTEM_ADMIN rolü değiştirilemez" }, { status: 403 });
  }

  if (
    role !== Role.ADMIN &&
    role !== Role.MEMBER &&
    role !== Role.VIEWER &&
    role !== Role.SYSTEM_ADMIN
  ) {
    return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
  }
  if (role === Role.SYSTEM_ADMIN && ctx.role !== Role.SYSTEM_ADMIN) {
    return NextResponse.json({ error: "SYSTEM_ADMIN atayamazsınız" }, { status: 403 });
  }

  const updated = await prisma.workspaceMember.update({
    where: { id },
    data: { role },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "ROLE_CHANGED",
      details: {
        memberId: id,
        userId: member.userId,
        from: member.role,
        to: role,
      },
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });

  return NextResponse.json({
    member: {
      id: updated.id,
      role: updated.role,
      userId: updated.userId,
      user: updated.user,
    },
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canAccessAdmin(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const member = await prisma.workspaceMember.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!member) return NextResponse.json({ error: "Üye bulunamadı" }, { status: 404 });

  if (member.userId === ctx.userId) {
    return NextResponse.json({ error: "Kendinizi çıkaramazsınız" }, { status: 400 });
  }
  if (member.role === Role.SYSTEM_ADMIN && ctx.role !== Role.SYSTEM_ADMIN) {
    return NextResponse.json({ error: "SYSTEM_ADMIN çıkarılamaz" }, { status: 403 });
  }

  await prisma.workspaceMember.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: "MEMBER_REMOVED",
      details: { userId: member.userId, role: member.role },
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma, TargetStatus, PostStatus, Role } from "@socialmarka/db";
import { getWorkspaceContext, canAccessAdmin } from "@/lib/rbac";
import { enqueuePublish } from "@socialmarka/queue";

export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canAccessAdmin(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  let scope = "workspace";
  try {
    const body = await req.json();
    if (body?.scope === "all" && ctx.role === Role.SYSTEM_ADMIN) {
      scope = "all";
    }
  } catch {
    /* boş body */
  }

  const failedTargets = await prisma.postTarget.findMany({
    where: {
      status: TargetStatus.FAILED,
      ...(scope === "workspace" ? { post: { workspaceId: ctx.workspaceId } } : {}),
    },
    take: 200,
  });

  for (const t of failedTargets) {
    await prisma.postTarget.update({
      where: { id: t.id },
      data: { status: TargetStatus.PENDING, errorMessage: null },
    });
    await enqueuePublish({ postId: t.postId, postTargetId: t.id }, { delay: 0 });
    await prisma.post.update({
      where: { id: t.postId },
      data: { status: PostStatus.SCHEDULED },
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "RETRY_FAILED",
      details: { count: failedTargets.length, scope },
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });

  return NextResponse.json({
    ok: true,
    message: `${failedTargets.length} başarısız hedef yeniden kuyruğa alındı${
      scope === "all" ? " (tüm sistem)" : ""
    }.`,
  });
}

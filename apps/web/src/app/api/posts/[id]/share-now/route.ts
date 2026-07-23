import { NextResponse } from "next/server";
import { prisma, PostStatus, TargetStatus } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { enqueuePublish } from "@socialmarka/queue";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const post = await prisma.post.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
    include: { targets: true },
  });
  if (!post) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  await prisma.postTarget.updateMany({
    where: {
      postId: post.id,
      status: { in: [TargetStatus.PENDING, TargetStatus.FAILED] },
    },
    data: { status: TargetStatus.PENDING, errorMessage: null },
  });

  const targets = await prisma.postTarget.findMany({
    where: { postId: post.id, status: TargetStatus.PENDING },
  });

  for (const t of targets) {
    await enqueuePublish({ postId: post.id, postTargetId: t.id }, { delay: 0 });
  }

  await prisma.post.update({
    where: { id: post.id },
    data: { status: PostStatus.SCHEDULED, scheduledAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      action: "POST_SHARE_NOW",
      details: { postId: post.id },
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma, PostStatus, TargetStatus } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { publishPostTargetInline } from "@/lib/run-publish";

export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const post = await prisma.post.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
    include: { targets: true, media: true },
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
    include: { socialAccount: { select: { provider: true } } },
  });

  const results: { provider: string; success: boolean; error?: string; remotePostId?: string }[] =
    [];

  for (const t of targets) {
    const r = await publishPostTargetInline({
      postId: post.id,
      postTargetId: t.id,
    });
    results.push({
      provider: t.socialAccount.provider,
      success: !!r.success,
      error: "error" in r ? r.error : r.errorMessage,
      remotePostId: "remotePostId" in r ? r.remotePostId : undefined,
    });
  }

  // Recompute status from targets (do not force SCHEDULED)
  const updated = await prisma.post.findUnique({
    where: { id: post.id },
    include: {
      targets: { include: { socialAccount: true } },
      media: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "POST_SHARE_NOW",
      details: { postId: post.id, results },
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });

  return NextResponse.json({
    ok: true,
    results,
    post: updated,
    status: updated?.status || PostStatus.SCHEDULED,
  });
}

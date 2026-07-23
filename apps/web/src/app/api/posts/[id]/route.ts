import { NextResponse } from "next/server";
import { prisma } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { cancelJob, QUEUE_NAMES } from "@socialmarka/queue";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const post = await prisma.post.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!post) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  if (post.bullJobId) {
    try {
      await cancelJob(QUEUE_NAMES.PUBLISH, post.bullJobId);
    } catch {
      /* ignore */
    }
  }

  await prisma.mediaAsset.updateMany({ where: { postId: id }, data: { postId: null } });
  await prisma.post.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: "POST_DELETED",
      details: { postId: id },
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });

  return NextResponse.json({ ok: true });
}

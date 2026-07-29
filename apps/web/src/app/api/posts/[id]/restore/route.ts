import { NextResponse } from "next/server";
import { prisma, PostStatus, TargetStatus } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { publishPostTargetInline } from "@/lib/run-publish";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const post = await prisma.post.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
    include: { targets: true },
  });
  if (!post) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  // 1. Restore post
  await prisma.post.update({
    where: { id },
    data: {
      isDeleted: false,
    },
  });

  // 2. Set all targets to PENDING
  await prisma.postTarget.updateMany({
    where: { postId: id },
    data: { status: TargetStatus.PENDING, errorMessage: null },
  });

  // 3. Publish to each target inline
  const targets = await prisma.postTarget.findMany({
    where: { postId: id, status: TargetStatus.PENDING },
  });

  const results: any[] = [];
  for (const t of targets) {
    const r = await publishPostTargetInline({
      postId: id,
      postTargetId: t.id,
    });
    results.push({
      success: !!r.success,
      error: "error" in r ? r.error : r.errorMessage,
    });
  }

  return NextResponse.json({ ok: true, results });
}

import { NextResponse } from "next/server";
import { prisma, PostStatus } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";

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
  });
  if (!post) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  await prisma.post.update({
    where: { id },
    data: {
      isDeleted: false,
      status: PostStatus.DRAFT, // Restore as draft
    },
  });

  return NextResponse.json({ ok: true });
}

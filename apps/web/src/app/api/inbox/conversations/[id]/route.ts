import { NextResponse } from "next/server";
import { prisma } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const conversation = await prisma.inboxConversation.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Konuşma bulunamadı" }, { status: 404 });
  }

  await prisma.inboxConversation.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}

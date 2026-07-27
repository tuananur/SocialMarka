import { NextResponse } from "next/server";
import { prisma } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { cancelJob, QUEUE_NAMES } from "@socialmarka/queue";
import { deleteRemotePost, resolveAccessToken } from "@socialmarka/shared";

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
    include: {
      targets: {
        include: { socialAccount: true },
      },
    },
  });
  if (!post) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  if (post.bullJobId) {
    try {
      await cancelJob(QUEUE_NAMES.PUBLISH, post.bullJobId);
    } catch {
      /* ignore */
    }
  }

  // Yayınlanmış tüm platform gönderilerini ilgili sosyal ağ API'lerinden ve gelen kutusundan sil
  const deletionResults: Array<{ platform: string; remotePostId: string; success: boolean; error?: string }> = [];
  for (const target of post.targets) {
    if (target.remotePostId) {
      try {
        await prisma.inboxConversation.deleteMany({
          where: { workspaceId: ctx.workspaceId, remoteId: target.remotePostId },
        });
      } catch {
        /* ignore */
      }
    }

    if (target.status === "PUBLISHED" && target.remotePostId && target.socialAccount) {
      try {
        const accessToken = resolveAccessToken(target.socialAccount.encryptedAccessToken);
        const result = await deleteRemotePost({
          platform: target.socialAccount.provider,
          accessToken,
          remotePostId: target.remotePostId,
        });
        deletionResults.push({
          platform: target.socialAccount.provider,
          remotePostId: target.remotePostId,
          ...result,
        });
      } catch (err: any) {
        console.error(`[DELETE post] ${target.socialAccount.provider} remote deletion error:`, err);
        deletionResults.push({
          platform: target.socialAccount.provider,
          remotePostId: target.remotePostId,
          success: false,
          error: err?.message || "Uzaktan silme hatası",
        });
      }
    }
  }

  // Soft delete the post in DB
  await prisma.post.update({
    where: { id },
    data: {
      isDeleted: true,
      bullJobId: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "POST_DELETED",
      details: { postId: id, deletionResults },
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });

  return NextResponse.json({ ok: true, deletionResults });
}

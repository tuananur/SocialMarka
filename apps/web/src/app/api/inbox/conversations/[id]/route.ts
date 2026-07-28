import { NextResponse } from "next/server";
import { prisma } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { decryptToken } from "@socialmarka/shared";

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

  // Delete live comment on the social network if remoteId is present
  if (conversation.remoteId && conversation.type === "COMMENT") {
    try {
      const account = await prisma.socialAccount.findUnique({
        where: { id: conversation.socialAccountId },
      });

      if (account && account.encryptedAccessToken) {
        const accessToken = decryptToken(account.encryptedAccessToken);

        if (account.provider === "YOUTUBE") {
          await fetch(
            `https://www.googleapis.com/youtube/v3/comments?id=${encodeURIComponent(conversation.remoteId)}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
        } else if (account.provider === "INSTAGRAM" || account.provider === "FACEBOOK") {
          await fetch(
            `https://graph.facebook.com/v19.0/${encodeURIComponent(conversation.remoteId)}?access_token=${encodeURIComponent(accessToken)}`,
            {
              method: "DELETE",
            }
          );
        }
      }
    } catch (remoteErr: any) {
      console.error("[DeleteRemoteComment] Error deleting live comment:", remoteErr?.message || remoteErr);
    }
  }

  await prisma.inboxConversation.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}

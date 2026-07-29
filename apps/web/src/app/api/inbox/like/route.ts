import { NextResponse } from "next/server";
import { prisma } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { getPlatformAdapter } from "@socialmarka/shared";
import { getFreshAccessToken } from "@/lib/tokens";

export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

  const body = await req.json();
  const messageId = body.messageId;
  const liked = body.liked;

  if (!messageId || typeof liked !== "boolean") {
    return NextResponse.json({ error: "Eksik veya hatalı parametre" }, { status: 400 });
  }

  const message = await prisma.inboxMessage.findFirst({
    where: { id: messageId, conversation: { workspaceId: ctx.workspaceId } },
    include: { conversation: { include: { socialAccount: true } } },
  });

  if (!message) return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });

  let apiError: string | null = null;

  if (message.remoteId) {
    const account = message.conversation.socialAccount;
    const adapter = getPlatformAdapter(account.provider);
    if (adapter.likeInboxItem) {
      let accessToken = "stub-token";
      try {
        accessToken = await getFreshAccessToken(account.id);
      } catch (err: any) {
        apiError = err?.message || "Token yenileme hatası";
      }
      try {
        const result = await adapter.likeInboxItem({
          accessToken,
          remoteMessageId: message.remoteId,
          liked,
        });
        if (!result.success) {
          apiError = result.errorMessage || "Beğenme işlemi başarısız";
        }
      } catch (e: any) {
        apiError = e?.message || "Bilinmeyen hata";
      }
    } else {
      apiError = "Bu platform için beğeni desteklenmiyor";
    }
  }

  // Update DB regardless of API success for best effort (or you can strict fail)
  await prisma.inboxMessage.update({
    where: { id: message.id },
    data: { isLiked: liked },
  });

  if (apiError) {
    // Return 200 with warning if we still saved it locally, or 502 if we want strict
    // Since some platforms might not support it fully, we return a warning message but success: true
    return NextResponse.json({ success: true, warning: apiError, isLiked: liked });
  }

  return NextResponse.json({ success: true, isLiked: liked });
}

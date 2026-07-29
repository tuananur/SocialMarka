import { NextResponse } from "next/server";
import { prisma, SenderType } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { getPlatformAdapter, decryptToken } from "@socialmarka/shared";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Params) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

  const { id } = await params;

  const message = await prisma.inboxMessage.findFirst({
    where: { id, conversation: { workspaceId: ctx.workspaceId } },
    include: { conversation: { include: { socialAccount: true } } },
  });

  if (!message) return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
  if (message.senderType !== SenderType.AGENT) return NextResponse.json({ error: "Sadece kendi gönderdiğiniz mesajları silebilirsiniz" }, { status: 400 });

  // Try to delete from platform
  if (message.remoteId) {
    const account = message.conversation.socialAccount;
    const adapter = getPlatformAdapter(account.provider);
    if (adapter.deleteInboxReply) {
      let accessToken = "stub-token";
      if (account.encryptedAccessToken) {
        accessToken = decryptToken(account.encryptedAccessToken);
      }
      try {
        await adapter.deleteInboxReply({
          accessToken,
          remoteMessageId: message.remoteId,
        });
      } catch (e) {
        console.error("Failed to delete remote reply", e);
      }
    }
  }

  await prisma.inboxMessage.delete({ where: { id: message.id } });
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: Params) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

  const body = await req.json();
  const text = String(body.message || "").trim();
  if (!text) return NextResponse.json({ error: "Mesaj boş olamaz" }, { status: 400 });

  const { id } = await params;

  const message = await prisma.inboxMessage.findFirst({
    where: { id, conversation: { workspaceId: ctx.workspaceId } },
    include: { conversation: { include: { socialAccount: true } } },
  });

  if (!message) return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
  if (message.senderType !== SenderType.AGENT) return NextResponse.json({ error: "Sadece kendi gönderdiğiniz mesajları düzenleyebilirsiniz" }, { status: 400 });

  // Try to edit on platform
  if (message.remoteId) {
    const account = message.conversation.socialAccount;
    const adapter = getPlatformAdapter(account.provider);
    if (adapter.editInboxReply) {
      let accessToken = "stub-token";
      if (account.encryptedAccessToken) {
        accessToken = decryptToken(account.encryptedAccessToken);
      }
      try {
        await adapter.editInboxReply({
          accessToken,
          remoteMessageId: message.remoteId,
          message: text,
        });
      } catch (e) {
        console.error("Failed to edit remote reply", e);
      }
    }
  }

  const updated = await prisma.inboxMessage.update({
    where: { id: message.id },
    data: { messageText: text },
  });

  return NextResponse.json({ success: true, message: updated });
}

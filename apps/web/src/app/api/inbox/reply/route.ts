import { NextResponse } from "next/server";
import { prisma, SenderType } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { enqueueInboxReply } from "@socialmarka/queue";

export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const conversationId = String(body.conversationId || "");
  const messageText = String(body.message || "").trim();
  if (!conversationId || !messageText) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const conversation = await prisma.inboxConversation.findFirst({
    where: { id: conversationId, workspaceId: ctx.workspaceId },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Konuşma bulunamadı" }, { status: 404 });
  }

  const message = await prisma.inboxMessage.create({
    data: {
      conversationId,
      senderType: SenderType.AGENT,
      messageText,
    },
  });

  await prisma.inboxConversation.update({
    where: { id: conversationId },
    data: {
      lastMessage: messageText,
      lastMessageAt: new Date(),
      isRead: true,
    },
  });

  await enqueueInboxReply({ conversationId, messageId: message.id });

  return NextResponse.json({ message });
}

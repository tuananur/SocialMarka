import { NextResponse } from "next/server";
import { prisma, SenderType, AccountStatus, InboxType } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { resolveAccessToken } from "@socialmarka/shared";

export async function POST(_req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const accounts = await prisma.socialAccount.findMany({
    where: {
      workspaceId: ctx.workspaceId,
      status: { not: AccountStatus.DISCONNECTED },
    },
  });

  // Try live fetch for connected Facebook / Instagram accounts
  for (const account of accounts) {
    if (account.provider === "FACEBOOK" || account.provider === "INSTAGRAM") {
      try {
        const token = resolveAccessToken(account.encryptedAccessToken);

        // 1. Fetch DMs via /conversations
        try {
          const res = await fetch(
            `https://graph.facebook.com/v19.0/${account.providerAccountId}/conversations?fields=id,senders,unread_count,updated_time,messages{id,message,created_time,from}&access_token=${encodeURIComponent(token)}`
          );
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.data)) {
              for (const convData of json.data) {
                const sender = convData.senders?.data?.[0]?.name || "Kullanıcı";
                const lastMsgObj = convData.messages?.data?.[0];
                const lastMsgText = lastMsgObj?.message || "Mesaj içeriği";

                let conversation = await prisma.inboxConversation.findFirst({
                  where: {
                    socialAccountId: account.id,
                    senderName: sender,
                    type: InboxType.DIRECT_MESSAGE,
                  },
                });

                if (!conversation) {
                  conversation = await prisma.inboxConversation.create({
                    data: {
                      workspaceId: ctx.workspaceId,
                      socialAccountId: account.id,
                      senderName: sender,
                      lastMessage: lastMsgText,
                      lastMessageAt: lastMsgObj?.created_time ? new Date(lastMsgObj.created_time) : new Date(),
                      type: InboxType.DIRECT_MESSAGE,
                      remoteId: convData.id,
                    },
                  });
                }

                if (convData.messages?.data) {
                  for (const msgItem of convData.messages.data) {
                    if (!msgItem.message) continue;
                    const isAgent = msgItem.from?.id === account.providerAccountId;
                    const existingMsg = await prisma.inboxMessage.findFirst({
                      where: { conversationId: conversation.id, messageText: msgItem.message },
                    });
                    if (!existingMsg) {
                      await prisma.inboxMessage.create({
                        data: {
                          conversationId: conversation.id,
                          senderType: isAgent ? SenderType.AGENT : SenderType.USER,
                          messageText: msgItem.message,
                          createdAt: msgItem.created_time ? new Date(msgItem.created_time) : new Date(),
                        },
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (dmErr: any) {
          console.error(`[Inbox Sync DM] Error syncing ${account.id}:`, dmErr?.message || dmErr);
        }

        // 2. Fetch Live Instagram Comments via /media?fields=comments
        if (account.provider === "INSTAGRAM") {
          try {
            const isIgToken = token.startsWith("IG");
            const mediaUrl = isIgToken
              ? `https://graph.instagram.com/me/media?fields=id,caption,comments{id,text,username,timestamp}&access_token=${encodeURIComponent(token)}`
              : `https://graph.facebook.com/v19.0/${account.providerAccountId}/media?fields=id,caption,comments{id,text,username,timestamp,from}&access_token=${encodeURIComponent(token)}`;

            const mediaRes = await fetch(mediaUrl);
            if (mediaRes.ok) {
              const mediaJson = await mediaRes.json();
              if (Array.isArray(mediaJson.data)) {
                for (const mediaItem of mediaJson.data) {
                  const comments = mediaItem.comments?.data;
                  if (Array.isArray(comments)) {
                    for (const comment of comments) {
                      const sender = comment.username || comment.from?.username || "instagram_user";
                      const commentText = comment.text || "";
                      if (!commentText) continue;

                      let conversation = await prisma.inboxConversation.findFirst({
                        where: {
                          socialAccountId: account.id,
                          senderName: sender,
                          type: InboxType.COMMENT,
                        },
                      });

                      if (!conversation) {
                        conversation = await prisma.inboxConversation.create({
                          data: {
                            workspaceId: ctx.workspaceId,
                            socialAccountId: account.id,
                            senderName: sender,
                            lastMessage: commentText,
                            lastMessageAt: comment.timestamp ? new Date(comment.timestamp) : new Date(),
                            type: InboxType.COMMENT,
                            remoteId: comment.id,
                          },
                        });
                      } else {
                        await prisma.inboxConversation.update({
                          where: { id: conversation.id },
                          data: {
                            lastMessage: commentText,
                            lastMessageAt: comment.timestamp ? new Date(comment.timestamp) : new Date(),
                            isRead: false,
                          },
                        });
                      }

                      const existingMsg = await prisma.inboxMessage.findFirst({
                        where: { conversationId: conversation.id, messageText: commentText },
                      });
                      if (!existingMsg) {
                        await prisma.inboxMessage.create({
                          data: {
                            conversationId: conversation.id,
                            senderType: sender.toLowerCase() === account.accountName.toLowerCase() ? SenderType.AGENT : SenderType.USER,
                            messageText: commentText,
                            createdAt: comment.timestamp ? new Date(comment.timestamp) : new Date(),
                          },
                        });
                      }
                    }
                  }
                }
              }
            }
          } catch (igCommentErr: any) {
            console.error(`[Inbox Sync IG Comments] Error syncing ${account.id}:`, igCommentErr?.message || igCommentErr);
          }
        }

        // 3. Fetch Live Facebook Feed Comments
        if (account.provider === "FACEBOOK") {
          try {
            const feedRes = await fetch(
              `https://graph.facebook.com/v19.0/${account.providerAccountId}/feed?fields=id,message,comments{id,message,from,created_time}&access_token=${encodeURIComponent(token)}`
            );
            if (feedRes.ok) {
              const feedJson = await feedRes.json();
              if (Array.isArray(feedJson.data)) {
                for (const feedItem of feedJson.data) {
                  const comments = feedItem.comments?.data;
                  if (Array.isArray(comments)) {
                    for (const comment of comments) {
                      const sender = comment.from?.name || "facebook_user";
                      const commentText = comment.message || "";
                      if (!commentText) continue;

                      let conversation = await prisma.inboxConversation.findFirst({
                        where: {
                          socialAccountId: account.id,
                          senderName: sender,
                          type: InboxType.COMMENT,
                        },
                      });

                      if (!conversation) {
                        conversation = await prisma.inboxConversation.create({
                          data: {
                            workspaceId: ctx.workspaceId,
                            socialAccountId: account.id,
                            senderName: sender,
                            lastMessage: commentText,
                            lastMessageAt: comment.created_time ? new Date(comment.created_time) : new Date(),
                            type: InboxType.COMMENT,
                            remoteId: comment.id,
                          },
                        });
                      } else {
                        await prisma.inboxConversation.update({
                          where: { id: conversation.id },
                          data: {
                            lastMessage: commentText,
                            lastMessageAt: comment.created_time ? new Date(comment.created_time) : new Date(),
                            isRead: false,
                          },
                        });
                      }

                      const existingMsg = await prisma.inboxMessage.findFirst({
                        where: { conversationId: conversation.id, messageText: commentText },
                      });
                      if (!existingMsg) {
                        await prisma.inboxMessage.create({
                          data: {
                            conversationId: conversation.id,
                            senderType: SenderType.USER,
                            messageText: commentText,
                            createdAt: comment.created_time ? new Date(comment.created_time) : new Date(),
                          },
                        });
                      }
                    }
                  }
                }
              }
            }
          } catch (fbCommentErr: any) {
            console.error(`[Inbox Sync FB Comments] Error syncing ${account.id}:`, fbCommentErr?.message || fbCommentErr);
          }
        }

      } catch (err: any) {
        console.error(`[Inbox Sync] Error syncing account ${account.id}:`, err?.message || err);
      }
    }
  }

  // Fetch updated conversations
  const updatedConversations = await prisma.inboxConversation.findMany({
    where: { workspaceId: ctx.workspaceId },
    select: {
      id: true,
      senderName: true,
      senderAvatar: true,
      lastMessage: true,
      lastMessageAt: true,
      isRead: true,
      type: true,
      socialAccount: {
        select: { accountName: true, provider: true },
      },
      messages: {
        select: {
          id: true,
          senderType: true,
          messageText: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ conversations: updatedConversations });
}

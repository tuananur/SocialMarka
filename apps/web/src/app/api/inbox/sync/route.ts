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

  // Demo verileri temizle
  try {
    await prisma.inboxConversation.deleteMany({
      where: {
        workspaceId: ctx.workspaceId,
        senderName: { in: ["Melis Yılmaz", "Ahmet Kaya", "Selin Çelik", "Caner Öztürk"] },
      },
    });
  } catch {
    /* ignore */
  }

  const accounts = await prisma.socialAccount.findMany({
    where: {
      workspaceId: ctx.workspaceId,
      status: { not: AccountStatus.DISCONNECTED },
    },
  });

  const debugLogs: string[] = [];
  debugLogs.push(`Workspace ID: ${ctx.workspaceId}, Bağlı hesap sayısı: ${accounts.length}`);

  // 1. Live fetch for connected Facebook / Instagram accounts
  for (const account of accounts) {
    debugLogs.push(`Hesap işleniyor: ${account.accountName} (${account.provider}, ID: ${account.providerAccountId})`);
    if (account.provider === "FACEBOOK" || account.provider === "INSTAGRAM") {
      try {
        const token = resolveAccessToken(account.encryptedAccessToken);

        // Fetch DMs via /conversations
        try {
          const res = await fetch(
            `https://graph.facebook.com/v19.0/${account.providerAccountId}/conversations?fields=id,senders,unread_count,updated_time,messages{id,message,created_time,from}&access_token=${encodeURIComponent(token)}`
          );
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.data)) {
              debugLogs.push(`[${account.accountName}] ${json.data.length} DM konuşması bulundu`);
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
          debugLogs.push(`[${account.accountName}] DM hatası: ${dmErr?.message || dmErr}`);
        }

        // Fetch Instagram Media Comments
        try {
          const mediaCandidates = [
            `https://graph.facebook.com/v19.0/${account.providerAccountId}?fields=instagram_business_account{id,username,media{id,caption,comments{id,text,username,timestamp}}}&access_token=${encodeURIComponent(token)}`,
            `https://graph.facebook.com/v19.0/${account.providerAccountId}/media?fields=id,caption,comments{id,text,username,timestamp,from}&access_token=${encodeURIComponent(token)}`,
            `https://graph.instagram.com/me/media?fields=id,caption,comments{id,text,username,timestamp}&access_token=${encodeURIComponent(token)}`,
          ];

          for (const mediaUrl of mediaCandidates) {
            try {
              const res = await fetch(mediaUrl);
              const json = await res.json();

              let mediaItems: any[] = [];
              if (json.instagram_business_account?.media?.data) {
                mediaItems = json.instagram_business_account.media.data;
              } else if (Array.isArray(json.data)) {
                mediaItems = json.data;
              }

              if (mediaItems.length > 0) {
                debugLogs.push(`[${account.accountName}] IG Media sorgusundan ${mediaItems.length} medya bulundu`);
                for (const mediaItem of mediaItems) {
                  let comments: any[] = Array.isArray(mediaItem.comments?.data) ? mediaItem.comments.data : [];

                  if (comments.length === 0 && mediaItem.id) {
                    const cRes = await fetch(
                      `https://graph.facebook.com/v19.0/${mediaItem.id}/comments?fields=id,text,username,timestamp,from&access_token=${encodeURIComponent(token)}`
                    );
                    if (cRes.ok) {
                      const cJson = await cRes.json();
                      if (Array.isArray(cJson.data)) comments = cJson.data;
                    }
                  }

                  if (comments.length > 0) {
                    debugLogs.push(`[${account.accountName}] Medya ${mediaItem.id} üzerinde ${comments.length} yorum bulundu`);
                  }

                  for (const comment of comments) {
                    const sender = comment.username || comment.from?.username || comment.from?.name || "instagram_user";
                    const commentText = comment.text || comment.message || "";
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
            } catch {
              /* try next candidate */
            }
          }
        } catch (igCommentErr: any) {
          debugLogs.push(`[${account.accountName}] IG Yorum hatası: ${igCommentErr?.message || igCommentErr}`);
        }

        // Fetch Facebook Page Published Posts Comments
        if (account.provider === "FACEBOOK") {
          try {
            const feedUrls = [
              `https://graph.facebook.com/v19.0/${account.providerAccountId}/published_posts?fields=id,message,comments{id,message,from,created_time}&access_token=${encodeURIComponent(token)}`,
              `https://graph.facebook.com/v19.0/${account.providerAccountId}/feed?fields=id,message,comments{id,message,from,created_time}&access_token=${encodeURIComponent(token)}`,
            ];

            for (const fUrl of feedUrls) {
              const feedRes = await fetch(fUrl);
              if (feedRes.ok) {
                const feedJson = await feedRes.json();
                if (Array.isArray(feedJson.data) && feedJson.data.length > 0) {
                  debugLogs.push(`[${account.accountName}] FB Gönderi sorgusundan ${feedJson.data.length} paylaşılan gönderi bulundu`);
                  for (const feedItem of feedJson.data) {
                    const comments = feedItem.comments?.data;
                    if (Array.isArray(comments) && comments.length > 0) {
                      debugLogs.push(`[${account.accountName}] FB Gönderi ${feedItem.id} için ${comments.length} yorum bulundu`);
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
                  break;
                }
              }
            }
          } catch (fbCommentErr: any) {
            debugLogs.push(`[${account.accountName}] FB Yorum hatası: ${fbCommentErr?.message || fbCommentErr}`);
          }
        }

      } catch (err: any) {
        debugLogs.push(`[${account.accountName}] Genel hata: ${err?.message || err}`);
      }
    }
  }

  // 2. Fetch comments directly for published PostTargets in this workspace
  try {
    const publishedTargets = await prisma.postTarget.findMany({
      where: {
        post: { workspaceId: ctx.workspaceId, isDeleted: false },
        status: "PUBLISHED",
        remotePostId: { not: null },
      },
      include: { socialAccount: true },
    });

    debugLogs.push(`Sistem üzerinden yayınlanan ${publishedTargets.length} hedef gönderi taranıyor`);

    for (const target of publishedTargets) {
      if (!target.remotePostId || !target.socialAccount) continue;
      try {
        const token = resolveAccessToken(target.socialAccount.encryptedAccessToken);
        const commentUrls = [
          `https://graph.facebook.com/v19.0/${target.remotePostId}/comments?fields=id,text,message,username,from,timestamp,created_time&access_token=${encodeURIComponent(token)}`,
          `https://graph.instagram.com/${target.remotePostId}/comments?fields=id,text,username,timestamp&access_token=${encodeURIComponent(token)}`,
        ];

        for (const cUrl of commentUrls) {
          try {
            const cRes = await fetch(cUrl);
            const cJson = await cRes.json();
            if (cRes.ok && Array.isArray(cJson.data) && cJson.data.length > 0) {
              debugLogs.push(`Yayınlanan hedef ${target.remotePostId} için ${cJson.data.length} yorum çekildi`);
              for (const comment of cJson.data) {
                const sender = comment.username || comment.from?.username || comment.from?.name || "sosyal_kullanici";
                const commentText = comment.text || comment.message || "";
                if (!commentText) continue;

                let conversation = await prisma.inboxConversation.findFirst({
                  where: {
                    socialAccountId: target.socialAccountId,
                    senderName: sender,
                    type: InboxType.COMMENT,
                  },
                });

                if (!conversation) {
                  conversation = await prisma.inboxConversation.create({
                    data: {
                      workspaceId: ctx.workspaceId,
                      socialAccountId: target.socialAccountId,
                      senderName: sender,
                      lastMessage: commentText,
                      lastMessageAt: comment.timestamp ? new Date(comment.timestamp) : (comment.created_time ? new Date(comment.created_time) : new Date()),
                      type: InboxType.COMMENT,
                      remoteId: comment.id,
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
                      senderType: sender.toLowerCase() === target.socialAccount.accountName.toLowerCase() ? SenderType.AGENT : SenderType.USER,
                      messageText: commentText,
                      createdAt: comment.timestamp ? new Date(comment.timestamp) : new Date(),
                    },
                  });
                }
              }
              break;
            }
          } catch {
            /* try next URL */
          }
        }
      } catch (targetErr: any) {
        debugLogs.push(`Hedef ${target.remotePostId} tarama hatası: ${targetErr?.message || targetErr}`);
      }
    }
  } catch (publishedErr: any) {
    debugLogs.push(`Hedef gönderileri tarama hatası: ${publishedErr?.message || publishedErr}`);
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

  return NextResponse.json({ conversations: updatedConversations, debugLogs });
}

import type { PlatformAdapter, PlatformType, PublishResult, PublishMediaFile } from "./platforms";
import {
  publishYouTubeVideo,
  refreshGoogleAccessToken,
} from "./youtube-publish";
import { publishXPost, refreshXAccessToken } from "./x-publish";
import { publishTikTokVideo, refreshTikTokAccessToken } from "./tiktok-publish";
import { publishInstagram } from "./instagram-publish";
import { publishPinterestPin, refreshPinterestAccessToken } from "./pinterest-publish";

function isLocalToken(token: string) {
  return (
    token.startsWith("sm_access_") ||
    token.startsWith("stub-") ||
    token.startsWith("demo-") ||
    token.startsWith("oauth-access-demo") ||
    token.startsWith("dummy-")
  );
}

async function publishLinkedIn(params: {
  accessToken: string;
  providerAccountId: string;
  content: string;
  mediaUrls?: string[];
  mediaFiles?: PublishMediaFile[];
}): Promise<PublishResult> {
  if (isLocalToken(params.accessToken)) {
    return {
      success: false,
      errorMessage:
        "LinkedIn canlı bağlı değil. Sistem yöneticisi LinkedIn uygulamasını (.env) tanımladıktan sonra hesabı yeniden bağlayın.",
    };
  }

  const authorUrn = params.providerAccountId.startsWith("urn:")
    ? params.providerAccountId
    : `urn:li:person:${params.providerAccountId}`;

  let imageFile = params.mediaFiles?.find((f) => f.mimeType.startsWith("image/"));

  if (!imageFile && params.mediaUrls?.length) {
    const imageUrl = params.mediaUrls.find((u) => /^https?:\/\//i.test(u) && !/\.(mp4|mov|webm)(\?|$)/i.test(u));
    if (imageUrl) {
      try {
        const res = await fetch(imageUrl);
        if (res.ok) {
          imageFile = {
            buffer: Buffer.from(await res.arrayBuffer()),
            mimeType: res.headers.get("content-type") || "image/jpeg",
          };
        }
      } catch {
        /* ignore fallback fetch error */
      }
    }
  }

  let mediaAssetUrn: string | null = null;

  if (imageFile) {
    try {
      const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: authorUrn,
            supportedUploadMechanisms: ["SYNCHRONOUS_UPLOAD"],
          },
        }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok || !registerData.value?.uploadMechanism?.["com.linkedin.ads.common.S3UploadMechanism"]?.uploadUrl) {
        throw new Error(registerData.message || "Görsel yükleme kaydı başarısız");
      }

      const uploadUrl = registerData.value.uploadMechanism["com.linkedin.ads.common.S3UploadMechanism"].uploadUrl;
      mediaAssetUrn = registerData.value.asset;

      // Trigger Vercel redeployment to apply env changes
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": imageFile.mimeType || "image/jpeg",
        },
        body: imageFile.buffer as any,
      });

      if (!uploadRes.ok) {
        throw new Error("Görsel binary yükleme başarısız");
      }
    } catch (err) {
      console.error("[linkedin-publish] image upload failed, falling back to link sharing:", err);
      mediaAssetUrn = null;
    }
  }

  const body: any = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: params.content },
        shareMediaCategory: mediaAssetUrn ? "IMAGE" : "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  if (mediaAssetUrn) {
    body.specificContent["com.linkedin.ugc.ShareContent"].media = [
      {
        status: "READY",
        media: mediaAssetUrn,
        title: { text: "SocialMarka Post" },
      },
    ];
  } else {
    const firstUrl = params.mediaUrls?.find((u) => /^https?:\/\//i.test(u));
    if (firstUrl && !params.content.includes(firstUrl)) {
      body.specificContent["com.linkedin.ugc.ShareContent"].shareCommentary.text =
        `${params.content}\n\n${firstUrl}`.trim();
    }
  }

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let data: { id?: string; message?: string; error?: string } = {};
  try {
    data = JSON.parse(raw);
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    return {
      success: false,
      errorMessage: data.message || data.error || raw.slice(0, 200) || "LinkedIn yayınlama başarısız",
    };
  }

  return { success: true, remotePostId: String(data.id || `li_${Date.now()}`) };
}

async function publishFacebook(params: {
  accessToken: string;
  providerAccountId: string;
  content: string;
  mediaUrls?: string[];
}): Promise<PublishResult> {
  if (isLocalToken(params.accessToken)) {
    return {
      success: false,
      errorMessage:
        "Facebook canlı bağlı değil. Sistem yöneticisi Facebook uygulamasını (.env) tanımladıktan sonra hesabı yeniden bağlayın.",
    };
  }

  const pageId = params.providerAccountId;
  const mediaUrl = params.mediaUrls?.find((u) => /^https?:\/\//i.test(u));
  const isVideo =
    Boolean(mediaUrl) &&
    (/\.(mp4|mov|webm)(\?|$)/i.test(mediaUrl!) || mediaUrl!.includes("video"));

  if (mediaUrl && isVideo) {
    const form = new URLSearchParams();
    form.set("file_url", mediaUrl);
    form.set("description", params.content);
    form.set("access_token", params.accessToken);
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/videos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      },
    );
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        errorMessage: data.error?.message || "Facebook video yayınlama başarısız",
      };
    }
    return { success: true, remotePostId: String(data.id || `fb_vid_${Date.now()}`) };
  }

  if (mediaUrl) {
    const form = new URLSearchParams();
    form.set("url", mediaUrl);
    form.set("caption", params.content);
    form.set("access_token", params.accessToken);
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      },
    );
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        errorMessage: data.error?.message || "Facebook fotoğraf yayınlama başarısız",
      };
    }
    return {
      success: true,
      remotePostId: String(data.post_id || data.id || `fb_photo_${Date.now()}`),
    };
  }

  const form = new URLSearchParams();
  form.set("message", params.content);
  form.set("access_token", params.accessToken);

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    },
  );
  const data = await res.json();
  if (!res.ok) {
    return {
      success: false,
      errorMessage: data.error?.message || "Facebook yayınlama başarısız",
    };
  }
  return { success: true, remotePostId: String(data.id || `fb_${Date.now()}`) };
}

export function createLiveAdapter(platform: PlatformType): PlatformAdapter {
  return {
    platform,
    async publishPost(params) {
      switch (platform) {
        case "LINKEDIN":
          return publishLinkedIn(params);
        case "FACEBOOK":
          return publishFacebook(params);
        case "INSTAGRAM":
          return publishInstagram(params);
        case "YOUTUBE":
          if (isLocalToken(params.accessToken)) {
            return {
              success: false,
              errorMessage: "YouTube canlı bağlı değil. Hesabı yeniden yetkilendirin.",
            };
          }
          return publishYouTubeVideo({
            accessToken: params.accessToken,
            content: params.content,
            mediaFiles: params.mediaFiles,
            mediaUrls: params.mediaUrls,
          });
        case "X":
          if (isLocalToken(params.accessToken)) {
            return {
              success: false,
              errorMessage: "X canlı bağlı değil. Hesabı yeniden yetkilendirin.",
            };
          }
          return publishXPost({
            accessToken: params.accessToken,
            content: params.content,
            mediaFiles: params.mediaFiles,
            mediaUrls: params.mediaUrls,
          });
        case "TIKTOK":
          return publishTikTokVideo(params);
        case "PINTEREST":
          return publishPinterestPin(params);
        default:
          return { success: false, errorMessage: "Bilinmeyen platform" };
      }
    },
    async sendInboxReply(params: {
      accessToken: string;
      conversationRemoteId: string;
      message: string;
    }) {
      if (isLocalToken(params.accessToken)) {
        return { success: true };
      }
      try {
        if (platform === "YOUTUBE") {
          const res = await fetch(`https://www.googleapis.com/youtube/v3/comments?part=snippet`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${params.accessToken}`,
            },
            body: JSON.stringify({
              snippet: {
                parentId: params.conversationRemoteId,
                textOriginal: params.message,
              },
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { success: false, errorMessage: err.error?.message || res.statusText };
          }
          return { success: true };
        }

        if (platform === "INSTAGRAM") {
          const res = await fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(params.conversationRemoteId)}/replies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: params.message,
              access_token: params.accessToken,
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { success: false, errorMessage: err.error?.message || res.statusText };
          }
          return { success: true };
        }

        if (platform === "FACEBOOK") {
          const res = await fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(params.conversationRemoteId)}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: params.message,
              access_token: params.accessToken,
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { success: false, errorMessage: err.error?.message || res.statusText };
          }
          return { success: true };
        }

        return { success: false, errorMessage: "Bu platform için gelen kutusu yanıtı desteklenmiyor" };
      } catch (err: any) {
        return { success: false, errorMessage: err?.message || String(err) };
      }
    },
    async refreshToken(refreshToken: string) {
      if (platform === "YOUTUBE") {
        const refreshed = await refreshGoogleAccessToken(refreshToken);
        return {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
        };
      }
      if (platform === "X") {
        const refreshed = await refreshXAccessToken(refreshToken);
        return {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
        };
      }
      if (platform === "TIKTOK") {
        const refreshed = await refreshTikTokAccessToken(refreshToken);
        return {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
        };
      }
      if (platform === "PINTEREST") {
        const refreshed = await refreshPinterestAccessToken(refreshToken);
        return {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
        };
      }
      return { accessToken: refreshToken, expiresAt: new Date(Date.now() + 3600_000) };
    },
  };
}

const adapters = new Map<PlatformType, PlatformAdapter>();

export function getPlatformAdapter(platform: PlatformType): PlatformAdapter {
  let adapter = adapters.get(platform);
  if (!adapter) {
    adapter = createLiveAdapter(platform);
    adapters.set(platform, adapter);
  }
  return adapter;
}

export async function deleteRemotePost(params: {
  platform: PlatformType;
  accessToken: string;
  remotePostId: string;
}): Promise<{ success: boolean; error?: string }> {
  const { platform, accessToken, remotePostId } = params;
  if (!remotePostId || isLocalToken(accessToken)) {
    return { success: true };
  }

  try {
    switch (platform) {
      case "FACEBOOK":
      case "INSTAGRAM": {
        const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(remotePostId)}?access_token=${encodeURIComponent(accessToken)}`;
        const res = await fetch(url, { method: "DELETE" });
        const json = await res.json().catch(() => ({}));
        if (res.ok || json.success === true) {
          return { success: true };
        }
        return { success: false, error: json.error?.message || "Meta gönderisi silinemedi" };
      }

      case "X": {
        const res = await fetch(`https://api.twitter.com/2/tweets/${encodeURIComponent(remotePostId)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) return { success: true };
        const json = await res.json().catch(() => ({}));
        return { success: false, error: json.detail || json.title || "X gönderisi silinemedi" };
      }

      case "LINKEDIN": {
        const targetUrn = remotePostId.startsWith("urn:")
          ? remotePostId
          : `urn:li:ugcPost:${remotePostId}`;
        const res = await fetch(`https://api.linkedin.com/v2/ugcPosts/${encodeURIComponent(targetUrn)}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        });
        if (res.ok) return { success: true };
        return { success: false, error: "LinkedIn gönderisi silinemedi" };
      }

      case "YOUTUBE": {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(remotePostId)}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (res.ok || res.status === 204) return { success: true };
        const json = await res.json().catch(() => ({}));
        return { success: false, error: json.error?.message || "YouTube videosu silinemedi" };
      }

      case "PINTEREST": {
        const res = await fetch(`https://api.pinterest.com/v5/pins/${encodeURIComponent(remotePostId)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok || res.status === 204) return { success: true };
        const json = await res.json().catch(() => ({}));
        return { success: false, error: json.message || "Pinterest pini silinemedi" };
      }

      case "TIKTOK": {
        return { success: true };
      }

      default:
        return { success: true };
    }
  } catch (err: any) {
    console.error(`[deleteRemotePost] ${platform} error:`, err);
    return { success: false, error: err.message || "Silme işlemi başarısız" };
  }
}

/** Geriye uyumluluk */
export function createStubAdapter(platform: PlatformType): PlatformAdapter {
  return createLiveAdapter(platform);
}

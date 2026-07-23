import type { PlatformAdapter, PlatformType, PublishResult } from "./platforms";
import {
  publishYouTubeVideo,
  refreshGoogleAccessToken,
} from "./youtube-publish";
import { publishXPost, refreshXAccessToken } from "./x-publish";
import { publishTikTokVideo } from "./tiktok-publish";
import { publishInstagram } from "./instagram-publish";
import { publishPinterestPin } from "./pinterest-publish";

function isLocalToken(token: string) {
  return (
    token.startsWith("sm_access_") ||
    token.startsWith("stub-") ||
    token.startsWith("demo-") ||
    token.startsWith("oauth-access-demo")
  );
}

async function publishLinkedIn(params: {
  accessToken: string;
  providerAccountId: string;
  content: string;
  mediaUrls?: string[];
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

  const imageUrl = params.mediaUrls?.find((u) => /^https?:\/\//i.test(u));
  let text = params.content;
  if (imageUrl && !params.content.includes(imageUrl)) {
    text = `${params.content}\n\n${imageUrl}`.trim();
  }

  const body = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

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
    async sendInboxReply() {
      return { success: false, errorMessage: "Gelen kutusu yanıtı henüz canlı değil" };
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

/** Geriye uyumluluk */
export function createStubAdapter(platform: PlatformType): PlatformAdapter {
  return createLiveAdapter(platform);
}

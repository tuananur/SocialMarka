import type { PlatformAdapter, PlatformType, PublishResult } from "./platforms";
import {
  publishYouTubeVideo,
  refreshGoogleAccessToken,
} from "./youtube-publish";
import { publishXPost, refreshXAccessToken } from "./x-publish";

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

  let text = params.content;
  if (params.mediaUrls?.length) {
    text = `${params.content}\n\n${params.mediaUrls[0]}`;
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

  const form = new URLSearchParams();
  form.set("message", params.content);
  form.set("access_token", params.accessToken);
  if (params.mediaUrls?.[0]) form.set("link", params.mediaUrls[0]);

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(params.providerAccountId)}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    }
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

function notLiveYet(platform: string, token: string): PublishResult {
  if (isLocalToken(token)) {
    return {
      success: false,
      errorMessage: `${platform} canlı bağlı değil. Sistem uygulaması tanımlayıp hesabı yeniden bağlayın.`,
    };
  }
  return {
    success: false,
    errorMessage: `${platform} canlı yayınlama yakında. Şu an LinkedIn ve Facebook destekleniyor.`,
  };
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
          return notLiveYet("Instagram", params.accessToken);
        case "YOUTUBE":
          if (isLocalToken(params.accessToken)) {
            return {
              success: false,
              errorMessage:
                "YouTube canlı bağlı değil. Hesabı yeniden yetkilendirin.",
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
              errorMessage:
                "X canlı bağlı değil. Hesabı yeniden yetkilendirin.",
            };
          }
          return publishXPost({
            accessToken: params.accessToken,
            content: params.content,
            mediaFiles: params.mediaFiles,
            mediaUrls: params.mediaUrls,
          });
        case "TIKTOK":
          return notLiveYet("TikTok", params.accessToken);
        case "PINTEREST":
          return notLiveYet("Pinterest", params.accessToken);
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

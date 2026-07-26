import type { PublishMediaFile, PublishResult } from "./platforms";

function isLocalToken(token: string) {
  return (
    token.startsWith("sm_access_") ||
    token.startsWith("stub-") ||
    token.startsWith("demo-")
  );
}

/**
 * Pinterest API v5 — create pin on a board.
 * providerAccountId = board id (or board_id from connect).
 */
export async function publishPinterestPin(params: {
  accessToken: string;
  providerAccountId: string;
  content: string;
  mediaUrls?: string[];
  mediaFiles?: PublishMediaFile[];
}): Promise<PublishResult> {
  if (isLocalToken(params.accessToken)) {
    return {
      success: false,
      errorMessage: "Pinterest canlı bağlı değil. Hesabı yeniden bağlayın.",
    };
  }

  const boardId = params.providerAccountId;
  if (!boardId) {
    return { success: false, errorMessage: "Pinterest pano (board) ID gerekli" };
  }

  let imageUrl = params.mediaUrls?.find((u) => /^https?:\/\//i.test(u) && !/\.(mp4|mov|webm)(\?|$)/i.test(u));

  // If only files, Pinterest needs a hosted image URL — try first https media
  if (!imageUrl) {
    imageUrl = params.mediaUrls?.find((u) => /^https?:\/\//i.test(u));
  }

  if (!imageUrl) {
    return {
      success: false,
      errorMessage:
        "Pinterest için herkese açık HTTPS görsel URL’si gerekli (Blob/R2).",
    };
  }

  const lines = params.content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const title = (lines[0] || "SocialMarka").slice(0, 100);
  const description = params.content.slice(0, 500);

  // Optional link from content: [Link]: https://...
  let link: string | undefined;
  const linkMatch = params.content.match(/\[Link\]:\s*(\S+)/i);
  if (linkMatch) link = linkMatch[1];

  const body: Record<string, unknown> = {
    board_id: boardId,
    title,
    description,
    media_source: {
      source_type: "image_url",
      url: imageUrl,
    },
  };
  if (link) body.link = link;

  const res = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let data: { id?: string; message?: string; code?: number } = {};
  try {
    data = JSON.parse(raw);
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    return {
      success: false,
      errorMessage: data.message || raw.slice(0, 200) || "Pinterest yayınlama başarısız",
    };
  }

  return { success: true, remotePostId: String(data.id || `pin_${Date.now()}`) };
}

export async function refreshPinterestAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}> {
  const appId = process.env.PINTEREST_APP_ID?.trim();
  const appSecret = process.env.PINTEREST_APP_SECRET?.trim();
  if (!appId || !appSecret) {
    throw new Error("PINTEREST_APP_ID / PINTEREST_APP_SECRET eksik");
  }

  const basic = Buffer.from(`${appId}:${appSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    message?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(data.message || "Pinterest token yenilenemedi");
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 2592000,
    refreshToken: data.refresh_token,
  };
}

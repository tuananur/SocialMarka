import type { PublishResult } from "./platforms";

export type YouTubePrivacy = "public" | "private" | "unlisted";

export type MediaFile = {
  buffer: Buffer;
  mimeType: string;
  fileName?: string;
};

export function parseYouTubeContent(content: string): {
  title: string;
  description: string;
  privacyStatus: YouTubePrivacy;
} {
  let privacyStatus: YouTubePrivacy = "public";
  let text = content;

  const privacyMatch = content.match(
    /\[Gizlilik\]:\s*(public|private|unlisted)/i
  );
  if (privacyMatch) {
    privacyStatus = privacyMatch[1].toLowerCase() as YouTubePrivacy;
    text = content
      .replace(/\n*\s*\[Gizlilik\]:\s*(public|private|unlisted)\s*/gi, "")
      .trim();
  }

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const title = (lines[0] || "SocialMarka Video").slice(0, 100);
  const description = text.slice(0, 5000) || title;

  return { title, description, privacyStatus };
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}> {
  const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET eksik");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || "Google token yenilenemedi"
    );
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 3600,
    refreshToken: data.refresh_token,
  };
}

function googleErrorMessage(raw: string, status: number): string {
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string; errors?: { reason?: string }[] };
    };
    const msg = parsed.error?.message;
    const reason = parsed.error?.errors?.[0]?.reason;
    if (msg && reason) return `${msg} (${reason})`;
    if (msg) return msg;
  } catch {
    /* ignore */
  }
  return raw.slice(0, 300) || `YouTube API hatası (${status})`;
}

export async function publishYouTubeVideo(params: {
  accessToken: string;
  content: string;
  mediaFiles?: MediaFile[];
  mediaUrls?: string[];
}): Promise<PublishResult> {
  const file = params.mediaFiles?.find((f) =>
    (f.mimeType || "").startsWith("video/")
  );

  if (!file?.buffer?.length) {
    return {
      success: false,
      errorMessage:
        "YouTube için video dosyası gerekli. Gönderiye MP4/MOV/WEBM ekleyin.",
    };
  }

  const { title, description, privacyStatus } = parseYouTubeContent(
    params.content
  );
  const mimeType = file.mimeType || "video/mp4";

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(file.buffer.length),
        "X-Upload-Content-Type": mimeType,
      },
      body: JSON.stringify({
        snippet: {
          title,
          description,
          categoryId: "22",
        },
        status: {
          privacyStatus,
          selfDeclaredMadeForKids: false,
        },
      }),
    }
  );

  if (!initRes.ok) {
    const raw = await initRes.text();
    return {
      success: false,
      errorMessage: googleErrorMessage(raw, initRes.status),
    };
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    return {
      success: false,
      errorMessage: "YouTube yükleme oturumu açılamadı (Location yok)",
    };
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": mimeType,
      "Content-Length": String(file.buffer.length),
    },
    body: new Uint8Array(file.buffer),
  });

  const raw = await uploadRes.text();
  let data: { id?: string } = {};
  try {
    data = JSON.parse(raw) as { id?: string };
  } catch {
    /* ignore */
  }

  if (!uploadRes.ok || !data.id) {
    return {
      success: false,
      errorMessage: googleErrorMessage(raw, uploadRes.status),
    };
  }

  return { success: true, remotePostId: data.id };
}

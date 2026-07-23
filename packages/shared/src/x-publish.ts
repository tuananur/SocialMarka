import type { PublishMediaFile, PublishResult } from "./platforms";

function xErrorMessage(raw: string, status: number): string {
  try {
    const parsed = JSON.parse(raw) as {
      detail?: string;
      title?: string;
      errors?: { message?: string }[];
      error?: string;
      error_description?: string;
    };
    if (parsed.detail) return parsed.detail;
    if (parsed.title) return parsed.title;
    if (parsed.error_description) return parsed.error_description;
    if (parsed.error) return String(parsed.error);
    if (parsed.errors?.[0]?.message) return parsed.errors[0].message;
  } catch {
    /* ignore */
  }
  return raw.slice(0, 280) || `X API hatası (${status})`;
}

export async function refreshXAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}> {
  const clientId = process.env.X_CLIENT_ID?.trim();
  const clientSecret = process.env.X_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("X_CLIENT_ID / X_CLIENT_SECRET eksik");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
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
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || "X token yenilenemedi"
    );
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 7200,
    refreshToken: data.refresh_token,
  };
}

async function uploadXMedia(
  accessToken: string,
  file: PublishMediaFile
): Promise<string | null> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(file.buffer)], {
    type: file.mimeType || "application/octet-stream",
  });
  form.append("media", blob, file.fileName || "media");

  const res = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const raw = await res.text();
  let data: { media_id_string?: string; media_id?: number } = {};
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    throw new Error(xErrorMessage(raw, res.status));
  }

  const id = data.media_id_string || (data.media_id != null ? String(data.media_id) : null);
  return id;
}

export async function publishXPost(params: {
  accessToken: string;
  content: string;
  mediaFiles?: PublishMediaFile[];
  mediaUrls?: string[];
}): Promise<PublishResult> {
  const text = (params.content || "").trim().slice(0, 280);
  if (!text && !(params.mediaFiles?.length || params.mediaUrls?.length)) {
    return { success: false, errorMessage: "X için metin veya medya gerekli" };
  }

  const mediaIds: string[] = [];
  const image = params.mediaFiles?.find((f) =>
    (f.mimeType || "").startsWith("image/")
  );

  if (image?.buffer?.length) {
    try {
      const id = await uploadXMedia(params.accessToken, image);
      if (id) mediaIds.push(id);
    } catch (e) {
      // Medya yüklenemezse metin + uyarı yerine metin tweet dene
      console.warn(
        "[x-publish] media upload failed:",
        e instanceof Error ? e.message : e
      );
    }
  }

  const body: {
    text?: string;
    media?: { media_ids: string[] };
  } = {};
  if (text) body.text = text;
  else if (mediaIds.length) body.text = " ";
  if (mediaIds.length) body.media = { media_ids: mediaIds.slice(0, 4) };

  // Medya yoksa ama local URL varsa (LinkedIn gibi) metne ekleme — X'te kırık localhost linki kötü
  // Sadece metin tweet

  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let data: { data?: { id?: string }; detail?: string } = {};
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    /* ignore */
  }

  if (!res.ok || !data.data?.id) {
    return {
      success: false,
      errorMessage: xErrorMessage(raw, res.status),
    };
  }

  return { success: true, remotePostId: String(data.data.id) };
}

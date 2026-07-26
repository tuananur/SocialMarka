import type { PublishMediaFile, PublishResult } from "./platforms";

function isLocalToken(token: string) {
  return (
    token.startsWith("sm_access_") ||
    token.startsWith("stub-") ||
    token.startsWith("demo-")
  );
}

function tiktokError(raw: string, status: number): string {
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string; code?: string };
      message?: string;
    };
    if (parsed.error?.message) return parsed.error.message;
    if (parsed.message) return parsed.message;
  } catch {
    /* ignore */
  }
  return raw.slice(0, 280) || `TikTok API hatası (${status})`;
}

function isHttpUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function isLikelyImageUrl(url: string) {
  if (url.startsWith("data:image/")) return true;
  if (/\.(jpe?g|png|webp|gif|heic)(\?|$)/i.test(url)) return true;
  if (isHttpUrl(url) && !/\.(mp4|mov|webm|m4v)(\?|$)/i.test(url)) return true;
  return false;
}

/**
 * TikTok Content Posting — photo carousel via PULL_FROM_URL.
 * Requires publicly reachable HTTPS image URLs (e.g. Vercel Blob).
 */
async function publishTikTokPhoto(params: {
  accessToken: string;
  content: string;
  mediaUrls: string[];
}): Promise<PublishResult> {
  const photoImages = params.mediaUrls.filter(
    (u) => isHttpUrl(u) && isLikelyImageUrl(u) && !u.includes("/uploads/pending/"),
  );
  if (!photoImages.length) {
    return {
      success: false,
      errorMessage:
        "TikTok fotoğraf için genel HTTPS görsel URL’si gerekli (Blob’a yüklenmiş resim).",
    };
  }

  const title = params.content.replace(/\s+/g, " ").trim().slice(0, 90) || "SocialMarka";
  const description = params.content.trim().slice(0, 4000) || title;
  const privacyLevels = ["SELF_ONLY", "MUTUAL_FOLLOW_FRIENDS", "PUBLIC_TO_EVERYONE"] as const;
  const postModes = ["DIRECT_POST", "MEDIA_UPLOAD"] as const;

  let lastError = "TikTok fotoğraf paylaşımı başarısız";

  for (const postMode of postModes) {
    for (const privacy of privacyLevels) {
      const body = {
        media_type: "PHOTO",
        post_mode: postMode,
        post_info: {
          title,
          description,
          privacy_level: privacy,
          disable_comment: false,
          auto_add_music: true,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: 0,
          photo_images: photoImages.slice(0, 35),
        },
      };

      const res = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify(body),
      });

      const raw = await res.text();
      let data: {
        data?: { publish_id?: string };
        error?: { code?: string; message?: string };
      } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        /* ignore */
      }

      const okCode = !data.error?.code || data.error.code === "ok";
      if (res.ok && okCode && data.data?.publish_id) {
        return { success: true, remotePostId: data.data.publish_id };
      }

      lastError = tiktokError(raw, res.status);
      if (/privacy|unaudited|forbidden|scope/i.test(lastError)) {
        continue;
      }
      if (/url|domain|verify|pull_from_url|photo_images/i.test(lastError)) {
        return {
          success: false,
          errorMessage: `${lastError} — TikTok Developer’da görsel domain URL sahipliğini doğrulayın.`,
        };
      }
    }
  }

  return { success: false, errorMessage: lastError };
}

/**
 * TikTok Content Posting — video (FILE_UPLOAD) or photo (PULL_FROM_URL).
 */
export async function publishTikTokVideo(params: {
  accessToken: string;
  content: string;
  mediaFiles?: PublishMediaFile[];
  mediaUrls?: string[];
}): Promise<PublishResult> {
  if (isLocalToken(params.accessToken)) {
    return {
      success: false,
      errorMessage: "TikTok canlı bağlı değil. Hesabı yeniden bağlayın.",
    };
  }

  const mediaUrls = params.mediaUrls || [];
  const hasVideoFile = params.mediaFiles?.some((f) => f.mimeType.startsWith("video/"));
  const hasVideoUrl = mediaUrls.some((u) => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(u));
  const hasImageUrl = mediaUrls.some(
    (u) => isHttpUrl(u) && isLikelyImageUrl(u) && !/\.(mp4|mov|webm|m4v)(\?|$)/i.test(u),
  );
  const hasImageFile = params.mediaFiles?.some((f) => f.mimeType.startsWith("image/"));

  if ((hasImageUrl || hasImageFile) && !hasVideoFile && !hasVideoUrl) {
    const urls = mediaUrls.filter((u) => isHttpUrl(u));
    if (!urls.length) {
      return {
        success: false,
        errorMessage:
          "TikTok fotoğraf paylaşımı için görseli Blob’a yükleyin (HTTPS URL gerekir).",
      };
    }
    return publishTikTokPhoto({
      accessToken: params.accessToken,
      content: params.content,
      mediaUrls: urls,
    });
  }

  let file = params.mediaFiles?.find((f) => f.mimeType.startsWith("video/"));
  if (!file && mediaUrls.length) {
    for (const url of mediaUrls) {
      const loaded = await fetchMedia(url);
      if (loaded?.mimeType.startsWith("video/")) {
        file = loaded;
        break;
      }
    }
  }

  if (!file?.buffer?.length) {
    const photoUrls = mediaUrls.filter((u) => isHttpUrl(u));
    if (photoUrls.length) {
      return publishTikTokPhoto({
        accessToken: params.accessToken,
        content: params.content,
        mediaUrls: photoUrls,
      });
    }
    return {
      success: false,
      errorMessage: "TikTok için video veya görsel (HTTPS) ekleyin.",
    };
  }

  const title = params.content.replace(/\s+/g, " ").trim().slice(0, 150) || "SocialMarka";
  const videoSize = file.buffer.length;
  const chunkSize = videoSize;
  const totalChunkCount = 1;

  const privacyLevels = ["SELF_ONLY", "MUTUAL_FOLLOW_FRIENDS", "PUBLIC_TO_EVERYONE"] as const;

  let lastError = "TikTok yayınlama başarısız";
  for (const privacy of privacyLevels) {
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title,
          privacy_level: privacy,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: chunkSize,
          total_chunk_count: totalChunkCount,
        },
      }),
    });

    const initRaw = await initRes.text();
    let initData: {
      data?: { publish_id?: string; upload_url?: string };
      error?: { code?: string; message?: string };
    } = {};
    try {
      initData = JSON.parse(initRaw);
    } catch {
      /* ignore */
    }

    if (!initRes.ok || !initData.data?.upload_url) {
      lastError = tiktokError(initRaw, initRes.status);
      if (
        /privacy|unaudited|scope|forbidden|not.?authorized/i.test(lastError) &&
        privacy !== privacyLevels[privacyLevels.length - 1]
      ) {
        continue;
      }
      break;
    }

    const uploadUrl = initData.data.upload_url;
    const publishId = initData.data.publish_id || `tt_${Date.now()}`;

    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.mimeType || "video/mp4",
        "Content-Length": String(videoSize),
        "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
      },
      body: new Uint8Array(file.buffer),
    });

    if (!put.ok) {
      const putRaw = await put.text();
      return {
        success: false,
        errorMessage: tiktokError(putRaw, put.status) || "TikTok video yükleme başarısız",
      };
    }

    return { success: true, remotePostId: publishId };
  }

  const inboxInit = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoSize,
        chunk_size: chunkSize,
        total_chunk_count: totalChunkCount,
      },
    }),
  });
  const inboxRaw = await inboxInit.text();
  let inboxData: { data?: { publish_id?: string; upload_url?: string } } = {};
  try {
    inboxData = JSON.parse(inboxRaw);
  } catch {
    /* ignore */
  }

  if (!inboxInit.ok || !inboxData.data?.upload_url) {
    return {
      success: false,
      errorMessage:
        lastError ||
        tiktokError(inboxRaw, inboxInit.status) ||
        "TikTok yayınlama başarısız. video.publish / video.upload kapsamını açın.",
    };
  }

  const putInbox = await fetch(inboxData.data.upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": file.mimeType || "video/mp4",
      "Content-Length": String(videoSize),
      "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
    },
    body: new Uint8Array(file.buffer),
  });

  if (!putInbox.ok) {
    return {
      success: false,
      errorMessage: "TikTok inbox video yükleme başarısız",
    };
  }

  return {
    success: true,
    remotePostId: inboxData.data.publish_id || `tt_inbox_${Date.now()}`,
  };
}

/** Alias — supports video + photo */
export const publishTikTok = publishTikTokVideo;

async function fetchMedia(url: string): Promise<PublishMediaFile | null> {
  if (url.startsWith("data:")) {
    const m = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return null;
    return {
      buffer: Buffer.from(m[2], "base64"),
      mimeType: m[1],
      fileName: "media",
    };
  }
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") || "application/octet-stream";
    return {
      buffer: Buffer.from(await res.arrayBuffer()),
      mimeType: mime,
      fileName: mime.startsWith("image/") ? "image.jpg" : "video.mp4",
    };
  } catch {
    return null;
  }
}

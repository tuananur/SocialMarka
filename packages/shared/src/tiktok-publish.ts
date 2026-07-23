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

/**
 * TikTok Content Posting — Direct Post (FILE_UPLOAD).
 * Requires scope video.publish (or video.upload for inbox draft).
 * Unaaudited/sandbox apps often require privacy_level SELF_ONLY.
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

  let file = params.mediaFiles?.find((f) => f.mimeType.startsWith("video/"));
  if (!file && params.mediaUrls?.length) {
    for (const url of params.mediaUrls) {
      const loaded = await fetchMedia(url);
      if (loaded?.mimeType.startsWith("video/")) {
        file = loaded;
        break;
      }
    }
  }

  if (!file?.buffer?.length) {
    return {
      success: false,
      errorMessage: "TikTok için video dosyası gerekli.",
    };
  }

  const title = params.content.replace(/\s+/g, " ").trim().slice(0, 150) || "SocialMarka";
  const videoSize = file.buffer.length;
  const chunkSize = videoSize;
  const totalChunkCount = 1;

  // Prefer Direct Post; sandbox often needs SELF_ONLY
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
      // Try next privacy or fall through to inbox
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

  // Fallback: send to creator inbox (video.upload) for manual post in TikTok app
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
    return {
      buffer: Buffer.from(await res.arrayBuffer()),
      mimeType: res.headers.get("content-type") || "video/mp4",
      fileName: "video.mp4",
    };
  } catch {
    return null;
  }
}

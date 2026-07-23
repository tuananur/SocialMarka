import type { PublishMediaFile, PublishResult } from "./platforms";

function isLocalToken(token: string) {
  return (
    token.startsWith("sm_access_") ||
    token.startsWith("stub-") ||
    token.startsWith("demo-")
  );
}

/**
 * Instagram Graph API — image or reel via public URL or uploaded media URL.
 * providerAccountId = Instagram Business/Creator user id.
 */
export async function publishInstagram(params: {
  accessToken: string;
  providerAccountId: string;
  content: string;
  mediaUrls?: string[];
  mediaFiles?: PublishMediaFile[];
}): Promise<PublishResult> {
  if (isLocalToken(params.accessToken)) {
    return {
      success: false,
      errorMessage: "Instagram canlı bağlı değil. Hesabı yeniden bağlayın.",
    };
  }

  const igUserId = params.providerAccountId;
  const caption = params.content.slice(0, 2200);
  let mediaUrl = params.mediaUrls?.find((u) => /^https?:\/\//i.test(u));

  // Prefer HTTPS public URL; Graph API needs a reachable URL for containers
  if (!mediaUrl) {
    return {
      success: false,
      errorMessage:
        "Instagram için herkese açık HTTPS medya URL’si gerekli (Blob/R2). Yerel dosya ile yayınlanamaz.",
    };
  }

  const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(mediaUrl) || mediaUrl.includes("video");

  const createBody = new URLSearchParams();
  createBody.set("access_token", params.accessToken);
  createBody.set("caption", caption);
  if (isVideo) {
    createBody.set("media_type", "REELS");
    createBody.set("video_url", mediaUrl);
    createBody.set("share_to_feed", "true");
  } else {
    createBody.set("image_url", mediaUrl);
  }

  const createRes = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(igUserId)}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: createBody,
    },
  );
  const createData = (await createRes.json()) as {
    id?: string;
    error?: { message?: string };
  };
  if (!createRes.ok || !createData.id) {
    return {
      success: false,
      errorMessage: createData.error?.message || "Instagram medya oluşturulamadı",
    };
  }

  const creationId = createData.id;

  // Poll until finished (esp. video)
  for (let i = 0; i < 30; i++) {
    const st = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(creationId)}?fields=status_code&access_token=${encodeURIComponent(params.accessToken)}`,
    );
    const stData = (await st.json()) as { status_code?: string; error?: { message?: string } };
    if (stData.status_code === "FINISHED" || stData.status_code === "PUBLISHED") break;
    if (stData.status_code === "ERROR" || stData.error) {
      return {
        success: false,
        errorMessage: stData.error?.message || "Instagram medya işleme hatası",
      };
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  const pubBody = new URLSearchParams();
  pubBody.set("creation_id", creationId);
  pubBody.set("access_token", params.accessToken);

  const pubRes = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(igUserId)}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: pubBody,
    },
  );
  const pubData = (await pubRes.json()) as { id?: string; error?: { message?: string } };
  if (!pubRes.ok || !pubData.id) {
    return {
      success: false,
      errorMessage: pubData.error?.message || "Instagram yayınlama başarısız",
    };
  }

  return { success: true, remotePostId: String(pubData.id) };
}

import type { PlatformType, PublishResult } from "./platforms";

/**
 * Post a first comment after the main post succeeds.
 * Failures are soft — callers should not mark the main post FAILED.
 */
export async function postFirstComment(params: {
  platform: PlatformType;
  accessToken: string;
  providerAccountId: string;
  remotePostId: string;
  comment: string;
}): Promise<PublishResult> {
  const text = params.comment.trim();
  if (!text) return { success: true };

  switch (params.platform) {
    case "INSTAGRAM":
      return igComment(params.accessToken, params.remotePostId, text);
    case "FACEBOOK":
      return fbComment(params.accessToken, params.remotePostId, text);
    case "LINKEDIN":
      return linkedInComment(params.accessToken, params.remotePostId, text);
    default:
      return { success: true };
  }
}

async function igComment(
  accessToken: string,
  mediaId: string,
  message: string,
): Promise<PublishResult> {
  const body = new URLSearchParams({
    message,
    access_token: accessToken,
  });
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(mediaId)}/comments`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body },
  );
  const data = (await res.json()) as { id?: string; error?: { message?: string } };
  if (!res.ok || !data.id) {
    return {
      success: false,
      errorMessage: data.error?.message || "Instagram ilk yorum başarısız",
    };
  }
  return { success: true, remotePostId: data.id };
}

async function fbComment(
  accessToken: string,
  postId: string,
  message: string,
): Promise<PublishResult> {
  const body = new URLSearchParams({
    message,
    access_token: accessToken,
  });
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(postId)}/comments`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body },
  );
  const data = (await res.json()) as { id?: string; error?: { message?: string } };
  if (!res.ok || !data.id) {
    return {
      success: false,
      errorMessage: data.error?.message || "Facebook ilk yorum başarısız",
    };
  }
  return { success: true, remotePostId: data.id };
}

async function linkedInComment(
  accessToken: string,
  shareUrnOrId: string,
  message: string,
): Promise<PublishResult> {
  // remotePostId may be a share URN or numeric id
  const urn = shareUrnOrId.startsWith("urn:")
    ? shareUrnOrId
    : `urn:li:share:${shareUrnOrId}`;

  const res = await fetch(
    `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(urn)}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        object: urn,
        message: { text: message },
      }),
    },
  );

  if (!res.ok) {
    // Newer Posts API comment endpoint fallback
    const res2 = await fetch("https://api.linkedin.com/rest/socialActions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202401",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        object: urn,
        message: { text: message },
      }),
    });
    if (!res2.ok) {
      const raw = await res2.text().catch(() => "");
      return {
        success: false,
        errorMessage:
          raw.slice(0, 200) ||
          "LinkedIn ilk yorum başarısız (yorum yetkisi için yeniden bağlayın)",
      };
    }
    return { success: true, remotePostId: `li_c_${Date.now()}` };
  }

  return { success: true, remotePostId: `li_c_${Date.now()}` };
}

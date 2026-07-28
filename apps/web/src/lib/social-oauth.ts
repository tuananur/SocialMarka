import { createHmac, timingSafeEqual, randomBytes, createHash } from "crypto";
import type { PlatformType } from "@socialmarka/shared";
import { getPlatformCreds, loadPlatformCredsIntoEnv } from "@/lib/platform-credentials";

// Panelden kaydedilen anahtarları process env’e yükle
loadPlatformCredsIntoEnv();

const STATE_SECRET = () =>
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "socialmarka-dev-secret";

export type OAuthConnectType = "page" | "profile" | "channel" | "board" | "business" | "personal";

export type OAuthStatePayload = {
  provider: string;
  workspaceId: string;
  userId: string;
  connectType: string;
  codeVerifier?: string;
};

export function signOAuthState(payload: OAuthStatePayload): string {
  const body = Buffer.from(JSON.stringify({ ...payload, ts: Date.now() }), "utf8").toString(
    "base64url"
  );
  const sig = createHmac("sha256", STATE_SECRET()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyOAuthState(state: string): (OAuthStatePayload & { ts: number }) | null {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", STATE_SECRET()).update(body).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!data.provider || !data.workspaceId || !data.userId) return null;
    if (Date.now() - Number(data.ts || 0) > 30 * 60_000) return null;
    return {
      provider: String(data.provider),
      workspaceId: String(data.workspaceId),
      userId: String(data.userId),
      connectType: String(data.connectType || "profile"),
      codeVerifier: data.codeVerifier ? String(data.codeVerifier) : undefined,
      ts: Number(data.ts),
    };
  } catch {
    return null;
  }
}

export function createPkcePair() {
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  return { codeVerifier, codeChallenge };
}

/** TikTok Login Kit: code_challenge = hex(SHA256(code_verifier)), not base64url */
export function createTikTokPkcePair() {
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("hex");
  return { codeVerifier, codeChallenge };
}

export function hasPlatformOAuthCredentials(provider: PlatformType): boolean {
  return !!getPlatformCreds(provider);
}

export function getConfiguredProviders(): PlatformType[] {
  const all: PlatformType[] = [
    "FACEBOOK",
    "INSTAGRAM",
    "LINKEDIN",
    "YOUTUBE",
    "X",
    "TIKTOK",
    "PINTEREST",
  ];
  return all.filter((p) => hasPlatformOAuthCredentials(p));
}

export function buildPlatformAuthorizeUrl(opts: {
  provider: PlatformType;
  state: string;
  redirectUri: string;
  codeChallenge?: string;
  connectType?: string;
}): string | null {
  const { provider, state, redirectUri, codeChallenge, connectType } = opts;
  const enc = encodeURIComponent;
  const creds = getPlatformCreds(provider);
  if (!creds && provider !== "INSTAGRAM") return null;

  switch (provider) {
    case "FACEBOOK": {
      const scope = "public_profile,pages_show_list,pages_manage_posts,pages_read_engagement,business_management,pages_messaging,instagram_basic,instagram_manage_comments,instagram_manage_messages";
      return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${enc(creds!.clientId)}&redirect_uri=${enc(redirectUri)}&state=${enc(state)}&scope=${enc(scope)}&response_type=code`;
    }
    case "INSTAGRAM": {
      // Her iki Instagram bağlantı türü de Facebook Graph API üzerinden yapılmalı.
      // Instagram Basic Display API (api.instagram.com) artık yalnızca geliştiricilere açık.
      const fbCreds = getPlatformCreds("FACEBOOK");
      if (!fbCreds) return null;
      const scope = "public_profile,pages_show_list,pages_read_engagement,business_management,instagram_basic,instagram_manage_comments,instagram_manage_messages,instagram_content_publish";
      return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${enc(fbCreds.clientId)}&redirect_uri=${enc(redirectUri)}&state=${enc(state)}&scope=${enc(scope)}&response_type=code`;
    }
    case "LINKEDIN": {
      return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${enc(creds!.clientId)}&redirect_uri=${enc(redirectUri)}&state=${enc(state)}&scope=${enc("openid profile email w_member_social")}`;
    }
    case "YOUTUBE": {
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${enc(creds!.clientId)}&redirect_uri=${enc(redirectUri)}&response_type=code&scope=${enc("https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile")}&access_type=offline&prompt=consent&state=${enc(state)}`;
    }
    case "X": {
      if (!codeChallenge) return null;
      return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${enc(creds!.clientId)}&redirect_uri=${enc(redirectUri)}&scope=${enc("tweet.read tweet.write users.read offline.access")}&state=${enc(state)}&code_challenge=${enc(codeChallenge)}&code_challenge_method=S256`;
    }
    case "TIKTOK": {
      if (!codeChallenge) return null;
      // Login + Content Posting (upload to drafts)
      const scope = "user.info.basic,video.upload";
      return `https://www.tiktok.com/v2/auth/authorize/?client_key=${enc(creds!.clientId)}&response_type=code&scope=${enc(scope)}&redirect_uri=${enc(redirectUri)}&state=${enc(state)}&code_challenge=${enc(codeChallenge)}&code_challenge_method=S256`;
    }
    case "PINTEREST": {
      return `https://www.pinterest.com/oauth/?client_id=${enc(creds!.clientId)}&redirect_uri=${enc(redirectUri)}&response_type=code&scope=${enc("boards:read,pins:read,pins:write,user_accounts:read")}&state=${enc(state)}`;
    }
    default:
      return null;
  }
}

export type ExchangedTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  providerAccountId: string;
  accountName: string;
  profilePicUrl?: string;
  multipleAccounts?: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    providerAccountId: string;
    accountName: string;
    profilePicUrl?: string;
  }[];
};

export async function exchangeOAuthCode(opts: {
  provider: PlatformType;
  code: string;
  redirectUri: string;
  codeVerifier?: string;
  connectType?: string;
}): Promise<ExchangedTokens> {
  const { provider, code, redirectUri, codeVerifier, connectType } = opts;

  switch (provider) {
    case "LINKEDIN":
      return exchangeLinkedIn(code, redirectUri);
    case "FACEBOOK":
      return exchangeFacebook(code, redirectUri, connectType === "page", false);
    case "INSTAGRAM":
      // Instagram Basic Display API artık genel kullanımda kapalı.
      // Hem personal hem business bağlantıları Facebook Graph API üzerinden yapılır.
      return exchangeFacebook(code, redirectUri, true, true);
    case "YOUTUBE":
      return exchangeYouTube(code, redirectUri);
    case "X":
      return exchangeX(code, redirectUri, codeVerifier);
    case "TIKTOK":
      return exchangeTikTok(code, redirectUri, codeVerifier);
    case "PINTEREST":
      return exchangePinterest(code, redirectUri);
    default:
      throw new Error("Desteklenmeyen platform");
  }
}

async function exchangeLinkedIn(code: string, redirectUri: string): Promise<ExchangedTokens> {
  const creds = getPlatformCreds("LINKEDIN");
  if (!creds) throw new Error("LinkedIn API anahtarları eksik");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
  });
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok || !token.access_token) {
    throw new Error(token.error_description || token.error || "LinkedIn token alınamadı");
  }

  const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const me = await meRes.json();
  if (!meRes.ok) {
    throw new Error(me.message || "LinkedIn profil okunamadı");
  }

  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresIn: token.expires_in,
    providerAccountId: String(me.sub || me.id),
    accountName: String(me.name || me.email || "LinkedIn Profil"),
    profilePicUrl: me.picture ? String(me.picture) : undefined,
  };
}

async function fetchAllPages(userToken: string, shortToken?: string): Promise<any[]> {
  const pagesList: any[] = [];
  const seenPageIds = new Set<string>();

  const addPages = (data: any[]) => {
    if (!Array.isArray(data)) return;
    for (const p of data) {
      if (p && p.id && !seenPageIds.has(p.id)) {
        seenPageIds.add(p.id);
        pagesList.push(p);
      }
    }
  };

  const tokensToTry = [userToken];
  if (shortToken && shortToken !== userToken) {
    tokensToTry.push(shortToken);
  }

  for (const t of tokensToTry) {
    if (pagesList.length > 0) break;

    // 1. Basic /me/accounts query (guaranteed to succeed without field/permission restrictions)
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?limit=100&access_token=${encodeURIComponent(t)}`
      );
      const json = await res.json();
      console.log("[Facebook OAuth] Basic /me/accounts response:", {
        ok: res.ok,
        status: res.status,
        error: json.error || null,
        dataLength: json.data?.length || 0,
        pageNames: json.data?.map((p: any) => p.name) || [],
      });
      if (res.ok && json.data) {
        addPages(json.data);
      }
    } catch (err: any) {
      console.error("[Facebook OAuth] Fetch basic /me/accounts error:", err.message || err);
    }

    // 2. Query /me/accounts with fields
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,picture,instagram_business_account{id,username,name,profile_picture_url}&limit=100&access_token=${encodeURIComponent(t)}`
      );
      const json = await res.json();
      console.log("[Facebook OAuth] /me/accounts with fields response details:", {
        ok: res.ok,
        status: res.status,
        error: json.error || null,
        dataLength: json.data?.length || 0,
      });
      if (res.ok && json.data) {
        addPages(json.data);
      }
    } catch (err: any) {
      console.error("[Facebook OAuth] Fetch /me/accounts error:", err.message || err);
    }

    // 3. Query /me?fields=accounts
    try {
      const meAccRes = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=accounts{id,name,access_token,picture,instagram_business_account{id,username,name,profile_picture_url}}&access_token=${encodeURIComponent(t)}`
      );
      const meAccJson = await meAccRes.json();
      console.log("[Facebook OAuth] /me?fields=accounts response:", {
        ok: meAccRes.ok,
        dataLength: meAccJson.accounts?.data?.length || 0,
      });
      if (meAccRes.ok && meAccJson.accounts?.data) {
        addPages(meAccJson.accounts.data);
      }
    } catch (err: any) {
      console.error("[Facebook OAuth] Fetch /me?fields=accounts error:", err.message || err);
    }

    // 4. Query /me/assigned_pages (Facebook Login for Business assigned assets)
    try {
      const assRes = await fetch(
        `https://graph.facebook.com/v19.0/me/assigned_pages?fields=id,name,access_token,picture,instagram_business_account{id,username,name,profile_picture_url}&access_token=${encodeURIComponent(t)}`
      );
      const assJson = await assRes.json();
      console.log("[Facebook OAuth] /me/assigned_pages response:", {
        ok: assRes.ok,
        dataLength: assJson.data?.length || 0,
      });
      if (assRes.ok && assJson.data) {
        addPages(assJson.data);
      }
    } catch (err: any) {
      console.error("[Facebook OAuth] Fetch /me/assigned_pages error:", err.message || err);
    }

    // 5. Query /me/businesses (for Login for Business)
    try {
      const busRes = await fetch(
        `https://graph.facebook.com/v19.0/me/businesses?access_token=${encodeURIComponent(t)}`
      );
      const busJson = await busRes.json();
      console.log("[Facebook OAuth] /me/businesses response details:", {
        ok: busRes.ok,
        status: busRes.status,
        error: busJson.error || null,
        dataLength: busJson.data?.length || 0,
      });

      if (busRes.ok && Array.isArray(busJson.data)) {
        for (const bus of busJson.data) {
          if (!bus.id) continue;
          // Fetch owned_pages
          try {
            const ownedRes = await fetch(
              `https://graph.facebook.com/v19.0/${bus.id}/owned_pages?fields=id,name,access_token,picture,instagram_business_account{id,username,name,profile_picture_url}&access_token=${encodeURIComponent(t)}`
            );
            const ownedJson = await ownedRes.json();
            if (ownedRes.ok && ownedJson.data) {
              addPages(ownedJson.data);
            }
          } catch (ownedErr: any) {
            console.error(`[Facebook OAuth] Fetch owned_pages error for business ${bus.id}:`, ownedErr.message || ownedErr);
          }

          // Fetch client_pages
          try {
            const clientRes = await fetch(
              `https://graph.facebook.com/v19.0/${bus.id}/client_pages?fields=id,name,access_token,picture,instagram_business_account{id,username,name,profile_picture_url}&access_token=${encodeURIComponent(t)}`
            );
            const clientJson = await clientRes.json();
            if (clientRes.ok && clientJson.data) {
              addPages(clientJson.data);
            }
          } catch (clientErr: any) {
            console.error(`[Facebook OAuth] Fetch client_pages error for business ${bus.id}:`, clientErr.message || clientErr);
          }
        }
      }
    } catch (err: any) {
      console.error("[Facebook OAuth] Fetch /me/businesses error:", err.message || err);
    }

    // 6. Direct page node fallback for target pages (Jaglion ID 102151459388246 & 431790324477711)
    const targetPageIds = ["102151459388246", "431790324477711"];
    for (const pageId of targetPageIds) {
      if (seenPageIds.has(pageId)) continue;
      try {
        const pageRes = await fetch(
          `https://graph.facebook.com/v19.0/${pageId}?fields=id,name,access_token,picture,instagram_business_account{id,username,name,profile_picture_url}&access_token=${encodeURIComponent(t)}`
        );
        if (pageRes.ok) {
          const pageJson = await pageRes.json();
          console.log(`[Facebook OAuth] Direct page node fetch for ${pageId} response:`, {
            id: pageJson.id,
            name: pageJson.name,
            hasAccessToken: !!pageJson.access_token,
          });
          if (pageJson.id && pageJson.name) {
            addPages([pageJson]);
          }
        }
      } catch (directErr: any) {
        console.error(`[Facebook OAuth] Direct page node fetch for ${pageId} error:`, directErr.message || directErr);
      }
    }
  }

  console.log("[Facebook OAuth] Total unique pages fetched:", pagesList.length);
  return pagesList;
}

async function exchangeFacebook(
  code: string,
  redirectUri: string,
  preferPage: boolean,
  isInstagram: boolean = false
): Promise<ExchangedTokens> {
  const configId = process.env.FACEBOOK_CONFIG_ID;
  console.log("[Facebook OAuth] exchangeFacebook started. configId from env:", configId ? configId.slice(0, 6) + "..." : "undefined");
  const creds = getPlatformCreds("FACEBOOK");
  if (!creds) throw new Error("Facebook API anahtarları eksik");
  const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", creds.clientId);
  tokenUrl.searchParams.set("client_secret", creds.clientSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const tokenRes = await fetch(tokenUrl);
  const token = await tokenRes.json();
  if (!tokenRes.ok || !token.access_token) {
    throw new Error(token.error?.message || "Facebook token alınamadı");
  }

  // Kısa ömürlü → uzun ömürlü kullanıcı tokenı (~60 gün)
  let userToken = String(token.access_token);
  let expiresIn = Number(token.expires_in || 0) || undefined;
  try {
    const llUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    llUrl.searchParams.set("grant_type", "fb_exchange_token");
    llUrl.searchParams.set("client_id", creds.clientId);
    llUrl.searchParams.set("client_secret", creds.clientSecret);
    llUrl.searchParams.set("fb_exchange_token", userToken);
    const llRes = await fetch(llUrl);
    const ll = await llRes.json();
    if (llRes.ok && ll.access_token) {
      userToken = String(ll.access_token);
      expiresIn = Number(ll.expires_in || 5184000);
    }
  } catch {
    /* kısa token ile devam */
  }

  if (isInstagram) {
    try {
      const meRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username,name,profile_picture_url&access_token=${encodeURIComponent(userToken)}`
      );
      if (meRes.ok) {
        const me = await meRes.json();
        if (me.id) {
          return {
            accessToken: userToken,
            expiresIn: expiresIn || 5184000,
            providerAccountId: String(me.id),
            accountName: String(me.username || me.name),
            profilePicUrl: me.profile_picture_url,
          };
        }
      }
    } catch {
      // Fallback to Facebook Graph API
    }
  }

  const meRes = await fetch(
    `https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${encodeURIComponent(userToken)}`
  );
  const me = await meRes.json();
  console.log("[Facebook OAuth] User profile response:", me);
  if (!meRes.ok) throw new Error(me.error?.message || "Facebook profil okunamadı");

  try {
    const permRes = await fetch(
      `https://graph.facebook.com/v19.0/me/permissions?access_token=${encodeURIComponent(userToken)}`
    );
    const perms = await permRes.json();
    console.log("[Facebook OAuth] Token permissions list:", perms);
  } catch (permErr: any) {
    console.error("[Facebook OAuth] Fetching permissions failed:", permErr.message || permErr);
  }

  if (preferPage) {
    console.log("[Facebook OAuth] preferPage is true, fetching pages...");
    const shortToken = String(token.access_token);
    const allPages = await fetchAllPages(userToken, shortToken);
    console.log("[Facebook OAuth] Total pages fetched:", allPages.length, allPages.map((p: any) => ({ id: p.id, name: p.name })));

    if (allPages.length > 0) {
      const multipleAccounts: any[] = [];

      for (const pageItem of allPages) {
        let page = { ...pageItem };
        // Fetch complete details for the page if needed
        if (page.id && (!page.access_token || !page.picture)) {
          try {
            const detailRes = await fetch(
              `https://graph.facebook.com/v19.0/${page.id}?fields=id,name,access_token,picture,instagram_business_account{id,username,name,profile_picture_url}&access_token=${encodeURIComponent(userToken)}`
            );
            if (detailRes.ok) {
              const detailJson = await detailRes.json();
              page = { ...page, ...detailJson };
            }
          } catch (detailErr: any) {
            console.error("[Facebook OAuth] Single page detail fetch error:", detailErr.message || detailErr);
          }
        }

        const ig = page.instagram_business_account;
        if (isInstagram && ig?.id) {
          // Subscribe the Instagram business account
          try {
            const subUrl = new URL(`https://graph.facebook.com/v19.0/${ig.id}/subscribed_apps`);
            subUrl.searchParams.set("subscribed_fields", "comments,messages");
            subUrl.searchParams.set("access_token", page.access_token || userToken);
            await fetch(subUrl.toString(), { method: "POST" });
          } catch (subErr) {
            console.error("[Facebook OAuth IG] Subscribed apps registration failed:", subErr);
          }
          // Subscribe the Facebook page as well (so we get both!)
          try {
            const subUrl = new URL(`https://graph.facebook.com/v19.0/${page.id}/subscribed_apps`);
            subUrl.searchParams.set("subscribed_fields", "feed,messages");
            subUrl.searchParams.set("access_token", page.access_token || userToken);
            await fetch(subUrl.toString(), { method: "POST" });
          } catch (subErr) {
            console.error("[Facebook OAuth Page] Subscribed apps registration failed:", subErr);
          }

          multipleAccounts.push({
            accessToken: page.access_token || userToken,
            expiresIn: expiresIn || 5184000,
            providerAccountId: String(ig.id),
            accountName: String(ig.username || ig.name || page.name),
            profilePicUrl: ig.profile_picture_url || page.picture?.data?.url || undefined,
          });
        } else if (!isInstagram) {
          // Subscribe the Facebook page
          try {
            const subUrl = new URL(`https://graph.facebook.com/v19.0/${page.id}/subscribed_apps`);
            subUrl.searchParams.set("subscribed_fields", "feed,messages");
            subUrl.searchParams.set("access_token", page.access_token || userToken);
            const subRes = await fetch(subUrl.toString(), { method: "POST" });
            const subData = await subRes.json();
            console.log("[Facebook OAuth Page] Subscribed apps registration response:", subData);
          } catch (subErr) {
            console.error("[Facebook OAuth Page Only] Subscribed apps registration failed:", subErr);
          }

          multipleAccounts.push({
            accessToken: page.access_token || userToken,
            expiresIn: expiresIn || 5184000,
            providerAccountId: String(page.id),
            accountName: String(page.name),
            profilePicUrl: page.picture?.data?.url || undefined,
          });
        }
      }

      if (multipleAccounts.length > 0) {
        return {
          accessToken: multipleAccounts[0].accessToken,
          expiresIn: multipleAccounts[0].expiresIn,
          providerAccountId: multipleAccounts[0].providerAccountId,
          accountName: multipleAccounts[0].accountName,
          profilePicUrl: multipleAccounts[0].profilePicUrl,
          multipleAccounts,
        };
      }
    } else {
      let permsInfo = "unknown";
      try {
        const permRes = await fetch(
          `https://graph.facebook.com/v19.0/me/permissions?access_token=${encodeURIComponent(userToken)}`
        );
        const permsJson = await permRes.json();
        permsInfo = permsJson.data?.map((p: any) => `${p.permission}:${p.status}`).join(", ") || "empty";
      } catch {
        /* ignore */
      }
      console.warn("[Facebook OAuth] No pages returned from Graph API. Perms:", permsInfo);
      throw new Error(`Facebook Sayfası bulunamadı. (İzinler: ${permsInfo})`);
    }
  }

    // 2. If it's Instagram direct login (Instagram Login for Business), query /me/instagram_business_accounts
    if (isInstagram) {
      try {
        const igRes = await fetch(
          `https://graph.facebook.com/v19.0/me/instagram_business_accounts?fields=id,username,name,profile_picture_url&access_token=${encodeURIComponent(userToken)}`
        );
        if (igRes.ok) {
          const igData = await igRes.json();
          const ig = igData.data?.[0];
          if (ig?.id) {
            // Subscribe the Instagram business account
            try {
              const subUrl = new URL(`https://graph.facebook.com/v19.0/${ig.id}/subscribed_apps`);
              subUrl.searchParams.set("subscribed_fields", "comments,messages");
              subUrl.searchParams.set("access_token", userToken);
              await fetch(subUrl.toString(), { method: "POST" });
            } catch (subErr) {
              console.error("[Instagram Direct OAuth] Subscribed apps registration failed:", subErr);
            }

            return {
              accessToken: userToken,
              expiresIn: expiresIn || 5184000,
              providerAccountId: String(ig.id),
              accountName: String(ig.username || ig.name),
              profilePicUrl: ig.profile_picture_url,
            };
          }
        }
      } catch (err: any) {
        console.error("[Facebook OAuth Direct IG] fetch failed:", err.message || err);
      }
    }

  return {
    accessToken: userToken,
    expiresIn,
    providerAccountId: String(me.id),
    accountName: String(me.name || "Facebook"),
    profilePicUrl: me.picture?.data?.url,
  };
}

async function exchangeInstagram(
  code: string,
  redirectUri: string
): Promise<ExchangedTokens> {
  console.log("[Instagram OAuth] Starting exchange...", { redirectUri });
  const creds = getPlatformCreds("INSTAGRAM");
  if (!creds) {
    console.error("[Instagram OAuth] Credentials missing");
    throw new Error("Instagram API anahtarları eksik");
  }
  console.log("[Instagram OAuth] Using App ID:", creds.clientId);

  // 1. Short-lived token exchange via api.instagram.com
  const tokenUrl = "https://api.instagram.com/oauth/access_token";
  const body = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  console.log("[Instagram OAuth] Exchanging code at api.instagram.com...");
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const token = await tokenRes.json();
  console.log("[Instagram OAuth] Exchange response:", {
    ok: tokenRes.ok,
    status: tokenRes.status,
    hasToken: !!token.access_token,
    error: token.error_message || token.error?.message || null,
  });

  if (!tokenRes.ok || !token.access_token) {
    throw new Error(token.error_message || token.error?.message || "Instagram token alınamadı");
  }

  let userToken = String(token.access_token);
  let expiresIn = 5184000; // 60 days fallback

  // 2. Exchange for long-lived access token on graph.instagram.com
  try {
    const llUrl = new URL("https://graph.instagram.com/access_token");
    llUrl.searchParams.set("grant_type", "ig_exchange_token");
    llUrl.searchParams.set("client_secret", creds.clientSecret);
    llUrl.searchParams.set("access_token", userToken);
    
    console.log("[Instagram OAuth] Exchanging for long-lived token at graph.instagram.com...");
    const llRes = await fetch(llUrl);
    const ll = await llRes.json();
    console.log("[Instagram OAuth] Long-lived response:", {
      ok: llRes.ok,
      status: llRes.status,
      hasToken: !!ll.access_token,
      error: ll.error_message || ll.error?.message || null,
    });
    if (llRes.ok && ll.access_token) {
      userToken = String(ll.access_token);
      expiresIn = Number(ll.expires_in || 5184000);
    }
  } catch (err: any) {
    console.error("[Instagram OAuth] Long-lived exchange error:", err?.message || err);
  }

  // 3. Query the Instagram profile using ONLY supported fields: id, username on graph.instagram.com
  console.log("[Instagram OAuth] Querying profile at graph.instagram.com/me...");
  const meRes = await fetch(
    `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(userToken)}`
  );
  const me = await meRes.json();
  console.log("[Instagram OAuth] Profile response:", {
    ok: meRes.ok,
    status: meRes.status,
    id: me.id || null,
    username: me.username || null,
    error: me.error_message || me.error?.message || null,
  });

  if (!meRes.ok) {
    throw new Error(me.error_message || me.error?.message || "Instagram profil okunamadı");
  }

  // 4. Register the Webhook subscription (subscribed_apps) on Meta for this Instagram account
  try {
    const igId = me.id || token.user_id;
    console.log("[Instagram OAuth] Registering subscribed_apps on Meta...", { igId });
    const subUrl = new URL(`https://graph.facebook.com/v19.0/${igId}/subscribed_apps`);
    subUrl.searchParams.set("subscribed_fields", "comments,messages");
    subUrl.searchParams.set("access_token", userToken);
    
    const subRes = await fetch(subUrl.toString(), {
      method: "POST",
    });
    const subData = await subRes.json();
    console.log("[Instagram OAuth] Subscribed apps registration response:", subData);
  } catch (subErr: any) {
    console.error("[Instagram OAuth] Subscribed apps registration failed:", subErr?.message || subErr);
  }

  return {
    accessToken: userToken,
    expiresIn,
    providerAccountId: String(me.id || token.user_id),
    accountName: String(me.username || "Instagram Account"),
  };
}

async function exchangeYouTube(code: string, redirectUri: string): Promise<ExchangedTokens> {
  const creds = getPlatformCreds("YOUTUBE");
  if (!creds) throw new Error("YouTube API anahtarları eksik");
  const body = new URLSearchParams({
    code,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok || !token.access_token) {
    throw new Error(token.error_description || "YouTube token alınamadı");
  }

  const chRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${token.access_token}` } }
  );
  const ch = await chRes.json();
  const item = ch.items?.[0];
  if (item) {
    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in,
      providerAccountId: String(item.id),
      accountName: String(item.snippet?.title || "YouTube Kanal"),
      profilePicUrl: item.snippet?.thumbnails?.default?.url,
    };
  }

  const meRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const me = await meRes.json();
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresIn: token.expires_in,
    providerAccountId: String(me.id || `yt_${Date.now()}`),
    accountName: String(me.name || "YouTube"),
    profilePicUrl: me.picture,
  };
}

async function exchangeX(
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<ExchangedTokens> {
  if (!codeVerifier) throw new Error("X PKCE doğrulayıcı eksik");
  const creds = getPlatformCreds("X");
  if (!creds) throw new Error("X API anahtarları eksik");
  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok || !token.access_token) {
    throw new Error(token.error_description || "X token alınamadı");
  }

  const meRes = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const me = await meRes.json();
  const u = me.data;
  if (!u) throw new Error("X profil okunamadı");

  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresIn: token.expires_in,
    providerAccountId: String(u.id),
    accountName: u.username ? `@${u.username}` : String(u.name || "X"),
    profilePicUrl: u.profile_image_url,
  };
}

async function exchangeTikTok(
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<ExchangedTokens> {
  const creds = getPlatformCreds("TIKTOK");
  if (!creds) throw new Error("TikTok API anahtarları eksik");
  const body = new URLSearchParams({
    client_key: creds.clientId,
    client_secret: creds.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  if (codeVerifier) {
    body.set("code_verifier", codeVerifier);
  }
  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const token = await tokenRes.json();
  const data = token.data || token;
  if (!tokenRes.ok || !data.access_token) {
    throw new Error(token.error_description || data.error || "TikTok token alınamadı");
  }

  const meRes = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
    { headers: { Authorization: `Bearer ${data.access_token}` } }
  );
  const me = await meRes.json();
  const u = me.data?.user || me.data || {};

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    providerAccountId: String(u.open_id || data.open_id || `tt_${Date.now()}`),
    accountName: String(u.display_name || "TikTok"),
    profilePicUrl: u.avatar_url,
  };
}

async function exchangePinterest(code: string, redirectUri: string): Promise<ExchangedTokens> {
  const creds = getPlatformCreds("PINTEREST");
  if (!creds) throw new Error("Pinterest API anahtarları eksik");
  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const tokenRes = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok || !token.access_token) {
    throw new Error(token.message || "Pinterest token alınamadı");
  }

  const meRes = await fetch("https://api.pinterest.com/v5/user_account", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const me = await meRes.json();

  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresIn: token.expires_in,
    providerAccountId: String(me.id || me.username || `pin_${Date.now()}`),
    accountName: String(me.username || me.business_name || "Pinterest"),
    profilePicUrl: me.profile_image,
  };
}

export function getApiOrigin(req?: Request) {
  const envApi = process.env.NEXT_PUBLIC_API_URL;
  if (envApi && !envApi.includes("localhost") && !envApi.includes("127.0.0.1")) {
    return envApi.replace(/\/$/, "");
  }
  if (req) {
    const origin = getAppOrigin(req);
    if (origin.includes("app.socialmarka.com")) {
      return origin.replace("app.socialmarka.com", "api.socialmarka.com");
    }
    return origin;
  }
  return envApi || "http://localhost:3000";
}

export function getAppOrigin(req: Request) {
  // Prefer the live request host on Vercel so localhost env cannot poison redirect_uri
  const hostHeader =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const host = hostHeader.split(",")[0]?.trim();
  const protoHeader = req.headers.get("x-forwarded-proto") || "";
  const proto = (protoHeader.split(",")[0]?.trim() || "https").replace(/:$/, "");
  if (host && !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  const env =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL;
  if (env) return env.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

/**
 * TikTok only accepts https redirect URIs. Prefer configured public HTTPS origin
 * so localhost / mis-set env cannot send http://… and get mislabeled as client_key.
 */
export function getOAuthRedirectOrigin(req: Request, provider: PlatformType) {
  const apiOrigin = getApiOrigin(req);
  if (provider === "TIKTOK" && !apiOrigin.startsWith("https://")) {
    const candidates = [
      process.env.NEXT_PUBLIC_API_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXTAUTH_URL,
      process.env.AUTH_URL,
      getAppOrigin(req),
    ];
    for (const raw of candidates) {
      const origin = String(raw || "")
        .trim()
        .replace(/\/$/, "");
      if (origin.startsWith("https://")) return origin;
    }
  }
  return apiOrigin;
}

export function envKeysForProvider(provider: PlatformType): string[] {
  switch (provider) {
    case "FACEBOOK":
    case "INSTAGRAM":
      return ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"];
    case "LINKEDIN":
      return ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"];
    case "YOUTUBE":
      return ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"];
    case "X":
      return ["X_CLIENT_ID", "X_CLIENT_SECRET"];
    case "TIKTOK":
      return ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"];
    case "PINTEREST":
      return ["PINTEREST_APP_ID", "PINTEREST_APP_SECRET"];
    default:
      return [];
  }
}

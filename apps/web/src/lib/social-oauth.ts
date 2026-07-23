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
}): string | null {
  const { provider, state, redirectUri, codeChallenge } = opts;
  const enc = encodeURIComponent;
  const creds = getPlatformCreds(provider);
  if (!creds) return null;

  switch (provider) {
    case "FACEBOOK":
    case "INSTAGRAM": {
      const scope =
        provider === "INSTAGRAM"
          ? "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement"
          : "pages_show_list,pages_manage_posts,pages_read_engagement,business_management";
      return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${enc(creds.clientId)}&redirect_uri=${enc(redirectUri)}&state=${enc(state)}&scope=${enc(scope)}&response_type=code`;
    }
    case "LINKEDIN": {
      return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${enc(creds.clientId)}&redirect_uri=${enc(redirectUri)}&state=${enc(state)}&scope=${enc("openid profile email w_member_social")}`;
    }
    case "YOUTUBE": {
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${enc(creds.clientId)}&redirect_uri=${enc(redirectUri)}&response_type=code&scope=${enc("https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile")}&access_type=offline&prompt=consent&state=${enc(state)}`;
    }
    case "X": {
      if (!codeChallenge) return null;
      return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${enc(creds.clientId)}&redirect_uri=${enc(redirectUri)}&scope=${enc("tweet.read tweet.write users.read offline.access")}&state=${enc(state)}&code_challenge=${enc(codeChallenge)}&code_challenge_method=S256`;
    }
    case "TIKTOK": {
      if (!codeChallenge) return null;
      return `https://www.tiktok.com/v2/auth/authorize/?client_key=${enc(creds.clientId)}&response_type=code&scope=${enc("user.info.basic,video.upload")}&redirect_uri=${enc(redirectUri)}&state=${enc(state)}&code_challenge=${enc(codeChallenge)}&code_challenge_method=S256`;
    }
    case "PINTEREST": {
      return `https://www.pinterest.com/oauth/?client_id=${enc(creds.clientId)}&redirect_uri=${enc(redirectUri)}&response_type=code&scope=${enc("boards:read,pins:read,pins:write,user_accounts:read")}&state=${enc(state)}`;
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
      return exchangeFacebook(code, redirectUri, connectType === "page");
    case "INSTAGRAM":
      return exchangeFacebook(code, redirectUri, true);
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

async function exchangeFacebook(
  code: string,
  redirectUri: string,
  preferPage: boolean
): Promise<ExchangedTokens> {
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

  const meRes = await fetch(
    `https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${encodeURIComponent(userToken)}`
  );
  const me = await meRes.json();
  if (!meRes.ok) throw new Error(me.error?.message || "Facebook profil okunamadı");

  if (preferPage) {
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,picture,instagram_business_account{id,username,name,profile_picture_url}&access_token=${encodeURIComponent(userToken)}`
    );
    const pages = await pagesRes.json();
    const page = pages.data?.[0];
    if (page) {
      // Instagram bağlama: sayfaya bağlı IG business hesabı varsa onu kullan
      const ig = page.instagram_business_account;
      if (ig?.id) {
        return {
          accessToken: page.access_token || userToken,
          expiresIn: expiresIn || 5184000,
          providerAccountId: String(ig.id),
          accountName: String(ig.username || ig.name || page.name),
          profilePicUrl: ig.profile_picture_url || page.picture?.data?.url,
        };
      }
      return {
        accessToken: page.access_token || userToken,
        expiresIn: expiresIn || 5184000,
        providerAccountId: String(page.id),
        accountName: String(page.name),
        profilePicUrl: page.picture?.data?.url,
      };
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

export function getAppOrigin(req: Request) {
  const env =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL;
  if (env) return env.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
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

import { NextResponse } from "next/server";
import { prisma, PlatformType, AccountStatus } from "@socialmarka/db";
import { encryptToken } from "@socialmarka/shared";
import { getWorkspaceContext, canManageAccounts } from "@/lib/rbac";
import {
  buildPlatformAuthorizeUrl,
  createPkcePair,
  createTikTokPkcePair,
  exchangeOAuthCode,
  getAppOrigin,
  getOAuthRedirectOrigin,
  hasPlatformOAuthCredentials,
  signOAuthState,
  verifyOAuthState,
  type OAuthConnectType,
} from "@/lib/social-oauth";
import { getPlatformCreds } from "@/lib/platform-credentials";

const VALID = new Set(Object.values(PlatformType));

const CONNECT_LABEL: Record<string, string> = {
  page: "Sayfa",
  profile: "Profil",
  channel: "Kanal",
  board: "Pano",
  business: "İşletme",
  personal: "Kişisel",
};

/** OAuth provider'a kayıtlı redirect URI (Google/LinkedIn konsolu) */
export function oauthCallbackPath(provider: string) {
  return `/api/accounts/oauth/${provider.toLowerCase()}/callback`;
}

export function getAccountLimit() {
  const n = Number(process.env.WORKSPACE_ACCOUNT_LIMIT || 50);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 50;
}

/**
 * GET /api/auth/{provider}/connect
 * CSRF state oluştur → gerçek OAuth veya yerel simülasyon
 */
export async function handleOAuthConnect(req: Request, providerRaw: string) {
  const ctx = await getWorkspaceContext();
  const origin = getAppOrigin(req);

  if (!ctx) {
    return NextResponse.redirect(new URL("/login", origin));
  }
  if (!canManageAccounts(ctx.role)) {
    return NextResponse.redirect(new URL("/accounts", origin));
  }

  const provider = providerRaw.toUpperCase();
  const url = new URL(req.url);
  const connectType = (url.searchParams.get("type") || "page") as OAuthConnectType;
  const forceLocal = url.searchParams.get("local") === "1";
  const forceReal = url.searchParams.get("real") === "1";

  if (provider === "GOOGLE" || provider === "GBP") {
    return NextResponse.redirect(new URL("/accounts/create?soon=gbp", origin));
  }

  if (!VALID.has(provider as PlatformType)) {
    return NextResponse.redirect(new URL("/accounts/create?error=platform", origin));
  }

  const limit = getAccountLimit();
  const accountCount = await prisma.socialAccount.count({
    where: { workspaceId: ctx.workspaceId, status: { not: "DISCONNECTED" } },
  });
  if (accountCount >= limit) {
    return NextResponse.redirect(new URL("/accounts/create?error=limit", origin));
  }

  const platform = provider as PlatformType;
  const redirectOrigin = getOAuthRedirectOrigin(req, platform);
  if (platform === "TIKTOK" && !redirectOrigin) {
    return NextResponse.redirect(
      new URL("/accounts/create?error=tiktok_https", origin),
    );
  }
  const oauthOrigin = redirectOrigin || origin;

  // TikTok Login Kit debug: /api/accounts/oauth/tiktok?diag=1
  if (platform === "TIKTOK" && url.searchParams.get("diag") === "1") {
    const creds = getPlatformCreds("TIKTOK");
    const callbackUri = `${oauthOrigin}${oauthCallbackPath(platform)}`;
    return NextResponse.json({
      clientKeyPrefix: creds?.clientId?.slice(0, 4) || null,
      clientKeyLen: creds?.clientId?.length || 0,
      isSandboxKey: Boolean(creds?.clientId?.startsWith("sbaw")),
      redirectUri: callbackUri,
      loginKitMustMatchExactly: callbackUri,
      tip: "Paste redirectUri into TikTok Login Kit (Sandbox) Redirect URI, then Save. Add your TikTok account under Target Users.",
    });
  }

  // Instagram Login debug: /api/accounts/oauth/instagram?diag=1
  if (platform === "INSTAGRAM" && url.searchParams.get("diag") === "1") {
    const creds = getPlatformCreds("INSTAGRAM");
    return NextResponse.json({
      clientId: creds?.clientId || null,
      hasSecret: !!creds?.clientSecret,
      envInstagramId: process.env.INSTAGRAM_APP_ID || null,
      envFacebookId: process.env.FACEBOOK_APP_ID || null,
    });
  }

  const pkce =
    platform === "X"
      ? createPkcePair()
      : platform === "TIKTOK"
        ? createTikTokPkcePair()
        : null;
  const state = signOAuthState({
    provider: platform,
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    connectType,
    codeVerifier: pkce?.codeVerifier,
  });

  // Konsolda kayıtlı URI — yeni /api/auth/*/callback ile uyum için aynı path
  const callbackUri = `${oauthOrigin}${oauthCallbackPath(platform)}`;
  const hasCreds = hasPlatformOAuthCredentials(platform);
  const allowSim =
    forceLocal ||
    !hasCreds ||
    process.env.ALLOW_LOCAL_OAUTH_SIM === "true" ||
    process.env.NODE_ENV !== "production";
  const wantRealOAuth =
    !forceLocal && hasCreds && (forceReal || process.env.USE_REAL_OAUTH !== "false");

  if (wantRealOAuth) {
    const authUrl = buildPlatformAuthorizeUrl({
      provider: platform,
      state,
      redirectUri: callbackUri,
      codeChallenge: pkce?.codeChallenge,
    });
    if (authUrl) {
      // Guard: empty client_key produces TikTok "fix client_key" page
      if (platform === "TIKTOK") {
        try {
          const u = new URL(authUrl);
          const key = u.searchParams.get("client_key") || "";
          if (!key || key.length < 8) {
            return NextResponse.redirect(
              new URL("/accounts/create?error=tiktok_client_key", origin),
            );
          }
        } catch {
          return NextResponse.redirect(
            new URL("/accounts/create?error=tiktok_client_key", origin),
          );
        }
      }
      return NextResponse.redirect(authUrl);
    }
  }

  // Local/dev may use sim UI; production always requires real OAuth credentials
  if (allowSim) {
    const login = new URL(`/accounts/oauth/${platform.toLowerCase()}`, origin);
    login.searchParams.set("state", state);
    login.searchParams.set("type", connectType);
    return NextResponse.redirect(login);
  }

  if (!hasCreds) {
    return NextResponse.redirect(
      new URL(
        `/accounts/setup?provider=${encodeURIComponent(platform.toLowerCase())}&error=missing_creds`,
        origin,
      ),
    );
  }

  return NextResponse.redirect(new URL("/accounts/create?error=oauth_config", origin));
}

/**
 * GET /api/auth/{provider}/callback  (ve legacy accounts/oauth callback)
 * code + state → token exchange → AES şifrele → SocialAccount
 */
export async function handleOAuthCallback(req: Request, providerRaw: string) {
  const provider = providerRaw.toUpperCase() as PlatformType;
  const url = new URL(req.url);
  const origin = getAppOrigin(req);

  const error = url.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(
      new URL(`/accounts/create?error=${encodeURIComponent(error)}`, origin)
    );
  }

  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  const accountNameParam = String(url.searchParams.get("accountName") || "").trim();

  const parsed = verifyOAuthState(state);
  if (!parsed || parsed.provider !== provider) {
    return NextResponse.redirect(new URL("/accounts/create?error=state", origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/accounts/create?error=missing_code", origin));
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { name: true, email: true },
  });

  const typeLabel = CONNECT_LABEL[parsed.connectType] || "Hesap";
  const redirectOrigin = getOAuthRedirectOrigin(req, provider) || origin;
  const callbackUri = `${redirectOrigin}${oauthCallbackPath(provider)}`;
  const isPlatformApp =
    hasPlatformOAuthCredentials(provider) &&
    !code.startsWith("auth_") &&
    url.searchParams.get("local") !== "1" &&
    process.env.USE_REAL_OAUTH !== "false";

  let providerAccountId: string;
  let accountName: string;
  let profilePicUrl: string | undefined;
  let accessToken: string;
  let refreshToken: string | undefined;
  let expiresIn: number | undefined;
  let multipleAccounts: any[] | undefined;

  if (isPlatformApp) {
    try {
      const tokens = await exchangeOAuthCode({
        provider,
        code,
        redirectUri: callbackUri,
        codeVerifier: parsed.codeVerifier,
        connectType: parsed.connectType,
      });
      providerAccountId = tokens.providerAccountId;
      accountName = tokens.accountName;
      profilePicUrl = tokens.profilePicUrl;
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
      expiresIn = tokens.expiresIn;
      multipleAccounts = tokens.multipleAccounts;
    } catch (err: any) {
      console.error("[OAuth Connect Callback Error]", err?.message || err);
      const msg = encodeURIComponent(err?.message || "exchange_failed");
      return NextResponse.redirect(new URL(`/accounts/create?error=exchange&msg=${msg}`, origin));
    }
  } else {
    const slug = accountNameParam
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 24);
    providerAccountId = `local_${provider.toLowerCase()}_${slug || "acc"}_${Date.now().toString(36)}`;
    accountName =
      accountNameParam ||
      `${user?.name || "Hesabım"} · ${provider} ${typeLabel}`;
    accessToken = `sm_access_${providerAccountId}`;
    refreshToken = `sm_refresh_${providerAccountId}`;
    expiresIn = 90 * 24 * 3600;
  }

  const groupIdParam = String(url.searchParams.get("groupId") || "").trim();
  const groupNameParam = String(url.searchParams.get("groupName") || "").trim();

  let connectGroupId: string | null = null;
  if (groupIdParam) {
    const g = await prisma.accountGroup.findFirst({
      where: { id: groupIdParam, workspaceId: parsed.workspaceId },
      select: { id: true },
    });
    connectGroupId = g?.id || null;
  } else if (groupNameParam) {
    const found = await prisma.accountGroup.findFirst({
      where: {
        workspaceId: parsed.workspaceId,
        name: { equals: groupNameParam, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (found) {
      connectGroupId = found.id;
    } else {
      const created = await prisma.accountGroup.create({
        data: { name: groupNameParam.slice(0, 80), workspaceId: parsed.workspaceId },
      });
      connectGroupId = created.id;
    }
  }

  // Çoklu sayfa varsa (Facebook/Instagram) → kullanıcı seçsin
  if (multipleAccounts && multipleAccounts.length > 0) {
    const list = multipleAccounts.map((acc: any) => ({
      refreshToken: acc.refreshToken || refreshToken,
      expiresIn: acc.expiresIn || expiresIn,
      providerAccountId: acc.providerAccountId,
      accountName: acc.accountName,
      profilePicUrl: acc.profilePicUrl,
    }));

    const cookieVal = Buffer.from(JSON.stringify({
      list,
      userToken: accessToken, // Store the main user token here so we can fetch page tokens on the fly
      workspaceId: parsed.workspaceId,
      userId: parsed.userId,
      connectGroupId,
      isPlatformApp,
      connectType: parsed.connectType,
    })).toString("base64");

    const response = NextResponse.redirect(new URL(`/accounts/select?provider=${provider}`, origin));
    response.cookies.set("sm_temp_import_pages", cookieVal, {
      maxAge: 900, // 15 dakika
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  // Tek hesap (Instagram kişisel, YouTube, TikTok, X, LinkedIn vb.) → doğrudan kaydet
  const item = {
    accessToken,
    refreshToken,
    expiresIn,
    providerAccountId,
    accountName,
    profilePicUrl,
  };

  const existing = await prisma.socialAccount.findFirst({
    where: {
      workspaceId: parsed.workspaceId,
      provider,
      providerAccountId: item.providerAccountId,
    },
  });

  if (!existing) {
    const limit = getAccountLimit();
    const accountCount = await prisma.socialAccount.count({
      where: { workspaceId: parsed.workspaceId, status: { not: "DISCONNECTED" } },
    });
    if (accountCount >= limit) {
      return NextResponse.redirect(new URL("/accounts/create?error=limit", origin));
    }
  }

  let encryptedAccessToken: string | null = null;
  let encryptedRefreshToken: string | null = null;
  try {
    encryptedAccessToken = encryptToken(item.accessToken);
    if (item.refreshToken) encryptedRefreshToken = encryptToken(item.refreshToken);
  } catch {
    encryptedAccessToken = item.accessToken;
    encryptedRefreshToken = item.refreshToken || null;
  }

  const expiresAt = item.expiresIn
    ? new Date(Date.now() + item.expiresIn * 1000)
    : new Date(Date.now() + 90 * 24 * 3600_000);

  let accountId: string;

  if (existing) {
    const updated = await prisma.socialAccount.update({
      where: { id: existing.id },
      data: {
        accountName: item.accountName.slice(0, 120),
        profilePicUrl: item.profilePicUrl || existing.profilePicUrl,
        status: AccountStatus.CONNECTED,
        lastConnectedBy: user?.name || user?.email || "Kullanıcı",
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        ...(connectGroupId ? { groups: { connect: [{ id: connectGroupId }] } } : {}),
      },
    });
    accountId = updated.id;
  } else {
    const created = await prisma.socialAccount.create({
      data: {
        provider,
        providerAccountId: item.providerAccountId,
        accountName: item.accountName.slice(0, 120),
        profilePicUrl: item.profilePicUrl || null,
        status: AccountStatus.CONNECTED,
        lastConnectedBy: user?.name || user?.email || "Kullanıcı",
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        workspaceId: parsed.workspaceId,
        ...(connectGroupId ? { groups: { connect: [{ id: connectGroupId }] } } : {}),
      },
    });
    accountId = created.id;
  }

  await prisma.auditLog.create({
    data: {
      action: "ACCOUNT_CONNECTED",
      details: {
        provider,
        connectType: parsed.connectType,
        via: isPlatformApp ? "oauth" : "connect",
        accountName: item.accountName,
        accountId,
        groupId: connectGroupId,
      },
      userId: parsed.userId,
      workspaceId: parsed.workspaceId,
    },
  });

  const done = new URL("/accounts", origin);
  done.searchParams.set("status", "success");
  done.searchParams.set("provider", provider);
  done.searchParams.set("name", item.accountName);
  return NextResponse.redirect(done);
}

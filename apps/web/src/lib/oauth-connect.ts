import { NextResponse } from "next/server";
import { prisma, PlatformType, AccountStatus } from "@socialmarka/db";
import { encryptToken } from "@socialmarka/shared";
import { getWorkspaceContext, canManageAccounts } from "@/lib/rbac";
import {
  buildPlatformAuthorizeUrl,
  createPkcePair,
  exchangeOAuthCode,
  getAppOrigin,
  hasPlatformOAuthCredentials,
  signOAuthState,
  verifyOAuthState,
  type OAuthConnectType,
} from "@/lib/social-oauth";

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
  const pkce = platform === "X" ? createPkcePair() : null;
  const state = signOAuthState({
    provider: platform,
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    connectType,
    codeVerifier: pkce?.codeVerifier,
  });

  // Konsolda kayıtlı URI — yeni /api/auth/*/callback ile uyum için aynı path
  const callbackUri = `${origin}${oauthCallbackPath(platform)}`;
  const hasCreds = hasPlatformOAuthCredentials(platform);
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
      return NextResponse.redirect(authUrl);
    }
  }

  const login = new URL(`/accounts/oauth/${platform.toLowerCase()}`, origin);
  login.searchParams.set("state", state);
  login.searchParams.set("type", connectType);
  return NextResponse.redirect(login);
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
  const callbackUri = `${origin}${oauthCallbackPath(provider)}`;
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
    } catch {
      return NextResponse.redirect(new URL("/accounts/create?error=exchange", origin));
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

  // Kota: yeni hesap eklerken (güncellemede atlanır)
  const existing = await prisma.socialAccount.findFirst({
    where: {
      workspaceId: parsed.workspaceId,
      provider,
      providerAccountId,
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
    encryptedAccessToken = encryptToken(accessToken);
    if (refreshToken) encryptedRefreshToken = encryptToken(refreshToken);
  } catch {
    encryptedAccessToken = accessToken;
    encryptedRefreshToken = refreshToken || null;
  }

  const expiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000)
    : new Date(Date.now() + 90 * 24 * 3600_000);

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

  let accountId: string;

  if (existing) {
    const updated = await prisma.socialAccount.update({
      where: { id: existing.id },
      data: {
        accountName: accountName.slice(0, 120),
        profilePicUrl: profilePicUrl || existing.profilePicUrl,
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
        providerAccountId,
        accountName: accountName.slice(0, 120),
        profilePicUrl,
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
        accountName,
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
  done.searchParams.set("name", accountName);
  return NextResponse.redirect(done);
}

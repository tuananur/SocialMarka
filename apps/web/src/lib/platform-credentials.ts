import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { PlatformType } from "@socialmarka/shared";

export type PlatformCreds = {
  clientId: string;
  clientSecret: string;
};

type Store = Partial<Record<PlatformType, PlatformCreds>>;

/** Strip quotes/whitespace that break OAuth when pasted into Vercel/.env */
export function normalizeCredValue(raw?: string | null): string {
  return String(raw || "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function storePath() {
  const candidates = [
    path.join(process.cwd(), "data", "platform-oauth.json"),
    path.join(process.cwd(), "..", "..", "data", "platform-oauth.json"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  // Prefer repo root when running from apps/web
  if (existsSync(path.join(process.cwd(), "apps", "web"))) {
    return path.join(process.cwd(), "data", "platform-oauth.json");
  }
  if (existsSync(path.join(process.cwd(), "..", "..", "package.json"))) {
    return path.join(process.cwd(), "..", "..", "data", "platform-oauth.json");
  }
  return candidates[0];
}

function readStore(): Store {
  try {
    const p = storePath();
    if (!existsSync(p)) return {};
    return JSON.parse(readFileSync(p, "utf8")) as Store;
  } catch {
    return {};
  }
}

function writeStore(data: Store) {
  const dir = path.dirname(storePath());
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(storePath(), JSON.stringify(data, null, 2), "utf8");
}

function envCreds(provider: PlatformType): PlatformCreds | null {
  switch (provider) {
    case "FACEBOOK":
    case "INSTAGRAM":
      return {
        clientId: normalizeCredValue(process.env.FACEBOOK_APP_ID),
        clientSecret: normalizeCredValue(process.env.FACEBOOK_APP_SECRET),
      };
    case "LINKEDIN":
      return {
        clientId: normalizeCredValue(process.env.LINKEDIN_CLIENT_ID),
        clientSecret: normalizeCredValue(process.env.LINKEDIN_CLIENT_SECRET),
      };
    case "YOUTUBE":
      return {
        clientId: normalizeCredValue(process.env.YOUTUBE_CLIENT_ID),
        clientSecret: normalizeCredValue(process.env.YOUTUBE_CLIENT_SECRET),
      };
    case "X":
      return {
        clientId: normalizeCredValue(process.env.X_CLIENT_ID),
        clientSecret: normalizeCredValue(process.env.X_CLIENT_SECRET),
      };
    case "TIKTOK":
      return {
        clientId: normalizeCredValue(process.env.TIKTOK_CLIENT_KEY),
        clientSecret: normalizeCredValue(process.env.TIKTOK_CLIENT_SECRET),
      };
    case "PINTEREST":
      return {
        clientId: normalizeCredValue(process.env.PINTEREST_APP_ID),
        clientSecret: normalizeCredValue(process.env.PINTEREST_APP_SECRET),
      };
    default:
      return null;
  }
}

/** Env (Vercel) öncelikli; panel dosyası yalnızca env yoksa */
export function getPlatformCreds(provider: PlatformType): PlatformCreds | null {
  const fromEnv = envCreds(provider);
  if (isValidCreds(fromEnv)) return fromEnv;

  const stored = readStore()[provider];
  if (stored) {
    const normalized = {
      clientId: normalizeCredValue(stored.clientId),
      clientSecret: normalizeCredValue(stored.clientSecret),
    };
    if (isValidCreds(normalized)) return normalized;
  }
  return null;
}

function isValidCreds(creds?: PlatformCreds | null): boolean {
  if (!creds) return false;
  const id = normalizeCredValue(creds.clientId);
  const secret = normalizeCredValue(creds.clientSecret);
  if (!id || !secret) return false;
  // E-posta / telefon Client ID olamaz (sık karışıklık)
  if (id.includes("@") || id.includes(" ")) return false;
  if (/^\d{4,8}$/.test(secret)) return false; // tipik PIN/şifre
  if (id.length < 8 || id.length > 64) return false;
  return true;
}

export function clearPlatformCreds(provider?: PlatformType) {
  if (!provider) {
    writeStore({});
    // Çalışan process'teki hatalı env'i de temizle
    for (const key of [
      "LINKEDIN_CLIENT_ID",
      "LINKEDIN_CLIENT_SECRET",
      "FACEBOOK_APP_ID",
      "FACEBOOK_APP_SECRET",
    ] as const) {
      // .env boşsa process'te kalan eski değeri sil
      if (process.env[key]?.includes("@")) delete process.env[key];
    }
    return;
  }
  const store = readStore();
  delete store[provider];
  writeStore(store);
  if (provider === "LINKEDIN") {
    delete process.env.LINKEDIN_CLIENT_ID;
    delete process.env.LINKEDIN_CLIENT_SECRET;
  }
  if (provider === "FACEBOOK" || provider === "INSTAGRAM") {
    delete process.env.FACEBOOK_APP_ID;
    delete process.env.FACEBOOK_APP_SECRET;
  }
}

export function loadPlatformCredsIntoEnv() {
  // Önce hafızada kalmış hatalı e-posta Client ID'lerini temizle
  for (const key of [
    "LINKEDIN_CLIENT_ID",
    "LINKEDIN_CLIENT_SECRET",
    "FACEBOOK_APP_ID",
    "FACEBOOK_APP_SECRET",
  ] as const) {
    const v = process.env[key];
    if (v?.includes("@") || (key.endsWith("SECRET") && /^\d{4,8}$/.test(v || ""))) {
      delete process.env[key];
    }
  }

  const store = readStore();
  for (const [provider, creds] of Object.entries(store)) {
    if (!isValidCreds(creds)) continue;
    applyCredsToEnv(provider as PlatformType, creds!);
  }
}

function applyCredsToEnv(provider: PlatformType, creds: PlatformCreds) {
  switch (provider) {
    case "FACEBOOK":
    case "INSTAGRAM":
      process.env.FACEBOOK_APP_ID = creds.clientId;
      process.env.FACEBOOK_APP_SECRET = creds.clientSecret;
      break;
    case "LINKEDIN":
      process.env.LINKEDIN_CLIENT_ID = creds.clientId;
      process.env.LINKEDIN_CLIENT_SECRET = creds.clientSecret;
      break;
    case "YOUTUBE":
      process.env.YOUTUBE_CLIENT_ID = creds.clientId;
      process.env.YOUTUBE_CLIENT_SECRET = creds.clientSecret;
      break;
    case "X":
      process.env.X_CLIENT_ID = creds.clientId;
      process.env.X_CLIENT_SECRET = creds.clientSecret;
      break;
    case "TIKTOK":
      process.env.TIKTOK_CLIENT_KEY = creds.clientId;
      process.env.TIKTOK_CLIENT_SECRET = creds.clientSecret;
      break;
    case "PINTEREST":
      process.env.PINTEREST_APP_ID = creds.clientId;
      process.env.PINTEREST_APP_SECRET = creds.clientSecret;
      break;
  }
}

export function savePlatformCreds(provider: PlatformType, creds: PlatformCreds) {
  const next = {
    clientId: normalizeCredValue(creds.clientId),
    clientSecret: normalizeCredValue(creds.clientSecret),
  };
  if (!isValidCreds(next)) {
    throw new Error(
      "Geçersiz Client ID/Secret. E-posta veya hesap şifresi değil; Developer App kimlik bilgilerini kullanın."
    );
  }
  const store = readStore();
  store[provider] = next;
  writeStore(store);
  applyCredsToEnv(provider, store[provider]!);
}

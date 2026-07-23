"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProviderIcon } from "@/components/posts/provider-icon";

const META: Record<
  string,
  {
    name: string;
    envId: string;
    envSecret: string;
    consoleUrl: string;
    redirectHint: string;
    steps: string[];
  }
> = {
  facebook: {
    name: "Facebook",
    envId: "FACEBOOK_APP_ID",
    envSecret: "FACEBOOK_APP_SECRET",
    consoleUrl: "https://developers.facebook.com/apps/",
    redirectHint: "/api/accounts/oauth/facebook/callback",
    steps: [
      "Meta for Developers’da uygulama oluştur (Tür: Business)",
      "Ürün ekle: Facebook Login",
      "Valid OAuth Redirect URIs alanına aşağıdaki URL’yi ekle",
      "App ID ve App Secret’ı buraya yapıştır → Kaydet",
      "Hesap Bağla ile gerçek Facebook girişine yönleneceksin",
    ],
  },
  instagram: {
    name: "Instagram",
    envId: "FACEBOOK_APP_ID",
    envSecret: "FACEBOOK_APP_SECRET",
    consoleUrl: "https://developers.facebook.com/apps/",
    redirectHint: "/api/accounts/oauth/instagram/callback",
    steps: [
      "Instagram, aynı Meta (Facebook) App ID/Secret ile çalışır",
      "Facebook Login + Instagram Graph izinlerini aç",
      "Redirect URI olarak Instagram callback URL’sini ekle",
      "Anahtarları kaydet, sonra Instagram’ı bağla",
      "Sayfana bağlı Instagram Business/Creator hesabı gerekir",
    ],
  },
  linkedin: {
    name: "LinkedIn",
    envId: "LINKEDIN_CLIENT_ID",
    envSecret: "LINKEDIN_CLIENT_SECRET",
    consoleUrl: "https://www.linkedin.com/developers/apps",
    redirectHint: "/api/accounts/oauth/linkedin/callback",
    steps: [
      "LinkedIn Developer’da uygulama oluştur",
      "Auth sekmesinde Redirect URL ekle",
      "Products: Sign In with LinkedIn + Share on LinkedIn",
      "Client ID / Secret’ı kaydet",
      "Hesap Bağla ile LinkedIn’e git",
    ],
  },
  youtube: {
    name: "YouTube",
    envId: "YOUTUBE_CLIENT_ID",
    envSecret: "YOUTUBE_CLIENT_SECRET",
    consoleUrl: "https://console.cloud.google.com/apis/credentials",
    redirectHint: "/api/accounts/oauth/youtube/callback",
    steps: [
      "Google Cloud’da OAuth 2.0 Client oluştur",
      "YouTube Data API v3’ü etkinleştir",
      "Authorized redirect URI ekle",
      "Client ID / Secret kaydet",
    ],
  },
  x: {
    name: "X",
    envId: "X_CLIENT_ID",
    envSecret: "X_CLIENT_SECRET",
    consoleUrl: "https://developer.x.com/en/portal/dashboard",
    redirectHint: "/api/accounts/oauth/x/callback",
    steps: [
      "X Developer Portal’da uygulama oluştur",
      "OAuth 2.0 + PKCE etkinleştir",
      "Callback URL ekle",
      "Client ID / Secret kaydet",
    ],
  },
  tiktok: {
    name: "TikTok",
    envId: "TIKTOK_CLIENT_KEY",
    envSecret: "TIKTOK_CLIENT_SECRET",
    consoleUrl: "https://developers.tiktok.com/",
    redirectHint: "/api/accounts/oauth/tiktok/callback",
    steps: [
      "TikTok Developers’da uygulama oluştur",
      "Login Kit + Content Posting API",
      "Redirect URI ekle",
      "Client Key / Secret kaydet",
    ],
  },
  pinterest: {
    name: "Pinterest",
    envId: "PINTEREST_APP_ID",
    envSecret: "PINTEREST_APP_SECRET",
    consoleUrl: "https://developers.pinterest.com/",
    redirectHint: "/api/accounts/oauth/pinterest/callback",
    steps: [
      "Pinterest Developers’da uygulama oluştur",
      "Redirect URI ekle",
      "App ID / Secret kaydet",
    ],
  },
};

export function PlatformSetupForm({
  initialReady = {},
  appOrigin,
}: {
  initialReady?: Record<string, boolean>;
  appOrigin: string;
}) {
  const search = useSearchParams();
  const router = useRouter();
  const providerKey = (search.get("provider") || "facebook").toLowerCase();
  const connectType = search.get("type") || "page";
  const meta = META[providerKey] || META.facebook;
  const providerUpper = providerKey.toUpperCase();

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(initialReady);

  const redirectUri = useMemo(
    () => `${appOrigin.replace(/\/$/, "")}${meta.redirectHint}`,
    [appOrigin, meta.redirectHint]
  );

  const isReady = !!ready[providerUpper] || (!!ready.FACEBOOK && providerUpper === "INSTAGRAM");

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      // Instagram Meta app ile aynı anahtarları kullanır
      const saveProvider = providerUpper === "INSTAGRAM" ? "FACEBOOK" : providerUpper;
      const res = await fetch("/api/accounts/platform-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: saveProvider,
          clientId,
          clientSecret,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Kaydedilemedi");
        return;
      }
      setReady((prev) => ({
        ...prev,
        [saveProvider]: true,
        ...(saveProvider === "FACEBOOK" ? { INSTAGRAM: true } : {}),
      }));
      setMessage("Kaydedildi. Şimdi gerçek bağlantıya geçebilirsin.");
      setClientSecret("");
    } finally {
      setBusy(false);
    }
  }

  function connectReal() {
    window.location.href = `/api/accounts/oauth/${providerKey}?type=${encodeURIComponent(connectType)}`;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/accounts/create" className="text-sm font-semibold text-accent hover:underline">
          ← Platformlar
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <ProviderIcon provider={providerUpper} size={40} />
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-900">
              {meta.name} — gerçek bağlantı kurulumu
            </h1>
            <p className="text-sm text-ink-500">
              App ID / Secret olmadan gerçek hesabına bağlanılamaz.
            </p>
          </div>
        </div>
      </div>

      {isReady ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">Anahtarlar hazır</p>
          <p className="mt-1">Gerçek {meta.name} giriş ekranına gidebilirsin.</p>
          <button
            type="button"
            onClick={connectReal}
            className="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            {meta.name} ile gerçek bağlan
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Henüz App kimliği yok. Aşağıdaki adımları tamamla.
        </div>
      )}

      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-sm font-semibold text-ink-900">1) Developer konsolu</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-600">
          {meta.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <a
          href={meta.consoleUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex text-sm font-semibold text-accent hover:underline"
        >
          {meta.name} Developer aç ↗
        </a>
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-sm font-semibold text-ink-900">2) Redirect URI (birebir ekle)</h2>
        <code className="mt-3 block break-all rounded-xl bg-ink-50 px-3 py-2 text-xs text-ink-800">
          {redirectUri}
        </code>
        <button
          type="button"
          className="mt-2 text-xs font-semibold text-accent hover:underline"
          onClick={() => void navigator.clipboard.writeText(redirectUri)}
        >
          Kopyala
        </button>
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-sm font-semibold text-ink-900">3) App kimlik bilgileri</h2>
        <p className="mt-1 text-xs text-ink-500">
          {meta.envId} / {meta.envSecret} — panele kaydedilir (veya .env’e yazılabilir).
          E-posta veya hesap şifresi yazmayın; Developer konsolundaki Client ID / Secret.
        </p>
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-ink-500">App ID / Client ID</span>
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
            placeholder={
              provider === "linkedin"
                ? "örn. 86abcdef… (e-posta değil)"
                : "1234567890…"
            }
            autoComplete="off"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-ink-500">App Secret / Client Secret</span>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
            placeholder="••••••••"
            autoComplete="off"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !clientId.trim() || !clientSecret.trim()}
            onClick={() => void save()}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Kaydediliyor…" : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/accounts/create")}
            className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-700"
          >
            İptal
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-ink-700">{message}</p> : null}
      </div>
    </div>
  );
}

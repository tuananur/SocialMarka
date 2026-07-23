"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { Alert, Button, Input, Label, Spinner } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { PanelPromoDemo } from "@/components/auth/panel-promo-demo";
import { queueAuthWelcome } from "@/lib/auth-welcome";

const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || "http://localhost:3000";

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const registered = searchParams.get("registered") === "1";
  const emailFromRegister = searchParams.get("email") || "";
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState(emailFromRegister);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam
      ? errorParam === "Configuration"
        ? "Sunucu giriş ayarı eksik (AUTH_SECRET). Yönetici Vercel Environment Variables’a AUTH_SECRET eklemeli."
        : errorParam === "workspace_inactive"
          ? "Çalışma alanınız pasif. Yönetici ile iletişime geçin."
          : "Giriş başarısız. Bilgilerinizi kontrol edin."
      : null
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    const res = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
      callbackUrl,
    });
    if (res?.error || !res?.ok) {
      setBusy(false);
      setError("E-posta veya şifre hatalı.");
      return;
    }

    setSuccess(true);
    queueAuthWelcome("login");
    // Soft router.push çerezden önce RSC çekebiliyor → panel flash + login’e dönüş.
    // Tam sayfa yönlendirme oturum çerezinin kesin gitmesini sağlar.
    window.location.assign(callbackUrl.startsWith("/") ? callbackUrl : "/dashboard");
  }

  return (
    <div className="w-full max-w-[400px]">
      <Link
        href={marketingUrl}
        className="mb-10 inline-flex items-center gap-2.5 lg:hidden"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 text-[10px] font-medium text-white">
          SM
        </span>
        <span className="font-display text-xl font-medium tracking-tight text-ink-900">
          SocialMarka
        </span>
      </Link>

      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        Panele giriş
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink-950">
        Hoş geldiniz
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">
        Çalışma alanınıza e-posta ile devam edin.
      </p>

      <div className="mt-8 space-y-4">
        {registered && !success && !error && (
          <div className="animate-fade-in rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800">
            Hesabınız hazır. Giriş yaparak panele geçin.
          </div>
        )}

        {success && (
          <div className="animate-fade-in flex items-center gap-2 rounded-2xl border border-brand-200/70 bg-brand-50/80 px-4 py-3 text-sm text-ink-800">
            <Spinner size="sm" />
            Panele yönlendiriliyorsunuz…
          </div>
        )}

        {error && !success && (
          <Alert status="danger">
            <Alert.Content>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {!success && (
          <>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-ink-700">
                  E-posta
                </Label>
                <Input
                  id="email"
                  type="email"
                  fullWidth
                  required
                  autoComplete="email"
                  placeholder="ornek@sirket.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-ink-700">
                  Şifre
                </Label>
                <Input
                  id="password"
                  type="password"
                  fullWidth
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                className="h-11 rounded-xl font-semibold shadow-lg shadow-accent/25"
                isDisabled={busy}
              >
                {busy ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>

            <div className="relative py-1 text-center">
              <span className="relative z-10 bg-[linear-gradient(180deg,#f4f8fc_0%,#ffffff_80%)] px-3 text-[11px] font-medium uppercase tracking-wider text-ink-400">
                veya
              </span>
              <span className="absolute inset-x-0 top-1/2 h-px bg-ink-100" />
            </div>

            <GoogleAuthButton label="Google ile devam et" callbackUrl={callbackUrl} />

            <p className="pt-2 text-center text-sm text-ink-500">
              Hesabınız yok mu?{" "}
              <Link href="/register" className="font-semibold text-accent hover:underline">
                Kayıt Ol
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Tek sahne — flat mavi/beyaz bölünme yok */}
      <div className="hero-stage absolute inset-0" />
      <div className="pointer-events-none absolute -left-24 top-10 h-[28rem] w-[28rem] rounded-full bg-brand-400/30 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-sky-300/30 blur-[90px]" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-teal-200/20 blur-[80px]" />

      <div className="relative mx-auto grid min-h-dvh max-w-6xl lg:grid-cols-[1.15fr_0.85fr]">
        {/* Sol: marka + sahne */}
        <aside className="relative hidden flex-col justify-between px-10 py-10 lg:flex xl:px-14 xl:py-12">
          <Link href={marketingUrl} className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 text-[11px] font-medium tracking-wide text-white shadow-md shadow-accent/30">
              SM
            </span>
            <span className="font-display text-2xl font-medium tracking-tight text-ink-900">
              SocialMarka
            </span>
          </Link>

          <div className="my-8 flex min-h-0 flex-1 flex-col justify-center gap-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                Sosyal medya komuta merkezi
              </p>
              <h2 className="mt-3 max-w-md font-display text-[2.1rem] font-medium leading-[1.15] tracking-tight text-ink-950">
                Tüm hesaplarınız, tek aydınlık panelde
              </h2>
              <ul className="mt-6 max-w-sm space-y-3 text-sm text-ink-600">
                {[
                  "Takvim, gelen kutusu ve analitik",
                  "Marka grupları ve ekip rolleri",
                  "Facebook’tan TikTok’a tüm mecralar",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative max-w-lg">
              <div className="animate-float">
                <PanelPromoDemo />
              </div>
            </div>
          </div>

          <p className="text-xs text-ink-400">© {new Date().getFullYear()} SocialMarka</p>
        </aside>

        {/* Sağ: form */}
        <main className="flex min-h-dvh items-center justify-center px-6 py-12 lg:px-10">
          <div className="w-full rounded-[1.75rem] border border-white/70 bg-white/75 p-8 shadow-[var(--shadow-lift)] backdrop-blur-xl sm:p-10">
            <Suspense fallback={<div className="text-sm text-ink-400">Yükleniyor...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

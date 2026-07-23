"use client";

import Link from "next/link";
import { Alert, Button, Input, Label, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { PanelPromoDemo } from "@/components/auth/panel-promo-demo";

const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || "http://localhost:3000";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    const displayName = name.trim() || normalizedEmail.split("@")[0];

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, email: normalizedEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kayıt başarısız");

      setSuccess(true);
      const params = new URLSearchParams({
        registered: "1",
        email: data.user?.email || normalizedEmail,
      });
      router.push(`/login?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız");
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="hero-stage absolute inset-0" />
      <div className="pointer-events-none absolute -left-24 top-10 h-[28rem] w-[28rem] rounded-full bg-brand-400/30 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-sky-300/30 blur-[90px]" />

      <div className="relative mx-auto grid min-h-dvh max-w-6xl lg:grid-cols-[1.15fr_0.85fr]">
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
                Ücretsiz başlayın
              </p>
              <h2 className="mt-3 max-w-md font-display text-[2.1rem] font-medium leading-[1.15] tracking-tight text-ink-950">
                Dakikalar içinde çalışma alanınızı oluşturun
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-600">
                Hesap oluşunca giriş sayfasına yönlendirilirsiniz; ardından panel açılır.
              </p>
            </div>
            <div className="relative max-w-lg">
              <div className="animate-float">
                <PanelPromoDemo />
              </div>
            </div>
          </div>

          <p className="text-xs text-ink-400">© {new Date().getFullYear()} SocialMarka</p>
        </aside>

        <main className="flex min-h-dvh items-center justify-center px-6 py-12 lg:px-10">
          <div className="w-full max-w-[400px] rounded-[1.75rem] border border-white/70 bg-white/75 p-8 shadow-[var(--shadow-lift)] backdrop-blur-xl sm:p-10">
            <Link href={marketingUrl} className="mb-10 inline-flex items-center gap-2.5 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 text-[10px] font-medium text-white">
                SM
              </span>
              <span className="font-display text-xl font-medium text-ink-900">SocialMarka</span>
            </Link>

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              Yeni hesap
            </p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink-950">
              Kayıt Ol
            </h1>
            <p className="mt-2 text-sm text-ink-500">Kredi kartı gerekmez.</p>

            <div className="mt-8 space-y-4">
              {success && (
                <div className="animate-fade-in flex items-center gap-2 rounded-2xl border border-brand-200/70 bg-brand-50/80 px-4 py-3 text-sm text-ink-800">
                  <Spinner size="sm" />
                  Giriş sayfasına yönlendiriliyorsunuz…
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
                      <Label htmlFor="name">Ad Soyad</Label>
                      <Input
                        id="name"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Adınız"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta</Label>
                      <Input
                        id="email"
                        type="email"
                        fullWidth
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ornek@sirket.com"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Şifre</Label>
                      <Input
                        id="password"
                        type="password"
                        fullWidth
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="En az 6 karakter"
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
                      {busy ? "Oluşturuluyor..." : "Hesap Oluştur"}
                    </Button>
                  </form>

                  <div className="relative py-1 text-center">
                    <span className="relative z-10 bg-white/90 px-3 text-[11px] font-medium uppercase tracking-wider text-ink-400">
                      veya
                    </span>
                    <span className="absolute inset-x-0 top-1/2 h-px bg-ink-100" />
                  </div>

                  <GoogleAuthButton label="Google ile kayıt ol" callbackUrl="/login" />

                  <p className="pt-2 text-center text-sm text-ink-500">
                    Zaten hesabınız var mı?{" "}
                    <Link href="/login" className="font-semibold text-accent hover:underline">
                      Giriş Yap
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

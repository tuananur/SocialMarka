"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { MarketingNav } from "@/components/marketing/nav";
import { Reveal } from "@/components/marketing/motion";
import { PlatformBadge } from "@/components/marketing/platform-logo";
import { CtaBand } from "@/components/marketing/guide-chrome";
import { PLATFORMS } from "@/lib/platforms";
import { getLoginHref } from "@/lib/urls";

export default function PlatformsIndexPage() {
  const router = useRouter();
  const loginHref = getLoginHref();

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      <section className="relative overflow-hidden border-b border-separator/50">
        <div className="hero-stage absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              6 platform
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl lg:text-6xl">
              Desteklenen mecralar
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-600">
              Her platform kendi detay sayfasında — iş akışı, senaryolar ve ipuçlarıyla.
            </p>
          </Reveal>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((p, i) => (
            <Reveal key={p.slug} delayMs={i * 60} className="h-full" variant="fade">
              <Link
                href={`/platforms/${p.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-separator/70 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/10"
              >
                <div
                  className="relative flex items-center gap-4 px-6 pb-4 pt-6"
                  style={{
                    background: `linear-gradient(135deg, ${p.color}18, transparent 70%)`,
                  }}
                >
                  <PlatformBadge
                    slug={p.slug}
                    size={56}
                    className="rounded-2xl shadow-md transition group-hover:scale-105"
                  />
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-ink-950 group-hover:text-accent">
                      {p.name}
                    </h2>
                    <p className="text-sm font-semibold text-accent">Detayı aç →</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col px-6 pb-6">
                  <p className="text-sm leading-relaxed text-ink-600">{p.description}</p>
                  <ul className="mt-4 space-y-2 border-t border-separator/60 pt-4">
                    {p.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm font-medium text-ink-700">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-14">
          <CtaBand
            title="Hemen bağlayıp yayınlayın"
            desc="Kayıt olun, hesaplarınızı bağlayın ve ilk gönderinizi planlayın."
          >
            <Button
              variant="secondary"
              className="bg-white font-semibold text-accent"
              onPress={() => router.push("/register")}
            >
              Ücretsiz Dene
            </Button>
            <Button
              variant="outline"
              className="border-white/40 text-white"
              onPress={() => router.push(loginHref)}
            >
              Giriş Yap
            </Button>
          </CtaBand>
        </div>
      </main>
    </div>
  );
}

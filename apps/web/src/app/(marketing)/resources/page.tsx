"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { MarketingNav } from "@/components/marketing/nav";
import { CtaBand } from "@/components/marketing/guide-chrome";
import { RESOURCE_CATEGORIES, RESOURCES } from "@/lib/resources";

export default function ResourcesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <section className="relative overflow-hidden border-b border-separator/50">
        <div className="hero-stage absolute inset-0" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 animate-pulse-soft rounded-full bg-sky-300/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <p className="animate-rise text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            Kaynaklar
          </p>
          <h1 className="animate-rise-delay mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl lg:text-6xl">
            Yol gösterici rehberler
          </h1>
          <p className="animate-rise-delay mt-4 max-w-2xl text-lg text-ink-600">
            Düz bir makale değil — her rehber sizi bir sonraki adıma götürür. Başlarken, kullanım
            ve yardım.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              className="font-semibold shadow-lg shadow-accent/25"
              onPress={() => router.push("/resources/baslangic")}
            >
              SocialMarka nedir?
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-semibold"
              onPress={() => router.push("/resources/sss")}
            >
              Sık sorulanlar
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-16 px-6 py-14">
        {RESOURCE_CATEGORIES.map((cat) => {
          const items = RESOURCES.filter((r) => r.category === cat.id);
          return (
            <section key={cat.id}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl font-semibold text-ink-950">{cat.label}</h2>
                  <p className="mt-1 text-sm text-ink-500">{cat.desc}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((g, i) => (
                  <Link
                    key={g.slug}
                    href={`/resources/${g.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-separator/70 bg-[linear-gradient(165deg,#ffffff_0%,#f3f8ff_100%)] p-6 shadow-sm transition hover:-translate-y-1 hover:border-accent/35 hover:shadow-xl hover:shadow-brand-900/8"
                  >
                    <span className="font-display text-5xl font-semibold text-accent/15 transition group-hover:text-accent/30">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-3 font-display text-2xl font-semibold text-ink-950 group-hover:text-accent">
                      {g.shortTitle}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-accent">{g.menuDesc}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600">
                      {g.intro.length > 110 ? `${g.intro.slice(0, 110)}…` : g.intro}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                      Rehberi aç
                      <span className="transition group-hover:translate-x-1">→</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <CtaBand
          title="Hazır mısınız?"
          desc="Rehberleri okudunuz — kendi çalışma alanınızı açın."
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
            onPress={() => router.push("/contact")}
          >
            İletişim
          </Button>
        </CtaBand>
      </main>
    </div>
  );
}

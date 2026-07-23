"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { MarketingNav } from "@/components/marketing/nav";
import { CtaBand } from "@/components/marketing/guide-chrome";
import { FEATURES } from "@/lib/features";

export default function FeaturesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <section className="relative overflow-hidden border-b border-separator/50">
        <div className="hero-stage absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <p className="animate-rise text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            Ürün
          </p>
          <h1 className="animate-rise-delay mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl lg:text-6xl">
            Özellikler
          </h1>
          <p className="animate-rise-delay mt-4 max-w-2xl text-lg text-ink-600">
            Her yetenek kendi sahnesinde: ne işe yarar, nasıl kullanılır, nereye gidersiniz.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              className="font-semibold shadow-lg shadow-accent/25"
              onPress={() => router.push("/register")}
            >
              Ücretsiz Dene
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-semibold"
              onPress={() => router.push("/platforms")}
            >
              Platformları gör
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-5 lg:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Link
              key={f.slug}
              href={`/features/${f.slug}`}
              className={`group relative overflow-hidden rounded-3xl border border-separator/70 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/10 ${
                i % 3 === 0
                  ? "bg-gradient-to-br from-brand-700 to-brand-500 text-white lg:row-span-1"
                  : "bg-[linear-gradient(165deg,#ffffff_0%,#f3f8ff_100%)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    i % 3 === 0 ? "bg-white/20 text-white" : "bg-accent/10 text-accent"
                  }`}
                >
                  {f.tag}
                </span>
                <span
                  className={`font-display text-4xl font-semibold ${
                    i % 3 === 0 ? "text-white/25" : "text-accent/15"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h2
                className={`mt-5 font-display text-2xl font-semibold sm:text-3xl ${
                  i % 3 === 0 ? "text-white" : "text-ink-950 group-hover:text-accent"
                }`}
              >
                {f.title}
              </h2>
              <p
                className={`mt-3 text-sm leading-relaxed ${
                  i % 3 === 0 ? "text-white/90" : "text-ink-600"
                }`}
              >
                {f.intro.length > 140 ? `${f.intro.slice(0, 140)}…` : f.intro}
              </p>
              <span
                className={`mt-6 inline-flex text-sm font-semibold ${
                  i % 3 === 0 ? "text-white" : "text-accent"
                }`}
              >
                Detayı aç →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-14">
          <CtaBand
            title="Özellikleri panelde görün"
            desc="Kayıt olun; editör, takvim ve gelen kutusu sizi bekliyor."
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
              onPress={() => router.push("/resources/baslangic")}
            >
              Başlangıç rehberi
            </Button>
          </CtaBand>
        </div>
      </main>
    </div>
  );
}

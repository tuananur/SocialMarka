"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { MarketingNav } from "@/components/marketing/nav";
import { HeroMockup } from "@/components/marketing/hero-mockup";
import { FeaturesTabs } from "@/components/marketing/features-tabs";
import { PlatformBadge } from "@/components/marketing/platform-logo";
import { Reveal } from "@/components/marketing/motion";
import { PLATFORMS } from "@/lib/platforms";
import { getLoginHref } from "@/lib/urls";

const journey = [
  {
    step: "01",
    title: "Tanıyın",
    desc: "SocialMarka ne işe yarar, kimler için?",
    href: "/resources/baslangic",
    cta: "Başlangıç rehberi",
  },
  {
    step: "02",
    title: "Bağlayın",
    desc: "Hesapları ekleyin, ilk alanı hazırlayın.",
    href: "/resources/accounts",
    cta: "Hesap bağlama",
  },
  {
    step: "03",
    title: "Yayınlayın",
    desc: "İlk gönderiyi yazıp paylaşın veya planlayın.",
    href: "/resources/ilk-gonderi",
    cta: "İlk gönderi",
  },
];

const paths = [
  {
    title: "Hızlı bakış",
    desc: "2 dakikada ürünü anlayın.",
    href: "/resources/baslangic",
  },
  {
    title: "Özellikleri keşfedin",
    desc: "Editör, takvim, gelen kutusu, analitik.",
    href: "/features",
  },
  {
    title: "Mecraları görün",
    desc: "TikTok’tan Pinterest’e desteklenen platformlar.",
    href: "/platforms",
  },
  {
    title: "Takıldınız mı?",
    desc: "SSS veya iletişim formu.",
    href: "/resources/sss",
  },
];

export default function MarketingHomePage() {
  const router = useRouter();
  const loginHref = getLoginHref();
  const marqueePlatforms = [...PLATFORMS, ...PLATFORMS];

  return (
    <div className="min-h-screen overflow-x-hidden text-foreground">
      <MarketingNav />

      <section className="relative min-h-[min(94vh,920px)] overflow-hidden">
        <div className="hero-stage absolute inset-0" />
        <div className="pointer-events-none absolute -right-28 top-16 h-[28rem] w-[28rem] animate-pulse-soft rounded-full bg-brand-400/35 blur-[90px]" />
        <div
          className="pointer-events-none absolute -left-28 bottom-0 h-80 w-80 animate-pulse-soft rounded-full bg-teal-300/25 blur-[80px]"
          style={{ animationDelay: "1.2s" }}
        />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-10 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pb-16 lg:pt-14">
          <div>
            <p className="animate-rise font-display text-5xl font-semibold tracking-tight text-shimmer sm:text-6xl lg:text-[4.5rem] lg:leading-[0.92]">
              SocialMarka
            </p>
            <h1 className="animate-rise-delay mt-6 max-w-xl text-balance font-display text-3xl font-medium leading-[1.12] text-ink-950 sm:text-4xl lg:text-[2.85rem]">
              Tüm sosyal hesaplarınız tek panelde
            </h1>
            <p className="animate-rise-delay mt-5 max-w-md text-lg leading-relaxed text-ink-600">
              Planlayın, yayınlayın, yanıtlayın. Tanıtım rehberleriyle adım adım ilerleyin —
              dağınık araçlar olmadan.
            </p>
            <div className="animate-rise-delay-2 mt-9 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                className="h-12 px-6 font-semibold shadow-xl shadow-accent/35"
                onPress={() => router.push("/register")}
              >
                Ücretsiz Dene
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 border-brand-200/90 bg-white/75 px-6 font-semibold backdrop-blur"
                onPress={() => router.push("/resources/baslangic")}
              >
                Nasıl çalışır?
              </Button>
            </div>
          </div>

          <HeroMockup />
        </div>

        <div className="relative border-t border-white/50 bg-white/35 py-6 backdrop-blur-md">
          <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
            Desteklenen platformlar
          </p>
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#e4efff] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#eef5ff] to-transparent" />
            <div className="animate-marquee flex w-max gap-12 px-6">
              {marqueePlatforms.map((p, i) => (
                <Link
                  key={`${p.slug}-${i}`}
                  href={`/platforms/${p.slug}`}
                  className="flex items-center gap-3 opacity-75 transition hover:opacity-100"
                >
                  <PlatformBadge slug={p.slug} size={36} className="rounded-xl shadow-sm" />
                  <span className="whitespace-nowrap text-sm font-semibold text-ink-700">
                    {p.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-atmosphere relative border-b border-brand-100/80 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal variant="fade">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Yol haritası
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
              Sitede kalın, adım adım ilerleyin
            </h2>
            <p className="mt-4 max-w-lg text-lg text-ink-600">
              Kayıt olmadan önce veya hemen sonra — her adım bir rehbere açılır.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {journey.map((item, i) => (
              <Reveal key={item.step} delayMs={i * 90} variant="fade">
                <Link
                  href={item.href}
                  className="group relative block overflow-hidden rounded-3xl border border-brand-200/50 bg-white/80 p-7 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:border-accent/30 hover:shadow-[var(--shadow-lift)]"
                >
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-300/20 blur-2xl transition group-hover:bg-brand-400/30" />
                  <span className="relative font-display text-6xl font-semibold text-accent/15 transition group-hover:text-accent/30">
                    {item.step}
                  </span>
                  <h3 className="relative mt-3 font-display text-2xl font-semibold text-ink-950 group-hover:text-accent">
                    {item.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-ink-600">{item.desc}</p>
                  <span className="relative mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                    {item.cta}
                    <span className="transition group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="ozellikler" className="mx-auto max-w-6xl px-6 py-24">
        <Reveal variant="fade">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Yetenekler
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
              Ajanslar ve markalar için tek çatı
            </h2>
            <p className="mt-4 text-lg text-ink-600">
              Yayınlama, işbirliği, etkileşim ve analitik — merak ettikçe detaya inin.
            </p>
          </div>
        </Reveal>
        <Reveal delayMs={80} className="mt-12" variant="fade">
          <FeaturesTabs />
        </Reveal>
      </section>

      <section className="relative overflow-hidden border-y border-brand-100/80 py-24">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f0f6ff_0%,#ffffff_55%)]" />
        <div className="pointer-events-none absolute inset-0 dot-pattern opacity-35" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal variant="fade">
            <h2 className="font-display text-4xl font-semibold text-ink-950 sm:text-5xl">
              Nereye bakmak istersiniz?
            </h2>
            <p className="mt-4 max-w-xl text-lg text-ink-600">
              Tanıtım sitesinde kaybolmayın — ihtiyacınıza göre bir yol seçin.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {paths.map((path, i) => (
              <Reveal key={path.href} delayMs={i * 60} variant="fade">
                <Link
                  href={path.href}
                  className="group flex items-start justify-between gap-4 rounded-3xl border border-brand-200/60 bg-white/90 p-7 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:border-accent/35 hover:shadow-[var(--shadow-lift)]"
                >
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-ink-950 group-hover:text-accent">
                      {path.title}
                    </h3>
                    <p className="mt-2 text-sm text-ink-600">{path.desc}</p>
                  </div>
                  <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-accent transition group-hover:translate-x-1 group-hover:bg-accent group-hover:text-white">
                    →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal variant="fade">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                Mecralar
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-ink-950">
                Altı platform, bir takvim
              </h2>
            </div>
            <Link
              href="/platforms"
              className="text-sm font-semibold text-accent link-underline"
            >
              Platform detayları →
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {PLATFORMS.map((p, i) => (
            <Reveal key={p.slug} delayMs={i * 40} variant="fade">
              <Link
                href={`/platforms/${p.slug}`}
                className="group flex flex-col items-center gap-3 text-center"
              >
                <span className="rounded-3xl bg-white p-3 shadow-[var(--shadow-soft)] ring-1 ring-brand-100 transition group-hover:-translate-y-1.5 group-hover:shadow-[var(--shadow-lift)]">
                  <PlatformBadge slug={p.slug} size={52} className="rounded-2xl" />
                </span>
                <span className="text-sm font-semibold text-ink-800 group-hover:text-accent">
                  {p.name}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-20">
        <div className="surface-ink relative overflow-hidden rounded-[2rem] px-8 py-14 sm:px-12">
          <div className="absolute inset-0 opacity-25 dot-pattern" />
          <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Hazırsanız çalışma alanınızı açın
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Rehberleri okudunuz — şimdi deneyin. Kayıt sonrası panel otomatik açılır.
            </p>
          </div>
          <div className="relative mt-9 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white font-semibold text-accent shadow-lg"
              onPress={() => router.push("/register")}
            >
              Ücretsiz Dene
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/40 font-semibold text-white"
              onPress={() => router.push(loginHref)}
            >
              Giriş Yap
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/40 font-semibold text-white"
              onPress={() => router.push("/resources")}
            >
              Rehberlere dön
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

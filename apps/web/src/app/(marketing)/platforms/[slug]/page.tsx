import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingNav } from "@/components/marketing/nav";
import { PlatformDetailActions } from "@/components/marketing/platform-detail-actions";
import { PlatformBadge } from "@/components/marketing/platform-logo";
import { Reveal } from "@/components/marketing/motion";
import {
  CtaBand,
  LinkTiles,
  TipTiles,
  TimelineSteps,
} from "@/components/marketing/guide-chrome";
import { getPlatform, PLATFORMS } from "@/lib/platforms";

export function generateStaticParams() {
  return PLATFORMS.map((p) => ({ slug: p.slug }));
}

export default async function PlatformDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const platform = getPlatform(slug);
  if (!platform) notFound();

  const others = PLATFORMS.filter((p) => p.slug !== platform.slug);

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      <section className="relative overflow-hidden border-b border-separator/50">
        <div className="hero-stage absolute inset-0" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse 75% 60% at 90% 10%, ${platform.color}, transparent 55%)`,
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-16">
          <Reveal variant="fade">
            <Link href="/platforms" className="text-sm font-semibold text-accent hover:underline">
              ← Tüm platformlar
            </Link>
            <div className="mt-6 flex items-center gap-4">
              <PlatformBadge slug={platform.slug} size={64} className="rounded-2xl shadow-lg" />
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
                {platform.name}
              </p>
            </div>
            <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
              {platform.headline}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-600">
              {platform.description}
            </p>
            <div className="mt-8">
              <PlatformDetailActions />
            </div>
          </Reveal>

          <Reveal delayMs={80} variant="fade">
            <div
              className="relative overflow-hidden rounded-3xl border border-white/70 p-6 shadow-xl shadow-brand-900/10 backdrop-blur sm:p-8"
              style={{
                background: `linear-gradient(155deg, ${platform.color}22, #ffffff 55%)`,
              }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                Hızlı özet
              </p>
              <ul className="mt-5 space-y-3">
                {platform.features.slice(0, 5).map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 rounded-xl border border-white/80 bg-white/90 px-3 py-2.5 text-sm font-semibold text-ink-800"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: platform.color }}
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-14 px-6 py-14">
        <Reveal variant="fade">
          <article className="grid gap-6 overflow-hidden rounded-3xl border border-separator/70 bg-white p-6 shadow-sm sm:grid-cols-[auto_1fr] sm:p-10">
            <div className="font-display text-6xl font-semibold leading-none text-accent/20">01</div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink-950">
                Platforma derin bakış
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-600">
                {platform.longDescription}
              </p>
            </div>
          </article>
        </Reveal>

        <section>
          <Reveal variant="fade">
            <h2 className="font-display text-3xl font-semibold text-ink-950">
              Neden SocialMarka + {platform.name}?
            </h2>
          </Reveal>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {platform.benefits.map((b, i) => (
              <Reveal key={b.title} delayMs={i * 60} variant="fade">
                <div
                  className={`h-full rounded-3xl border border-separator/70 p-6 shadow-sm ${
                    i === 1
                      ? "bg-gradient-to-br from-brand-700 to-brand-500 text-white"
                      : "bg-[linear-gradient(165deg,#ffffff_0%,#f3f8ff_100%)]"
                  }`}
                >
                  <span
                    className={`font-display text-4xl font-semibold ${
                      i === 1 ? "text-white/25" : "text-accent/20"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className={`mt-2 font-display text-xl font-semibold ${
                      i === 1 ? "text-white" : "text-ink-900"
                    }`}
                  >
                    {b.title}
                  </h3>
                  <p
                    className={`mt-2 text-sm leading-relaxed ${
                      i === 1 ? "text-white/90" : "text-ink-600"
                    }`}
                  >
                    {b.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <TimelineSteps
          title={`${platform.name} ile nasıl kullanılır?`}
          subtitle={`${platform.name} hesabını SocialMarka’da bağlayıp ilk içeriğinizi yayınlayana kadar ekranda ne yapacağınızı adım adım anlatıyoruz.`}
          steps={platform.workflow.map((w) => ({
            title: w.title,
            desc: w.desc,
            details: w.details,
          }))}
        />

        <section>
          <h2 className="font-display text-3xl font-semibold text-ink-950">Öne çıkan yetenekler</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {platform.features.map((f, i) => (
              <div
                key={f}
                className="flex items-center gap-3 rounded-2xl border border-separator/70 bg-white px-4 py-4 text-sm font-semibold text-ink-800 shadow-sm"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: platform.color }}
                >
                  {i + 1}
                </span>
                {f}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl font-semibold text-ink-950">Kullanım senaryoları</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {platform.useCases.map((u, i) => (
              <div
                key={u.title}
                className={`rounded-3xl border border-separator/70 p-6 shadow-sm ${
                  i % 2 === 1
                    ? "bg-gradient-to-br from-brand-700 to-brand-500 text-white"
                    : "bg-white"
                }`}
              >
                <h3
                  className={`font-display text-xl font-semibold ${
                    i % 2 === 1 ? "text-white" : "text-ink-900"
                  }`}
                >
                  {u.title}
                </h3>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    i % 2 === 1 ? "text-white/90" : "text-ink-600"
                  }`}
                >
                  {u.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <TipTiles tips={platform.tips} />

        <LinkTiles
          title="Diğer platformlar"
          items={others.map((p) => ({
            title: p.name,
            href: `/platforms/${p.slug}`,
            desc: p.description.slice(0, 70) + "…",
          }))}
        />

        <CtaBand
          title={`${platform.name} ile bugün başlayın`}
          desc="Kayıt olun, hesabınızı bağlayın ve ilk gönderinizi planlayın."
        >
          <PlatformDetailActions tone="onAccent" />
        </CtaBand>
      </main>
    </div>
  );
}

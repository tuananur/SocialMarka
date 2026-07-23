"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { getLoginHref } from "@/lib/urls";
import { PLATFORMS } from "@/lib/platforms";
import { RESOURCE_CATEGORIES, RESOURCES } from "@/lib/resources";
import { FEATURES } from "@/lib/features";
import { PlatformBadge } from "@/components/marketing/platform-logo";

/**
 * Platform menüsü → ürün yetenekleri + sosyal mecralar
 * Kaynaklar menüsü → yalnızca rehberler
 * İletişim → üst menüde tek başına
 */
const platformCapabilityCards = [
  {
    title: "Editör",
    desc: "Çoklu mecra metin ve önizleme.",
    href: "/features/editor",
  },
  {
    title: "Zamanlama",
    desc: "Planlı yayın ve Hemen Paylaş.",
    href: "/features/scheduling",
  },
  {
    title: "Gelen kutusu",
    desc: "Yorum ve DM yönetimi.",
    href: "/features/social-inbox",
  },
  {
    title: "Analitik",
    desc: "Erişim ve performans özetleri.",
    href: "/features/analytics",
  },
];

const featureLinks = FEATURES.map((f) => ({
  title: f.title,
  href: `/features/${f.slug}`,
  desc: f.menuDesc,
}));

const resourceGroups = RESOURCE_CATEGORIES.map((cat) => ({
  ...cat,
  items: RESOURCES.filter((r) => r.category === cat.id).map((r) => ({
    title: r.shortTitle,
    desc: r.menuDesc,
    href: `/resources/${r.slug}`,
  })),
}));

type MenuKey = "platform" | "resources" | null;

export function MarketingNav() {
  const router = useRouter();
  const loginHref = getLoginHref();
  const [open, setOpen] = useState<MenuKey>(null);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
      <div className="nav-shell mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl px-4 py-2.5 sm:px-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/90 to-brand-400 text-[10px] font-medium tracking-wide text-white">
            SM
          </span>
          <span className="font-display text-lg font-medium tracking-tight text-ink-900 transition group-hover:text-accent">
            SocialMarka
          </span>
        </Link>

        <nav className="relative hidden items-center gap-0.5 md:flex">
          {/* —— PLATFORM (ürün) —— */}
          <div
            className="relative"
            onMouseEnter={() => setOpen("platform")}
            onMouseLeave={() => setOpen(null)}
          >
            <button
              type="button"
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                open === "platform"
                  ? "bg-brand-50/80 text-accent"
                  : "text-ink-600 hover:bg-ink-50 hover:text-accent"
              }`}
              onClick={() => setOpen((v) => (v === "platform" ? null : "platform"))}
            >
              Platform
              <span className="ml-1 opacity-50">▾</span>
            </button>
            {open === "platform" && (
              <div className="absolute left-1/2 top-full z-50 w-[min(960px,94vw)] -translate-x-[42%] pt-3">
                <div className="animate-mega-in overflow-hidden rounded-3xl border border-brand-200/60 bg-white/95 shadow-2xl shadow-brand-900/15 backdrop-blur-xl">
                  <div className="grid lg:grid-cols-[1.55fr_0.85fr]">
                    <div className="p-6">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                        Ürün yetenekleri
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {platformCapabilityCards.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="rounded-2xl border border-transparent p-3 transition hover:border-brand-200/80 hover:bg-brand-50/80"
                            onClick={() => setOpen(null)}
                          >
                            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-sm shadow-accent/25">
                              <MenuIcon />
                            </div>
                            <div className="text-sm font-semibold text-ink-900">{item.title}</div>
                            <p className="mt-1 text-xs leading-relaxed text-ink-500">{item.desc}</p>
                          </Link>
                        ))}
                      </div>

                      <div className="mt-6 grid gap-6 border-t border-separator/80 pt-5 sm:grid-cols-2">
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                              Tüm özellikler
                            </p>
                            <Link
                              href="/features"
                              className="text-[11px] font-semibold text-accent hover:underline"
                              onClick={() => setOpen(null)}
                            >
                              Liste →
                            </Link>
                          </div>
                          <ul className="space-y-1">
                            {featureLinks.map((f) => (
                              <li key={f.href}>
                                <Link
                                  href={f.href}
                                  className="flex flex-col rounded-xl px-2 py-1.5 hover:bg-brand-50"
                                  onClick={() => setOpen(null)}
                                >
                                  <span className="flex items-center gap-2 text-sm font-medium text-ink-800">
                                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                    {f.title}
                                  </span>
                                  <span className="ml-3.5 text-[11px] text-ink-500">{f.desc}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                              Sosyal medya platformları
                            </p>
                            <Link
                              href="/platforms"
                              className="text-[11px] font-semibold text-accent hover:underline"
                              onClick={() => setOpen(null)}
                            >
                              Tümü →
                            </Link>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {PLATFORMS.map((p) => (
                              <Link
                                key={p.slug}
                                href={`/platforms/${p.slug}`}
                                className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-medium text-ink-700 hover:bg-brand-50 hover:text-accent"
                                onClick={() => setOpen(null)}
                              >
                                <PlatformBadge slug={p.slug} size={28} className="rounded-md" />
                                {p.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <aside className="border-t border-separator/80 bg-gradient-to-b from-brand-700 to-brand-500 p-6 text-white lg:border-l lg:border-t-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                        Ürün
                      </p>
                      <h3 className="mt-3 font-display text-xl font-semibold">
                        Tek panelde yönetim
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/85">
                        Özellikler ve desteklenen mecralar burada. Rehberler için Kaynaklar menüsüne
                        bakın.
                      </p>
                      <div className="mt-5 space-y-2">
                        <Link
                          href="/features"
                          className="block text-sm font-semibold text-white hover:underline"
                          onClick={() => setOpen(null)}
                        >
                          Özellikler listesi →
                        </Link>
                        <Link
                          href="/platforms"
                          className="block text-sm font-semibold text-white hover:underline"
                          onClick={() => setOpen(null)}
                        >
                          Platform listesi →
                        </Link>
                        <Link
                          href="/register"
                          className="mt-3 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-accent"
                          onClick={() => setOpen(null)}
                        >
                          Ücretsiz dene →
                        </Link>
                      </div>
                    </aside>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* —— KAYNAKLAR (rehberler) —— */}
          <div
            className="relative"
            onMouseEnter={() => setOpen("resources")}
            onMouseLeave={() => setOpen(null)}
          >
            <button
              type="button"
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                open === "resources"
                  ? "bg-brand-50/80 text-accent"
                  : "text-ink-600 hover:bg-ink-50 hover:text-accent"
              }`}
              onClick={() => setOpen((v) => (v === "resources" ? null : "resources"))}
            >
              Kaynaklar
              <span className="ml-1 opacity-50">▾</span>
            </button>
            {open === "resources" && (
              <div className="absolute left-1/2 top-full z-50 w-[min(860px,94vw)] -translate-x-1/2 pt-3">
                <div className="animate-mega-in overflow-hidden rounded-3xl border border-brand-200/60 bg-white/95 shadow-2xl shadow-brand-900/15 backdrop-blur-xl">
                  <div className="grid lg:grid-cols-[1.55fr_0.85fr]">
                    <div className="grid gap-6 p-6 sm:grid-cols-3">
                      {resourceGroups.map((group) => (
                        <div key={group.id}>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                            {group.label}
                          </p>
                          <ul className="space-y-1">
                            {group.items.map((r) => (
                              <li key={r.href}>
                                <Link
                                  href={r.href}
                                  className="block rounded-xl px-2 py-2 hover:bg-brand-50"
                                  onClick={() => setOpen(null)}
                                >
                                  <span className="block text-sm font-semibold text-ink-900">
                                    {r.title}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-500">
                                    {r.desc}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <aside className="border-t border-separator/80 bg-[linear-gradient(165deg,#f0f7ff_0%,#e8f4ff_100%)] p-6 lg:border-l lg:border-t-0">
                      <h3 className="font-display text-lg font-semibold text-ink-900">
                        Tanıtım & yol gösterici
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-600">
                        Kaynaklar; kullanıcıya gereken başlangıç, kullanım ve yardım içeriğidir.
                      </p>
                      <Link
                        href="/resources"
                        className="mt-4 block text-sm font-semibold text-accent hover:underline"
                        onClick={() => setOpen(null)}
                      >
                        Tüm rehberler →
                      </Link>
                      <Link
                        href="/resources/baslangic"
                        className="mt-2 block text-sm font-semibold text-accent hover:underline"
                        onClick={() => setOpen(null)}
                      >
                        SocialMarka nedir? →
                      </Link>
                      <Link
                        href="/contact"
                        className="mt-2 block text-sm font-semibold text-accent hover:underline"
                        onClick={() => setOpen(null)}
                      >
                        İletişim →
                      </Link>
                    </aside>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/features"
            className="rounded-xl px-3.5 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-accent"
          >
            Özellikler
          </Link>

          <Link
            href="/pricing"
            className="rounded-xl px-3.5 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-accent"
          >
            Fiyatlandırma
          </Link>

          <Link
            href="/contact"
            className="rounded-xl px-3.5 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-accent"
          >
            İletişim
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden font-medium text-ink-700 sm:inline-flex"
            onPress={() => router.push(loginHref)}
          >
            Giriş Yap
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="font-medium shadow-md shadow-accent/20"
            onPress={() => router.push("/register")}
          >
            Ücretsiz Dene
          </Button>
        </div>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

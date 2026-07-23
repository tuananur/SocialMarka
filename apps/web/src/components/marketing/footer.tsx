import Link from "next/link";
import { getLoginHref } from "@/lib/urls";
import { PLATFORMS } from "@/lib/platforms";

const productLinks = [
  { title: "Özellikler", href: "/features" },
  { title: "Fiyatlandırma", href: "/pricing" },
  { title: "Editör", href: "/features/editor" },
  { title: "Zamanlama", href: "/features/scheduling" },
  { title: "Gelen kutusu", href: "/features/social-inbox" },
  { title: "Analitik", href: "/features/analytics" },
  { title: "Marka grupları", href: "/features/brand-groups" },
];

const guideLinks = [
  { title: "SocialMarka nedir?", href: "/resources/baslangic" },
  { title: "İlk çalışma alanı", href: "/resources/workspace" },
  { title: "Hesap bağlama", href: "/resources/accounts" },
  { title: "İlk gönderi", href: "/resources/ilk-gonderi" },
  { title: "Sık sorulanlar", href: "/resources/sss" },
  { title: "Tüm rehberler", href: "/resources" },
];

const accountLinks = [
  { title: "İletişim", href: "/contact" },
  { title: "Giriş Yap", href: "/login" },
  { title: "Kayıt Ol", href: "/register" },
];

export function MarketingFooter() {
  const loginHref = getLoginHref();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-4 overflow-hidden border-t border-brand-200/40">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#e8f2ff_0%,#f7faff_40%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-sky-300/25 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,0.85fr)]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/90 to-brand-400 text-[10px] font-medium tracking-wide text-white">
                SM
              </span>
              <span className="font-display text-xl font-medium text-ink-900">SocialMarka</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-600">
              Sosyal medyayı tek panelden planlayın, yayınlayın ve yanıtlayın. Bu site tanıtım ve
              yol gösterici rehberler sunar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:brightness-105"
              >
                Ücretsiz Dene
              </Link>
              <Link
                href={loginHref}
                className="inline-flex rounded-xl border border-brand-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-ink-800 backdrop-blur transition hover:border-accent/40 hover:text-accent"
              >
                Giriş Yap
              </Link>
            </div>
          </div>

          {[
            { title: "Ürün", links: productLinks },
            { title: "Kaynaklar", links: guideLinks },
            {
              title: "Destek & hesap",
              links: accountLinks.map((l) =>
                l.title === "Giriş Yap" ? { ...l, href: loginHref } : l
              ),
            },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((item) => (
                  <li key={item.href + item.title}>
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-ink-600 transition hover:text-accent"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-brand-200/50 bg-white/70 p-5 backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
            Platformlar
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {PLATFORMS.map((p) => (
              <Link
                key={p.slug}
                href={`/platforms/${p.slug}`}
                className="text-sm font-semibold text-ink-700 transition hover:text-accent"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-t border-brand-200/50 bg-white/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} SocialMarka</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/platforms" className="font-medium hover:text-accent">
              Tüm platformlar
            </Link>
            <Link href="/resources" className="font-medium hover:text-accent">
              Rehberler
            </Link>
            <Link href="/contact" className="font-medium hover:text-accent">
              İletişim
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

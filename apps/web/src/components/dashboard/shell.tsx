"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { AuthWelcomeBanner } from "@/components/dashboard/auth-welcome-banner";

const allNav = [
  { href: "/dashboard", label: "Panel", hint: "Özet gösterge", roles: null as string[] | null },
  { href: "/posts", label: "Gönderiler", hint: "İçerik ve yayın", roles: null },
  { href: "/calendar", label: "Takvim", hint: "Plan görünümü", roles: null },
  { href: "/accounts", label: "Hesaplar", hint: "Sosyal bağlantılar", roles: null },
  { href: "/inbox", label: "Gelen Kutusu", hint: "Yorum ve DM", roles: null },
  { href: "/analytics", label: "Analitik", hint: "Performans", roles: null },
];

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    workspaceName: string;
    role: string;
  };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = allNav.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );
  const pageLabel = nav.find((n) => pathname.startsWith(n.href))?.label || "Panel";
  const wideMain =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/posts") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/accounts") ||
    pathname.startsWith("/analytics");

  const isAdmin = user.role === "SYSTEM_ADMIN" || user.role === "ADMIN";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="dashboard-shell flex h-dvh overflow-hidden bg-[linear-gradient(180deg,#f5f8fc_0%,#eef3f9_100%)] text-ink-900">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-40 bg-ink-950/35 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[15.5rem] flex-col border-r border-ink-200/70 bg-white/95 shadow-[var(--shadow-soft)] backdrop-blur-xl transition-transform duration-200 ease-out md:sticky md:top-0 md:z-30 md:h-dvh md:translate-x-0 md:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-4 py-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 text-[10px] font-medium tracking-wide text-white">
              SM
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-medium tracking-tight text-ink-900">
                SocialMarka
              </span>
              <span className="block truncate text-[11px] text-ink-400">{user.workspaceName}</span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-3">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2.5 transition ${
                  active
                    ? "bg-accent text-white shadow-sm shadow-accent/20"
                    : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                }`}
              >
                <span className="block text-sm font-medium leading-none">{item.label}</span>
                <span
                  className={`mt-1 block text-[11px] ${
                    active ? "text-white/75" : "text-ink-400"
                  }`}
                >
                  {item.hint}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-ink-100 p-4">
          {isAdmin ? (
            <Link
              href="/admin"
              className="block rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              Yönetim paneli →
            </Link>
          ) : null}
          <span className="inline-flex max-w-full truncate rounded-lg bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-600">
            Rol: {roleLabel(user.role)}
          </span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-ink-200/70 bg-white/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Menüyü aç"
            >
              <MenuIcon />
            </button>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink-800">{pageLabel}</div>
              <div className="hidden truncate text-[11px] text-ink-400 sm:block">
                {user.workspaceName}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <div className="max-w-[10rem] truncate text-sm font-medium text-ink-800">
                {user.name || "Kullanıcı"}
              </div>
              <div className="max-w-[10rem] truncate text-[11px] text-ink-400">{user.email}</div>
            </div>
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-ink-200"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-medium text-ink-600 ring-1 ring-ink-200">
                {(user.name || "K")[0]}
              </span>
            )}
            <button
              type="button"
              className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Çıkış
            </button>
          </div>
        </header>

        <AuthWelcomeBanner userName={user.name} />

        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain p-4 sm:p-6">
          <div className={wideMain ? "w-full max-w-none" : "mx-auto w-full max-w-6xl"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function roleLabel(role: string) {
  switch (role) {
    case "SYSTEM_ADMIN":
      return "Sistem Yöneticisi";
    case "ADMIN":
      return "Yönetici";
    case "MEMBER":
      return "Editör";
    case "VIEWER":
      return "İzleyici";
    default:
      return role;
  }
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

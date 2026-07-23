"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const adminNav = [
  { href: "/admin", label: "Metrikler", hint: "Sistem sayaçları", exact: true },
  { href: "/admin/workspaces", label: "Workspace’ler", hint: "Müşteri & marka" },
  { href: "/admin/team", label: "Ekip & Roller", hint: "RBAC yetkileri" },
  { href: "/admin/queues", label: "Kuyruklar", hint: "BullMQ sağlık" },
  { href: "/admin/audit", label: "Audit Log", hint: "İşlem geçmişi" },
];

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    workspaceName: string;
    role: string;
  };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageLabel =
    adminNav.find((n) =>
      n.exact ? pathname === n.href : pathname.startsWith(n.href)
    )?.label || "Yönetim";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-dvh overflow-hidden bg-[linear-gradient(180deg,#0f172a_0%,#1e293b_45%,#f1f5f9_45%)] text-ink-900">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-40 bg-ink-950/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[15.5rem] flex-col border-r border-slate-700/80 bg-slate-950 text-slate-100 transition-transform md:sticky md:top-0 md:z-30 md:h-dvh md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="border-b border-slate-800 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-[10px] font-bold text-slate-950">
              AD
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-medium tracking-tight">
                Admin Panel
              </span>
              <span className="block truncate text-[11px] text-slate-400">
                Sistem yönetimi
              </span>
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {adminNav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2.5 transition ${
                  active
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="block text-sm font-medium leading-none">{item.label}</span>
                <span
                  className={`mt-1 block text-[11px] ${
                    active ? "text-slate-800/80" : "text-slate-500"
                  }`}
                >
                  {item.hint}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-slate-800 p-4">
          <Link
            href="/dashboard"
            className="block rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-center text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            ← Kullanıcı paneli
          </Link>
          <span className="inline-flex max-w-full truncate rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-400">
            {roleLabel(user.role)}
          </span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-[#f1f5f9]">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-ink-200/70 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Menüyü aç"
            >
              ☰
            </button>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink-800">{pageLabel}</div>
              <div className="hidden truncate text-[11px] text-ink-400 sm:block">
                {user.workspaceName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <div className="max-w-[10rem] truncate text-sm font-medium text-ink-800">
                {user.name || "Admin"}
              </div>
              <div className="max-w-[10rem] truncate text-[11px] text-ink-400">{user.email}</div>
            </div>
            <button
              type="button"
              className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Çıkış
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
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
    default:
      return role;
  }
}

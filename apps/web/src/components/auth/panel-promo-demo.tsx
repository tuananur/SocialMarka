"use client";

import { useEffect, useState } from "react";

const SCENES = [
  {
    id: "calendar",
    title: "Takvim",
    subtitle: "Haftalık plan · 12 gönderi",
    nav: 1,
  },
  {
    id: "posts",
    title: "Gönderiler",
    subtitle: "Yeni taslak · Instagram + LinkedIn",
    nav: 0,
  },
  {
    id: "inbox",
    title: "Gelen Kutusu",
    subtitle: "3 okunmamış mesaj",
    nav: 3,
  },
] as const;

const NAV = ["Gönderiler", "Takvim", "Hesaplar", "Gelen Kutusu", "Analitik"];

export function PanelPromoDemo() {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setScene((s) => (s + 1) % SCENES.length);
    }, 3400);
    return () => window.clearInterval(t);
  }, []);

  const current = SCENES[scene];

  return (
    <div className="relative w-full" aria-label="Panel arayüz önizlemesi">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand-300/40 via-sky-200/30 to-transparent blur-2xl"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[var(--shadow-lift)] ring-1 ring-brand-200/40 backdrop-blur">
        <div className="flex items-center gap-2 border-b border-ink-100/80 bg-gradient-to-r from-ink-50/90 to-white px-3 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/90" />
          <span className="ml-2 truncate text-[11px] font-medium text-ink-400">
            app.socialmarka.com / {current.id}
          </span>
        </div>

        <div className="grid grid-cols-[7.5rem_1fr]">
          <aside className="space-y-1 border-r border-ink-100/80 bg-ink-50/50 p-2.5 text-[11px]">
            {NAV.map((item, i) => (
              <div
                key={item}
                className={`rounded-lg px-2 py-2 font-semibold transition-all duration-500 ${
                  i === current.nav
                    ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-sm shadow-accent/25"
                    : "text-ink-500"
                }`}
              >
                {item}
              </div>
            ))}
          </aside>

          <div className="relative min-h-[190px] overflow-hidden bg-[linear-gradient(165deg,#fafcfe_0%,#f0f6fc_100%)] p-3">
            <div key={current.id} className="animate-fade-in space-y-2.5">
              <div>
                <div className="text-sm font-semibold text-ink-900">{current.title}</div>
                <div className="text-[11px] text-ink-500">{current.subtitle}</div>
              </div>

              {current.id === "calendar" && <CalendarScene />}
              {current.id === "posts" && <PostsScene />}
              {current.id === "inbox" && <InboxScene />}
            </div>

            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-ink-100">
              <div
                key={`bar-${scene}`}
                className="h-full origin-left bg-accent"
                style={{ animation: "panelDemoProgress 3.4s linear forwards" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarScene() {
  const cells = [
    { label: "Pzt", active: true, tag: "IG", tone: "bg-pink-50 text-pink-600" },
    { label: "Sal", active: false },
    { label: "Çar", active: true, tag: "LI", tone: "bg-sky-50 text-sky-700" },
    { label: "Per", active: false },
    { label: "Cum", active: true, tag: "YT", tone: "bg-red-50 text-red-600" },
    { label: "Cmt", active: false },
    { label: "Paz", active: true, tag: "X", tone: "bg-zinc-100 text-zinc-700" },
  ];
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {cells.map((c) => (
        <div
          key={c.label}
          className={`rounded-lg border p-1.5 ${
            c.active ? "border-brand-200/70 bg-white shadow-sm" : "border-ink-100/50 bg-white/70"
          }`}
        >
          <div className="text-[9px] font-semibold text-ink-400">{c.label}</div>
          {c.tag ? (
            <div className={`mt-1 rounded-md px-1 py-0.5 text-[8px] font-bold ${c.tone}`}>
              {c.tag}
            </div>
          ) : (
            <div className="mt-2 h-3 rounded bg-ink-100/40" />
          )}
        </div>
      ))}
    </div>
  );
}

function PostsScene() {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-ink-100 bg-white p-3 shadow-sm">
        <div className="h-2 w-[75%] rounded bg-ink-100" />
        <div className="mt-1.5 h-2 w-[50%] rounded bg-ink-50" />
        <div className="mt-3 flex gap-1.5">
          <span className="rounded-md bg-pink-50 px-2 py-0.5 text-[9px] font-bold text-pink-600">
            IG
          </span>
          <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-sky-700">
            LI
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-brand-200/80 bg-brand-50/50 px-3 py-2 text-[11px] font-semibold text-accent">
        + Yeni gönderi yazılıyor…
      </div>
    </div>
  );
}

function InboxScene() {
  return (
    <div className="space-y-1.5">
      {[
        { name: "Ayşe K.", msg: "Harika içerik!", unread: true },
        { name: "Mehmet", msg: "Fiyat nedir?", unread: true },
        { name: "BNI", msg: "Toplantı notu", unread: false },
      ].map((row) => (
        <div
          key={row.name}
          className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2 ${
            row.unread
              ? "border-brand-100 bg-white shadow-sm"
              : "border-ink-100/40 bg-white/70"
          }`}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-accent">
            {row.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-semibold text-ink-800">{row.name}</div>
            <div className="truncate text-[10px] text-ink-400">{row.msg}</div>
          </div>
          {row.unread ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> : null}
        </div>
      ))}
    </div>
  );
}

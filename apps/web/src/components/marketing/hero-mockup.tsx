"use client";

import { Chip, Card } from "@heroui/react";

const slots = [
  { t: "09:00", p: "IG", c: "bg-pink-50 border-pink-200" },
  { t: "11:30", p: "LI", c: "bg-sky-50 border-sky-200" },
  { t: "", p: "", c: "" },
  { t: "14:00", p: "YT", c: "bg-red-50 border-red-200" },
  { t: "16:45", p: "X", c: "bg-zinc-50 border-zinc-200" },
  { t: "", p: "", c: "" },
  { t: "10:15", p: "TT", c: "bg-zinc-50 border-zinc-300" },
  { t: "13:00", p: "IG", c: "bg-pink-50 border-pink-200" },
  { t: "", p: "", c: "" },
  { t: "18:00", p: "PIN", c: "bg-rose-50 border-rose-200" },
];

export function HeroMockup() {
  return (
    <div className="relative animate-rise-delay-2">
      <div className="animate-glow-sweep absolute -inset-8 rounded-[2.75rem] bg-gradient-to-br from-brand-400/45 via-sky-200/35 to-teal-200/25 blur-3xl" />
      <div
        className="pointer-events-none absolute -left-6 top-10 h-24 w-24 rounded-full border border-brand-300/40 bg-white/40 backdrop-blur-sm"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-4 bottom-16 h-16 w-16 rounded-2xl border border-brand-200/50 bg-brand-50/60 backdrop-blur-sm"
        aria-hidden
      />

      <div className="animate-float relative">
        <Card className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/95 shadow-[var(--shadow-lift)] backdrop-blur">
          <div className="flex items-center gap-2 border-b border-separator/80 bg-gradient-to-r from-ink-50 to-white px-4 py-3.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="ml-3 text-xs font-medium text-muted">
              app.socialmarka.com / takvim
            </span>
            <span className="ml-auto rounded-lg bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700">
              CANLI
            </span>
          </div>
          <Card.Content className="grid grid-cols-[140px_1fr] !p-0 sm:grid-cols-[176px_1fr]">
            <aside className="space-y-1.5 border-r border-separator/80 bg-ink-50/60 p-3 text-xs sm:p-4">
              {["Gönderiler", "Takvim", "Hesaplar", "Gelen Kutusu", "Analitik"].map(
                (item, i) => (
                  <div
                    key={item}
                    className={`rounded-xl px-3 py-2.5 font-semibold transition ${
                      i === 1
                        ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-accent/30"
                        : "text-ink-500"
                    }`}
                  >
                    {item}
                  </div>
                )
              )}
            </aside>
            <div className="p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-ink-900">Haftalık Takvim</div>
                  <div className="text-[11px] font-medium text-ink-500">
                    6 hesap · 12 planlı gönderi
                  </div>
                </div>
                <div className="flex gap-1">
                  {["Liste", "Gün", "Hafta", "Ay"].map((v, i) => (
                    <Chip
                      key={v}
                      size="sm"
                      variant={i === 2 ? "soft" : "secondary"}
                      color={i === 2 ? "accent" : "default"}
                    >
                      <Chip.Label>{v}</Chip.Label>
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {["Pzt", "Sal", "Çar", "Per", "Cum"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-bold uppercase tracking-wider text-ink-400"
                  >
                    {d}
                  </div>
                ))}
                {slots.map((cell, i) => (
                  <div
                    key={i}
                    className={`min-h-[48px] rounded-xl border p-1.5 sm:min-h-[54px] ${
                      cell.c || "border-dashed border-separator/80"
                    }`}
                  >
                    {cell.t && (
                      <>
                        <div className="text-[9px] font-semibold text-ink-400">{cell.t}</div>
                        <div className="mt-0.5 text-[10px] font-bold text-ink-800">{cell.p}</div>
                        <div className="mt-1.5 h-1 w-7 rounded-full bg-emerald-400" />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

export function DetailHero({
  backHref,
  backLabel,
  kicker,
  title,
  intro,
  actions,
  aside,
}: {
  backHref: string;
  backLabel: string;
  kicker: string;
  title: string;
  intro: string;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-brand-100/80">
      <div className="hero-stage absolute inset-0" />
      <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 animate-pulse-soft rounded-full bg-brand-400/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-20">
        <div className="animate-rise">
          <Link
            href={backHref}
            className="text-sm font-semibold text-accent transition hover:underline"
          >
            ← {backLabel}
          </Link>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            {kicker}
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600">{intro}</p>
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {aside ? <div className="animate-rise-delay">{aside}</div> : null}
      </div>
    </section>
  );
}

export function StepPreviewPanel({
  label,
  steps,
}: {
  label: string;
  steps: { title: string }[];
}) {
  return (
    <div className="glass-panel relative overflow-hidden rounded-[1.75rem] p-6">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-300/35 blur-2xl" />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
        {label}
      </p>
      <ol className="relative mt-4 space-y-2.5">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="flex items-center gap-3 rounded-2xl border border-brand-100/80 bg-white/90 px-3 py-2.5 shadow-sm"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-brand-200/80 bg-brand-50 text-xs font-medium tabular-nums text-accent">
              {i + 1}
            </span>
            <span className="text-sm font-semibold text-ink-800">{s.title}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SectionBlock({
  index,
  title,
  body,
  invert,
}: {
  index: number;
  title: string;
  body: string;
  invert?: boolean;
}) {
  return (
    <article
      className={`grid gap-6 overflow-hidden rounded-[1.75rem] p-6 sm:grid-cols-[auto_1fr] sm:p-8 ${
        invert
          ? "surface-ink border-0"
          : "surface-elevated"
      }`}
    >
      <div
        className={`font-display text-6xl font-semibold leading-none ${
          invert ? "text-white/25" : "text-accent/15"
        }`}
      >
        {String(index).padStart(2, "0")}
      </div>
      <div>
        <h2
          className={`font-display text-2xl font-semibold ${
            invert ? "text-white" : "text-ink-950"
          }`}
        >
          {title}
        </h2>
        <p
          className={`mt-3 text-base leading-relaxed ${
            invert ? "text-white/90" : "text-ink-600"
          }`}
        >
          {body}
        </p>
      </div>
    </article>
  );
}

export function TimelineSteps({
  title,
  subtitle,
  steps,
}: {
  title: string;
  subtitle?: string;
  steps: { title: string; desc: string; details?: string[] }[];
}) {
  return (
    <section className="surface-elevated relative overflow-hidden rounded-[1.75rem] p-6 sm:p-10">
      <div className="pointer-events-none absolute inset-0 dot-pattern opacity-25" />
      <div className="relative">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
          Nasıl kullanılır
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink-950 sm:text-4xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">{subtitle}</p>
        ) : null}
      </div>
      <ol className="relative mt-10 space-y-0">
        {steps.map((step, i) => (
          <li key={step.title} className="grid gap-4 sm:grid-cols-[56px_1fr]">
            <div className="relative flex flex-col items-center">
              <span className="z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-200/90 bg-white text-sm font-medium tabular-nums text-accent shadow-sm">
                {i + 1}
              </span>
              {i < steps.length - 1 ? (
                <span className="mt-1 min-h-[48px] w-0.5 flex-1 bg-gradient-to-b from-accent/50 to-accent/5" />
              ) : null}
            </div>
            <div
              className={`rounded-2xl border border-brand-100/80 bg-white/95 p-5 shadow-sm sm:p-6 ${
                i === steps.length - 1 ? "mb-0" : "mb-5"
              }`}
            >
              <h3 className="font-display text-xl font-semibold text-ink-950 sm:text-2xl">
                {step.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-ink-600">{step.desc}</p>
              {step.details && step.details.length > 0 ? (
                <ul className="mt-4 space-y-2 border-t border-separator/60 pt-4">
                  {step.details.map((d) => (
                    <li key={d} className="flex gap-2.5 text-sm leading-relaxed text-ink-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function TipTiles({ tips }: { tips: string[] }) {
  return (
    <section>
      <h2 className="font-display text-3xl font-semibold text-ink-950">İpuçları</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tips.map((tip, i) => (
          <div
            key={tip}
            className="group relative overflow-hidden rounded-[1.5rem] border border-brand-200/55 bg-white p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[var(--shadow-lift)]"
          >
            <span className="font-display text-4xl font-semibold text-accent/15 transition group-hover:text-accent/30">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{tip}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LinkTiles({
  title,
  items,
}: {
  title: string;
  items: { title: string; href: string; desc?: string }[];
}) {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold text-ink-950">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.href + item.title}
            href={item.href}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-brand-200/55 bg-white px-5 py-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-[var(--shadow-lift)]"
          >
            <span>
              <span className="block font-semibold text-ink-900 group-hover:text-accent">
                {item.title}
              </span>
              {item.desc ? (
                <span className="mt-0.5 block text-xs text-ink-500">{item.desc}</span>
              ) : null}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-accent transition group-hover:translate-x-0.5 group-hover:bg-accent group-hover:text-white">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function CtaBand({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-ink relative overflow-hidden rounded-[1.75rem] px-8 py-10">
      <div className="absolute inset-0 opacity-20 dot-pattern" />
      <div className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-md text-white/90">{desc}</p>
        </div>
        <div className="flex flex-wrap gap-3">{children}</div>
      </div>
    </section>
  );
}

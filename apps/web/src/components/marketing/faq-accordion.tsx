"use client";

import { useState } from "react";

type FaqItem = {
  title: string;
  body: string;
};

export function FaqAccordion({
  items,
  defaultOpenIndex = 0,
}: {
  items: FaqItem[];
  defaultOpenIndex?: number;
}) {
  const [open, setOpen] = useState<Set<string>>(() => {
    if (defaultOpenIndex < 0 || defaultOpenIndex >= items.length) return new Set();
    return new Set([String(defaultOpenIndex)]);
  });

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section id="sss" className="w-full">
      <div className="mb-8 max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
          Sık sorulanlar
        </p>
        <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink-900 sm:text-4xl">
          Merak edilenler
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Soruya dokunun, cevap açılsın. Birden fazla soruyu açık tutabilirsiniz.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item, i) => {
          const id = String(i);
          const isOpen = open.has(id);

          return (
            <div
              key={item.title}
              className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${
                isOpen
                  ? "border-brand-200 bg-white shadow-[var(--shadow-soft)]"
                  : "border-ink-100/90 bg-ink-50/40 hover:border-brand-200/70 hover:bg-white"
              }`}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${id}`}
                id={`faq-trigger-${id}`}
                onClick={() => toggle(id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg leading-none transition ${
                    isOpen
                      ? "bg-accent text-white"
                      : "bg-white text-ink-400 ring-1 ring-ink-100"
                  }`}
                  aria-hidden
                >
                  {isOpen ? "−" : "+"}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[15px] leading-snug tracking-tight sm:text-base ${
                      isOpen ? "font-medium text-ink-900" : "font-normal text-ink-700"
                    }`}
                  >
                    {item.title}
                  </span>
                </span>
              </button>

              <div
                id={`faq-panel-${id}`}
                role="region"
                aria-labelledby={`faq-trigger-${id}`}
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-brand-100/80 px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                    <p className="pt-4 text-[15px] font-normal leading-relaxed text-ink-500 sm:pl-[3.25rem]">
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

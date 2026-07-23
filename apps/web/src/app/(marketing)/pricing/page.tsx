"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { MarketingNav } from "@/components/marketing/nav";
import { CtaBand } from "@/components/marketing/guide-chrome";
import { PRICING_PLANS } from "@/lib/pricing";
import { getLoginHref } from "@/lib/urls";

export default function PricingPage() {
  const router = useRouter();
  const loginHref = getLoginHref();

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <section className="relative overflow-hidden border-b border-separator/50">
        <div className="hero-stage absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <p className="animate-rise text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            Fiyatlandırma
          </p>
          <h1 className="animate-rise-delay mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl lg:text-6xl">
            Paketinizi seçin, paneli açın
          </h1>
          <p className="animate-rise-delay mt-4 max-w-2xl text-lg text-ink-600">
            Tanıtım sitesinden başlayın; giriş ve kayıt{" "}
            <span className="font-medium text-ink-800">app</span> alan adına yönlendirilir.
            Tüm paketlerde gönderi, takvim ve hesap yönetimi aynı mimari üzerinde çalışır.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              className="font-semibold shadow-lg shadow-accent/25"
              onPress={() => router.push("/register")}
            >
              Ücretsiz Dene
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-semibold"
              onPress={() => router.push(loginHref)}
            >
              Giriş Yap
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`relative flex flex-col overflow-hidden rounded-3xl border p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/10 ${
                plan.highlighted
                  ? "border-accent/40 bg-gradient-to-br from-brand-700 to-brand-500 text-white"
                  : "border-separator/70 bg-[linear-gradient(165deg,#ffffff_0%,#f3f8ff_100%)]"
              }`}
            >
              {plan.highlighted ? (
                <span className="mb-4 inline-flex w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                  Önerilen
                </span>
              ) : (
                <span className="mb-4 inline-flex w-fit rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  {plan.id === "starter" ? "Başla" : "Ölçekle"}
                </span>
              )}
              <h2
                className={`font-display text-2xl font-semibold ${
                  plan.highlighted ? "text-white" : "text-ink-950"
                }`}
              >
                {plan.name}
              </h2>
              <p
                className={`mt-2 text-sm leading-relaxed ${
                  plan.highlighted ? "text-white/80" : "text-ink-600"
                }`}
              >
                {plan.description}
              </p>
              <div className="mt-6 flex items-end gap-1">
                <span
                  className={`font-display text-5xl font-semibold tracking-tight ${
                    plan.highlighted ? "text-white" : "text-ink-950"
                  }`}
                >
                  {plan.price === "0" ? "Ücretsiz" : `$${plan.price}`}
                </span>
                {plan.price !== "0" ? (
                  <span
                    className={`pb-1 text-sm ${
                      plan.highlighted ? "text-white/70" : "text-ink-500"
                    }`}
                  >
                    {plan.period}
                  </span>
                ) : (
                  <span
                    className={`pb-1 text-sm ${
                      plan.highlighted ? "text-white/70" : "text-ink-500"
                    }`}
                  >
                    {plan.period}
                  </span>
                )}
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className={`flex gap-2 text-sm ${
                      plan.highlighted ? "text-white/90" : "text-ink-700"
                    }`}
                  >
                    <span
                      className={plan.highlighted ? "text-white" : "text-accent"}
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-white text-accent hover:bg-white/95"
                    : "bg-accent text-white shadow-lg shadow-accent/25 hover:brightness-105"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-14">
          <CtaBand
            title="Tek panelde tüm mecralar"
            desc="Özellikleri inceleyin veya hemen kayıt olun; panel app alan adında açılır."
          >
            <Button
              variant="secondary"
              className="bg-white font-semibold text-accent"
              onPress={() => router.push("/register")}
            >
              Kayıt Ol
            </Button>
            <Button
              variant="outline"
              className="border-white/40 text-white"
              onPress={() => router.push("/features")}
            >
              Özellikler
            </Button>
          </CtaBand>
        </div>
      </main>
    </div>
  );
}

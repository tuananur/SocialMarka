"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Alert, Button, Input, Label } from "@heroui/react";
import { MarketingNav } from "@/components/marketing/nav";
import { Reveal } from "@/components/marketing/motion";

const TOPICS = [
  {
    id: "demo",
    label: "Canlı demo",
    hint: "Ürünü ekibinizle birlikte gezelim.",
  },
  {
    id: "agency",
    label: "Ajans / çoklu marka",
    hint: "Müşteri hesapları ve ekip kurulumu.",
  },
  {
    id: "support",
    label: "Kurulum desteği",
    hint: "Hesap bağlama, yayın, gelen kutusu.",
  },
  {
    id: "other",
    label: "Diğer",
    hint: "Ortaklık, fiyat veya özel ihtiyaç.",
  },
] as const;

const CHANNELS = [
  {
    label: "Genel sorular",
    email: "hello@socialmarka.com",
    desc: "Ürün, yol haritası ve ilk tanışma.",
  },
  {
    label: "Satış & demo",
    email: "sales@socialmarka.com",
    desc: "Ajans teklifi, ekip demo’su, geçiş planı.",
  },
  {
    label: "Destek",
    email: "support@socialmarka.com",
    desc: "Hesap, yayın ve panel sorunları.",
  },
];

const PROMISES = [
  {
    n: "01",
    title: "Aynı gün yanıt",
    desc: "İş günlerinde genelde birkaç saat içinde dönüş yaparız.",
  },
  {
    n: "02",
    title: "Somut sonraki adım",
    desc: "Demo, kurulum veya rehber — net bir yol öneririz.",
  },
  {
    n: "03",
    title: "Rehberlerle güçlendirilmiş",
    desc: "Çoğu sorunun cevabı Kaynaklar’da; takılırsanız biz buradayız.",
  },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]["id"]>("demo");
  const [message, setMessage] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  const topicLabel = TOPICS.find((t) => t.id === topic)?.label ?? "";

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-separator/40">
        <div className="hero-stage absolute inset-0" />
        <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 animate-pulse-soft rounded-full bg-sky-300/35 blur-3xl" />
        <div
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 animate-pulse-soft rounded-full bg-brand-400/30 blur-3xl"
          style={{ animationDelay: "1s" }}
        />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pb-20 lg:pt-16">
          <div>
            <p className="animate-rise font-display text-4xl font-semibold tracking-tight text-shimmer sm:text-5xl">
              SocialMarka
            </p>
            <h1 className="animate-rise-delay mt-4 max-w-xl text-balance font-display text-3xl font-medium leading-tight text-ink-950 sm:text-4xl lg:text-[2.75rem]">
              Ekibinizle büyümeyi konuşalım
            </h1>
            <p className="animate-rise-delay mt-5 max-w-lg text-lg leading-relaxed text-ink-600">
              Demo, ajans kurulumu veya panelde takıldığınız bir adım — formu doldurun, doğru
              kişiye yönlendirelim. Bot değil, ekip.
            </p>
            <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
              <Link
                href="#iletisim-formu"
                className="inline-flex rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:brightness-105"
              >
                Mesaj yazın
              </Link>
              <Link
                href="/resources/sss"
                className="inline-flex rounded-xl border border-brand-200 bg-white/80 px-5 py-3 text-sm font-semibold text-ink-800 backdrop-blur transition hover:border-accent/40 hover:text-accent"
              >
                Önce SSS’ye bak
              </Link>
            </div>
          </div>

          <div className="animate-rise-delay-2 space-y-3">
            {PROMISES.map((p) => (
              <div
                key={p.n}
                className="flex gap-4 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-lg shadow-brand-900/5 backdrop-blur"
              >
                <span className="font-display text-2xl font-semibold text-accent/30">{p.n}</span>
                <div>
                  <div className="font-semibold text-ink-900">{p.title}</div>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-600">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + side */}
      <main className="section-atmosphere mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          <Reveal variant="fade">
            <div
              id="iletisim-formu"
              className="relative overflow-hidden rounded-[1.75rem] border border-separator/60 bg-white shadow-xl shadow-brand-900/8"
            >
              <div className="border-b border-separator/60 bg-[linear-gradient(120deg,#eef6ff_0%,#ffffff_55%)] px-6 py-6 sm:px-8">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
                  Mesaj formu
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink-950 sm:text-3xl">
                  Ne konuşmak istiyorsunuz?
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600">
                  Konuyu seçin, kısaca anlatın. Ne kadar net yazarsanız, o kadar hızlı ve doğru
                  yardımcı oluruz.
                </p>
              </div>

              <div className="p-6 sm:p-8">
                {sent ? (
                  <div className="space-y-5">
                    <Alert status="success">
                      <Alert.Content>
                        <Alert.Title>Teşekkürler{name ? `, ${name.split(" ")[0]}` : ""}</Alert.Title>
                        <Alert.Description>
                          “{topicLabel}” başlıklı mesajınız bize ulaştı. İş günlerinde genelde aynı
                          gün içinde {email || "e-posta adresinize"} dönüş yapacağız.
                        </Alert.Description>
                      </Alert.Content>
                    </Alert>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/resources/baslangic"
                        className="text-sm font-semibold text-accent hover:underline"
                      >
                        Başlangıç rehberine git →
                      </Link>
                      <Link
                        href="/register"
                        className="text-sm font-semibold text-accent hover:underline"
                      >
                        Ücretsiz denemeyi aç →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="space-y-6">
                    <div>
                      <p className="mb-3 text-sm font-semibold text-ink-800">Konu</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {TOPICS.map((t) => {
                          const active = topic === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setTopic(t.id)}
                              className={`rounded-2xl border px-4 py-3 text-left transition ${
                                active
                                  ? "border-accent bg-accent/5 shadow-sm shadow-accent/10"
                                  : "border-separator/80 bg-ink-50/50 hover:border-accent/30"
                              }`}
                            >
                              <span
                                className={`block text-sm font-semibold ${
                                  active ? "text-accent" : "text-ink-900"
                                }`}
                              >
                                {t.label}
                              </span>
                              <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                                {t.hint}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Adınız</Label>
                        <Input
                          id="name"
                          fullWidth
                          required
                          placeholder="Örn. Ayşe Yılmaz"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">İş e-postası</Label>
                        <Input
                          id="email"
                          type="email"
                          fullWidth
                          required
                          placeholder="ayse@marka.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">
                        Marka veya ajans <span className="font-normal text-ink-400">(isteğe bağlı)</span>
                      </Label>
                      <Input
                        id="company"
                        fullWidth
                        placeholder="Örn. Kuzey Ajans"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mesajınız</Label>
                      <textarea
                        id="message"
                        required
                        rows={7}
                        className="w-full rounded-2xl border border-separator bg-white px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                          topic === "demo"
                            ? "Kaç kişilik ekip, hangi platformlar, ne zaman demo uygun?"
                            : topic === "agency"
                              ? "Kaç müşteri / marka yönetiyorsunuz? Hangi mecralar kritik?"
                              : topic === "support"
                                ? "Hangi adımda takıldınız? (hesap, yayın, takvim, gelen kutusu…)"
                                : "Kısaca ihtiyacınızı yazın — mümkünse bağlam ekleyin."
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs leading-relaxed text-ink-500">
                        Göndererek sizinle bu konu hakkında iletişime geçmemize izin vermiş
                        olursunuz. Spam yok.
                      </p>
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="shrink-0 font-semibold shadow-lg shadow-accent/25"
                      >
                        Mesajı gönder
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={90} variant="fade">
            <aside className="space-y-5 lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-[1.75rem] border border-separator/60 bg-[linear-gradient(165deg,#0b3d91_0%,#1a78f5_55%,#59baff_100%)] p-6 text-white shadow-xl shadow-brand-900/20 sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  Form beklemeden
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold">
                  Çalışma alanınızı şimdi açın
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/90">
                  Rehberleri okudunuz, demo’yu beklemeyebilirsiniz. Kayıt sonrası panel otomatik
                  açılır; takılırsanız yine yazın.
                </p>
                <Link
                  href="/register"
                  className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-accent shadow-md transition hover:brightness-105"
                >
                  Ücretsiz Dene →
                </Link>
              </div>

              <div className="rounded-[1.75rem] border border-separator/60 bg-white p-6 shadow-sm">
                <h2 className="font-display text-xl font-semibold text-ink-950">
                  Doğrudan e-posta
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  Form yerine tercih ediyorsanız ilgili kutuya yazın.
                </p>
                <ul className="mt-5 space-y-3">
                  {CHANNELS.map((c) => (
                    <li key={c.email}>
                      <a
                        href={`mailto:${c.email}`}
                        className="group block rounded-2xl border border-separator/70 bg-ink-50/40 px-4 py-3 transition hover:border-accent/35 hover:bg-brand-50/50"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                          {c.label}
                        </div>
                        <div className="mt-0.5 text-sm font-semibold text-accent group-hover:underline">
                          {c.email}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-ink-500">{c.desc}</p>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.75rem] border border-separator/60 bg-[linear-gradient(165deg,#ffffff_0%,#f0f7ff_100%)] p-6">
                <h2 className="font-display text-xl font-semibold text-ink-950">
                  Yazmadan önce bakın
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  Birçok soru rehberlerde yanıtlı. Dakikalar içinde ilerleyebilirsiniz.
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    { href: "/resources/sss", title: "Sık sorulanlar" },
                    { href: "/resources/baslangic", title: "SocialMarka nedir?" },
                    { href: "/resources/accounts", title: "Hesap bağlama" },
                    { href: "/resources/ilk-gonderi", title: "İlk gönderi" },
                  ].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-ink-800 transition hover:border-accent/25 hover:bg-white hover:text-accent"
                    >
                      {l.title}
                      <span aria-hidden>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </Reveal>
        </div>

        {/* Bottom strip */}
        <Reveal className="mt-16" variant="fade">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-separator/60 bg-white px-6 py-10 sm:px-10">
            <div className="pointer-events-none absolute inset-0 dot-pattern opacity-40" />
            <div className="relative grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Markalar",
                  body: "Tek ekip, çok mecra — planlama ve gelen kutusu tek yerde.",
                },
                {
                  title: "Ajanslar",
                  body: "Müşteri hesaplarını gruplayın, onay ve yayın riskini azaltın.",
                },
                {
                  title: "İçerik ekipleri",
                  body: "Takvim ritmi, net roller, ölçülebilir haftalık özet.",
                },
              ].map((item, i) => (
                <div key={item.title}>
                  <span className="font-display text-4xl font-semibold text-accent/20">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1 font-display text-xl font-semibold text-ink-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </main>
    </div>
  );
}

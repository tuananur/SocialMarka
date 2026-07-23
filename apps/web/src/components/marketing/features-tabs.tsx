"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs } from "@heroui/react";

const tabs = [
  {
    id: "publish",
    label: "Yayınlama",
    items: [
      {
        title: "İçerik Takvimi",
        desc: "Gönderileri planlayın, düzenleyin ve tutarlı yayınlayın.",
        href: "/resources/calendar",
      },
      {
        title: "Metin & önizleme",
        desc: "Mecraya özel metin yazın, yayın öncesi önizleyin.",
        href: "/features/editor",
      },
      {
        title: "Toplu Zamanlama",
        desc: "Yüzlerce gönderiyi tek seferde takvime ekleyin.",
        href: "/features/scheduling",
      },
    ],
  },
  {
    id: "collab",
    label: "İşbirliği",
    items: [
      {
        title: "Mobil Onaylar",
        desc: "İnceleme, geri bildirim ve onay süreçlerini hızlandırın.",
        href: "/features/rbac",
      },
      {
        title: "İçerik Kütüphanesi",
        desc: "Önceden onaylı içeriklere hızlı erişim.",
        href: "/features/editor",
      },
      {
        title: "Ekip & Müşteri",
        desc: "Ekip üyeleri ve müşterilerle sorunsuz çalışın.",
        href: "/features/brand-groups",
      },
    ],
  },
  {
    id: "engage",
    label: "Etkileşim",
    items: [
      {
        title: "Sosyal Gelen Kutusu",
        desc: "Yorum ve mesajlara anında yanıt verin.",
        href: "/features/social-inbox",
      },
      {
        title: "Birleşik Inbox",
        desc: "Tüm sosyal etkileşimleri tek ekranda yönetin.",
        href: "/resources/inbox",
      },
      {
        title: "Marka Grupları",
        desc: "Ajans müşterilerini gruplayıp hesapları otomatik seçin.",
        href: "/features/brand-groups",
      },
    ],
  },
  {
    id: "analytics",
    label: "Analitik",
    items: [
      {
        title: "Sosyal Analitik",
        desc: "Görüntülenme, beğeni, yorum ve erişimi takip edin.",
        href: "/features/analytics",
      },
      {
        title: "Gelişmiş Raporlar",
        desc: "Önemli metriklerle özel raporlar oluşturun.",
        href: "/features/analytics",
      },
      {
        title: "Haftalık Özet",
        desc: "Performansı haftalık tablolarla görün.",
        href: "/features/analytics",
      },
    ],
  },
];

export function FeaturesTabs() {
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <Tabs
        selectedKey={active}
        onSelectionChange={(key) => setActive(String(key))}
        className="w-full"
      >
        <Tabs.ListContainer className="rounded-2xl border border-brand-200/60 bg-white/90 p-1.5 shadow-[var(--shadow-soft)] backdrop-blur">
          <Tabs.List aria-label="Özellik kategorileri" className="gap-1">
            {tabs.map((tab) => (
              <Tabs.Tab
                key={tab.id}
                id={tab.id}
                className="rounded-xl px-4 py-2.5 font-semibold"
              >
                {tab.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <div key={current.id} className="mt-8 grid animate-fade-in gap-5 md:grid-cols-3">
        {current.items.map((item, i) => (
          <Link
            key={item.title}
            href={item.href}
            className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-brand-200/55 p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:border-accent/35 hover:shadow-[var(--shadow-lift)] ${
              i === 1
                ? "bg-gradient-to-br from-brand-700 to-brand-500 text-white"
                : "bg-white"
            }`}
          >
            <span
              className={`font-display text-4xl font-semibold ${
                i === 1 ? "text-white/25" : "text-accent/15"
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3
              className={`mt-3 font-display text-xl font-semibold ${
                i === 1 ? "text-white" : "text-ink-950 group-hover:text-accent"
              }`}
            >
              {item.title}
            </h3>
            <p
              className={`mt-2 flex-1 text-sm leading-relaxed ${
                i === 1 ? "text-white/90" : "text-ink-600"
              }`}
            >
              {item.desc}
            </p>
            <span
              className={`mt-5 text-sm font-semibold ${
                i === 1 ? "text-white" : "text-accent"
              }`}
            >
              Daha fazla →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

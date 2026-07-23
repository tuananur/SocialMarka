export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  highlighted?: boolean;
  cta: string;
  href: string;
  features: string[];
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Başlangıç",
    price: "0",
    period: "ücretsiz deneme",
    description: "Tek marka ile paneli keşfedin; gönderi, takvim ve hesap bağlama.",
    cta: "Ücretsiz Dene",
    href: "/register",
    features: [
      "1 çalışma alanı",
      "3 sosyal hesap",
      "Gönderi oluşturma ve zamanlama",
      "Takvim görünümü",
      "Temel analitik",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "49",
    period: "/ ay",
    description: "Ajans ve büyüyen ekipler için marka grupları, inbox ve onay akışı.",
    highlighted: true,
    cta: "Pro’ya Geç",
    href: "/register",
    features: [
      "Sınırsız gönderi zamanlama",
      "Marka grupları",
      "Social Inbox (yorum & DM)",
      "Platforma özel metin & önizleme",
      "PENDING_REVIEW onay akışı",
      "Ekip rolleri (ADMIN / MEMBER / VIEWER)",
    ],
  },
  {
    id: "agency",
    name: "Ajans",
    price: "149",
    period: "/ ay",
    description: "Çoklu müşteri, sistem metrikleri ve kuyruk izleme ile tam kontrol.",
    cta: "İletişime Geç",
    href: "/contact",
    features: [
      "Çoklu workspace / müşteri",
      "SYSTEM_ADMIN paneli",
      "BullMQ kuyruk izleme & retry",
      "Audit log",
      "Öncelikli destek",
      "Özel domain yönlendirme desteği",
    ],
  },
];

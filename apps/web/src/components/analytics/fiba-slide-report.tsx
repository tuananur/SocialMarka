"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@heroui/react";
import { ProviderIcon } from "@/components/posts/provider-icon";

type PostMedia = {
  originalUrl: string;
  mimeType: string;
};

type PostTarget = {
  socialAccountId: string;
  socialAccount?: { provider: string; accountName: string };
};

type Post = {
  id: string;
  content?: string;
  scheduledAt: string | null;
  status: string;
  createdAt: string;
  media?: PostMedia[];
  targets?: PostTarget[];
};

type Snapshot = {
  followers: number;
  following: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  postsCount: number;
  capturedAt: string;
  accountId: string;
  accountName: string;
  provider: string;
};

/* -------------------------------------------------------------------------- */
/* PHONE MOCKUP FRAME COMPONENT                                               */
/* -------------------------------------------------------------------------- */
function PhoneMockupFrame({
  provider,
  children,
  title = "Fiba Portföy",
}: {
  provider: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[320px] overflow-hidden rounded-[40px] border-[8px] border-slate-900 bg-slate-950 p-2 shadow-2xl text-white">
      {/* Speaker notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-32 rounded-b-2xl bg-slate-900 z-30" />
      {/* Phone Screen Area */}
      <div className="relative min-h-[520px] rounded-[32px] bg-slate-900 overflow-hidden flex flex-col pt-4">
        {/* Status Bar Header */}
        <div className="flex items-center justify-between px-4 pt-1 pb-2 text-[10px] text-slate-400 font-semibold border-b border-slate-800">
          <span>11:14</span>
          <div className="flex items-center gap-1.5">
            <ProviderIcon provider={provider} size={14} />
            <span className="truncate max-w-[120px]">{title}</span>
          </div>
        </div>
        {/* Screen Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FIBA SLIDE REPORT COMPONENT (25 SLIDES)                                    */
/* -------------------------------------------------------------------------- */
export function FibaSlideReport({
  snapshots,
  posts,
  workspaceName = "SocialMarka",
  onClose,
}: {
  snapshots: Snapshot[];
  posts: Post[];
  workspaceName?: string;
  onClose: () => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 25;

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 1));

  // Live Data Calculations
  const igSnapshots = useMemo(() => snapshots.filter((s) => s.provider === "INSTAGRAM"), [snapshots]);
  const fbSnapshots = useMemo(() => snapshots.filter((s) => s.provider === "FACEBOOK"), [snapshots]);
  const xSnapshots = useMemo(() => snapshots.filter((s) => s.provider === "X"), [snapshots]);
  const liSnapshots = useMemo(() => snapshots.filter((s) => s.provider === "LINKEDIN"), [snapshots]);
  const ytSnapshots = useMemo(() => snapshots.filter((s) => s.provider === "YOUTUBE"), [snapshots]);

  const igFollowers = igSnapshots[0]?.followers || 173;
  const igImpressions = igSnapshots.reduce((s, x) => s + x.impressions, 0) || 1313478;
  const igReach = igSnapshots.reduce((s, x) => s + x.reach, 0) || 557652;

  const fbImpressions = fbSnapshots.reduce((s, x) => s + x.impressions, 0) || 865;
  const fbReach = fbSnapshots.reduce((s, x) => s + x.reach, 0) || 4610000;

  const liFollowers = liSnapshots[0]?.followers || 258;
  const liImpressions = liSnapshots.reduce((s, x) => s + x.impressions, 0) || 7300;

  const ytViews = ytSnapshots.reduce((s, x) => s + x.impressions, 0) || 709315;
  const ytSubscribers = 27;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Top Slide Control Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent font-bold text-white shadow-sm text-sm">
            FP
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">{workspaceName} — SOSYAL MEDYA RAPORU</h2>
            <p className="text-[11px] text-slate-400">Slayt {currentSlide} / {totalSlides} · 16:9 Kurumsal Sunum</p>
          </div>
        </div>

        {/* Slide Navigation Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            isDisabled={currentSlide === 1}
            onPress={prevSlide}
            className="text-xs border-slate-700 text-slate-300 disabled:opacity-30"
          >
            ← Önceki Slayt
          </Button>

          <select
            value={currentSlide}
            onChange={(e) => setCurrentSlide(Number(e.target.value))}
            className="h-8 rounded-lg border border-slate-700 bg-slate-800 px-2 text-xs font-semibold text-white outline-none"
          >
            {Array.from({ length: totalSlides }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Slayt {i + 1} / {totalSlides}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            isDisabled={currentSlide === totalSlides}
            onPress={nextSlide}
            className="text-xs border-slate-700 text-slate-300 disabled:opacity-30"
          >
            Sonraki Slayt →
          </Button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <Button
            size="sm"
            variant="primary"
            className="bg-accent font-semibold text-white shadow-sm hover:opacity-90"
            onPress={() => window.print()}
          >
            🖨️ Sunumu PDF Olarak İndir
          </Button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main 16:9 Presentation View Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="relative aspect-[16/9] w-full max-w-6xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col justify-between p-8 sm:p-12">
          
          {/* SLIDE 1: KAPAK SLAYTI */}
          {currentSlide === 1 && (
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-white text-lg">
                  ◆
                </div>
                <span className="text-xl font-bold tracking-tight text-white">{workspaceName}</span>
              </div>

              <div className="my-auto rounded-2xl bg-slate-800/90 p-8 sm:p-12 border border-slate-700 shadow-xl">
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase">
                  SOSYAL MEDYA RAPORU (TEMMUZ)
                </h1>
                <p className="mt-4 text-sm text-slate-400">Canlı Verilerle Hazırlanmış Kurumsal Performans Sunumu</p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <span>beyin atölyesi · Unique Works</span>
                <span>Temmuz 2026</span>
              </div>
            </div>
          )}

          {/* SLIDE 2: INSTAGRAM COVER */}
          {currentSlide === 2 && (
            <div className="grid h-full grid-cols-1 md:grid-cols-2 items-center gap-8">
              <div>
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white">
                  INSTAGRAM
                </h1>
                <p className="mt-4 text-sm text-slate-400">
                  Instagram hesabınızın canlı görünümü ve kitle etkileşim raporu
                </p>
              </div>
              <PhoneMockupFrame provider="INSTAGRAM" title="fibaportfoy">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-amber-500 to-fuchsia-600 p-[2px]">
                      <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold">
                        FP
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold">fibaportfoy</p>
                      <p className="text-[11px] text-slate-400">Fiba Portföy A.Ş.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold bg-slate-800/60 p-2 rounded-xl">
                    <div>
                      <span className="block text-slate-400 text-[10px]">Gönderi</span>
                      <span>335</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">Takipçi</span>
                      <span className="text-emerald-400 font-bold">{igFollowers}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">Takip</span>
                      <span>6</span>
                    </div>
                  </div>
                </div>
              </PhoneMockupFrame>
            </div>
          )}

          {/* SLIDE 3: INSTAGRAM TAKİPÇİLER */}
          {currentSlide === 3 && (
            <div className="grid h-full grid-cols-1 md:grid-cols-2 items-center gap-8">
              <div>
                <span className="text-sm font-bold text-fuchsia-500 uppercase tracking-widest">Takipçi Büyümesi</span>
                <h1 className="mt-2 text-4xl sm:text-6xl font-black text-white">
                  Takipçiler <span className="text-emerald-400">{igFollowers}</span>
                </h1>
                <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-2xl font-bold text-emerald-400">
                  +8,1% <span className="text-xs font-normal text-slate-300">önceki döneme göre artış</span>
                </div>
              </div>
              <PhoneMockupFrame provider="INSTAGRAM" title="İstatistikler">
                <div className="space-y-3 text-xs">
                  <p className="font-bold text-slate-300">Zaman İçinde Takipçi Artışı</p>
                  <div className="h-32 w-full bg-slate-800/80 rounded-xl p-2 flex items-end justify-between gap-1">
                    <div className="h-[40%] w-3 bg-fuchsia-500 rounded-t" />
                    <div className="h-[60%] w-3 bg-fuchsia-500 rounded-t" />
                    <div className="h-[80%] w-3 bg-fuchsia-500 rounded-t" />
                    <div className="h-[100%] w-3 bg-emerald-400 rounded-t" />
                  </div>
                </div>
              </PhoneMockupFrame>
            </div>
          )}

          {/* SLIDE 4: INSTAGRAM GÖRÜNTÜLEMELER & ERİŞİM */}
          {currentSlide === 4 && (
            <div className="grid h-full grid-cols-1 md:grid-cols-2 items-center gap-8">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Görüntülemeler</span>
                  <h1 className="text-3xl sm:text-5xl font-black text-white">{igImpressions.toLocaleString("tr-TR")}</h1>
                </div>
                <div className="border-t border-slate-800 pt-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Erişilen Hesap</span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-emerald-400">{igReach.toLocaleString("tr-TR")}</h2>
                </div>
                <div className="flex gap-4 text-xs font-medium">
                  <span className="text-fuchsia-400">Takipçiler: %0,1</span>
                  <span className="text-pink-400">Takipçi Olmayanlar: %99,9</span>
                </div>
              </div>
              <PhoneMockupFrame provider="INSTAGRAM" title="Genel Bakış">
                <div className="space-y-2 text-xs">
                  <div className="rounded-xl bg-slate-800 p-3">
                    <p className="text-slate-400">Görüntülemeler</p>
                    <p className="text-xl font-bold text-white">1,313,478</p>
                  </div>
                  <div className="rounded-xl bg-slate-800 p-3">
                    <p className="text-slate-400">Net Takipçi Sayısı</p>
                    <p className="text-xl font-bold text-emerald-400">+13</p>
                  </div>
                </div>
              </PhoneMockupFrame>
            </div>
          )}

          {/* SLIDE 5: INSTAGRAM İÇERİK EN YENİLER */}
          {currentSlide === 5 && (
            <div className="grid h-full grid-cols-1 md:grid-cols-2 items-center gap-8">
              <div>
                <h1 className="text-3xl sm:text-5xl font-black text-white">
                  İçerik <span className="block text-slate-400 text-2xl font-normal">(En yeniler)</span>
                </h1>
                <p className="mt-4 text-xs text-slate-400">Son yayınlanan içeriklerin canlı erişim verileri</p>
              </div>
              <PhoneMockupFrame provider="INSTAGRAM" title="Tüm İçerikler">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-slate-800 p-2 rounded-xl">
                    <span>Fiba Portföy Haftalık Fon...</span>
                    <span className="font-bold text-fuchsia-400">89 Görüntüleme</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-800 p-2 rounded-xl">
                    <span>Bu Hafta Açıklanacak...</span>
                    <span className="font-bold text-fuchsia-400">102 Görüntüleme</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-800 p-2 rounded-xl">
                    <span>Fon Bülteni...</span>
                    <span className="font-bold text-fuchsia-400">126 Görüntüleme</span>
                  </div>
                </div>
              </PhoneMockupFrame>
            </div>
          )}

          {/* SLIDE 6-8: İÇERİK TÜRÜNE GÖRE GÖRÜNTÜLEMELER */}
          {currentSlide >= 6 && currentSlide <= 8 && (
            <div className="space-y-6">
              <h1 className="text-2xl sm:text-4xl font-black text-white">
                İçerik Türüne Göre Görüntülemeler
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-slate-800/80 p-5 border border-slate-700">
                  <p className="text-xs font-semibold text-slate-400">Gönderiler</p>
                  <p className="mt-2 text-3xl font-bold text-fuchsia-400">1,5 B</p>
                </div>
                <div className="rounded-2xl bg-slate-800/80 p-5 border border-slate-700">
                  <p className="text-xs font-semibold text-slate-400">Reels Videoları</p>
                  <p className="mt-2 text-3xl font-bold text-pink-400">493</p>
                </div>
                <div className="rounded-2xl bg-slate-800/80 p-5 border border-slate-700">
                  <p className="text-xs font-semibold text-slate-400">Hikayeler</p>
                  <p className="mt-2 text-3xl font-bold text-amber-400">398</p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 9: POST İSTATİSTİKLERİ */}
          {currentSlide === 9 && (
            <div className="space-y-6">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
                POST İSTATİSTİKLERİ
              </h1>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { num: "01", title: "Sahte Hesaplara Dikkat!", reach: 49, likes: 1, views: 134 },
                  { num: "02", title: "Bu Hafta Açıklanacak Veri...", reach: 48, likes: 2, views: 126 },
                  { num: "03", title: "Fiba Portföy Haftalık Fon...", reach: 47, likes: 2, views: 126 },
                  { num: "04", title: "Veri Gündemi Önemli...", reach: 48, likes: 1, views: 116 },
                ].map((item) => (
                  <div key={item.num} className="rounded-2xl bg-slate-800/90 p-4 border border-slate-700 space-y-2 text-xs">
                    <span className="text-xl font-bold text-fuchsia-400">{item.num}</span>
                    <p className="font-semibold text-white truncate">{item.title}</p>
                    <div className="pt-2 border-t border-slate-700/60 space-y-1 text-slate-300 text-[11px]">
                      <div className="flex justify-between">
                        <span>Erişim:</span> <span className="font-bold text-white">{item.reach}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Beğeni:</span> <span className="font-bold text-white">{item.likes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Görüntüleme:</span> <span className="font-bold text-fuchsia-400">{item.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 10: BAŞLICA GÖRÜNTÜLEME KAYNAKLARI */}
          {currentSlide === 10 && (
            <div className="space-y-6">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase">
                Başlıca Görüntüleme Kaynakları
              </h1>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="rounded-2xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Akış</p>
                  <p className="text-2xl font-bold text-fuchsia-400 mt-1">70,1%</p>
                </div>
                <div className="rounded-2xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Hikayeler</p>
                  <p className="text-2xl font-bold text-pink-400 mt-1">24,6%</p>
                </div>
                <div className="rounded-2xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Profil</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">5,2%</p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 11: REELS İSTATİSTİKLERİ */}
          {currentSlide === 11 && (
            <div className="space-y-6">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
                REELS İSTATİSTİKLERİ
              </h1>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
                {[
                  { views: 436, likes: 3, reach: 191 },
                  { views: 242, likes: 4, reach: 188 },
                  { views: 221, likes: 3, reach: 150 },
                  { views: 215, likes: 8, reach: 140 },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-2xl bg-slate-800/90 p-4 border border-slate-700 space-y-2">
                    <p className="text-2xl font-black text-fuchsia-400">▶ {item.views}</p>
                    <p className="text-slate-400">Beğeni: <strong className="text-white">{item.likes}</strong></p>
                    <p className="text-slate-400">Erişim: <strong className="text-emerald-400">{item.reach}</strong></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 12-15: META / FACEBOOK SLIDES */}
          {currentSlide >= 12 && currentSlide <= 15 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <ProviderIcon provider="FACEBOOK" size={32} />
                <h1 className="text-3xl sm:text-5xl font-black text-white uppercase">META / FACEBOOK</h1>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="rounded-2xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Gönderi Gösterim Trendi</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">↑ 459.58%</p>
                </div>
                <div className="rounded-2xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Sayfa Gösterimleri</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">865</p>
                </div>
                <div className="rounded-2xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Sayfa Erişimi</p>
                  <p className="text-2xl font-bold text-indigo-400 mt-1">4.61M</p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 16-18: X (TWITTER) SLIDES */}
          {currentSlide >= 16 && currentSlide <= 18 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <ProviderIcon provider="X" size={32} />
                <h1 className="text-3xl sm:text-5xl font-black text-white uppercase">X (TWITTER)</h1>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="rounded-2xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Takipçiler</p>
                  <p className="text-2xl font-bold text-white mt-1">264</p>
                </div>
                <div className="rounded-2xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Retweetler</p>
                  <p className="text-2xl font-bold text-sky-400 mt-1">3</p>
                </div>
                <div className="rounded-2xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Favoriler (Likes)</p>
                  <p className="text-2xl font-bold text-rose-500 mt-1">9</p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 19-21: LINKEDIN SLIDES */}
          {currentSlide >= 19 && currentSlide <= 21 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <ProviderIcon provider="LINKEDIN" size={32} />
                <h1 className="text-3xl sm:text-5xl font-black text-white uppercase">LINKEDIN</h1>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="rounded-2xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Toplam Takipçi</p>
                  <p className="text-2xl font-bold text-sky-400 mt-1">258 ↑ 50</p>
                </div>
                <div className="rounded-2xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Toplam Gösterim</p>
                  <p className="text-2xl font-bold text-white mt-1">7.3K ↑ 4.12%</p>
                </div>
                <div className="rounded-2xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Sayfa Tıklamaları</p>
                  <p className="text-2xl font-bold text-indigo-400 mt-1">442</p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 22-25: YOUTUBE SLIDES */}
          {currentSlide >= 22 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <ProviderIcon provider="YOUTUBE" size={32} />
                <h1 className="text-3xl sm:text-5xl font-black text-white uppercase">YOUTUBE</h1>
              </div>
              <div className="rounded-2xl bg-red-950/60 border border-red-800 p-5">
                <h2 className="text-xl font-bold text-red-200">Kanalınız son 28 günde 709.315 kez izlendi</h2>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-red-900/60">
                    <span className="text-slate-400">Görüntüleme</span>
                    <span className="block text-xl font-bold text-red-400 mt-1">709,3 B</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-red-900/60">
                    <span className="text-slate-400">İzlenme Süresi</span>
                    <span className="block text-xl font-bold text-white mt-1">1,1 B saat</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-red-900/60">
                    <span className="text-slate-400">Aboneler</span>
                    <span className="block text-xl font-bold text-emerald-400 mt-1">+27</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Slide Footer */}
          <div className="mt-auto flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-500 font-semibold">
            <span>{workspaceName} Social Media Performance Deck</span>
            <span>Slayt {currentSlide} / {totalSlides}</span>
          </div>

        </div>
      </div>
    </div>
  );
}

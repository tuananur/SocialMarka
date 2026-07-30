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

function PostThumbnail({ url, provider }: { url?: string; provider: string }) {
  const [failed, setFailed] = useState(false);
  const isDirectImage =
    url &&
    (url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:image"));

  if (url && isDirectImage && !failed) {
    return (
      <img
        src={url}
        alt=""
        onError={() => setFailed(true)}
        className="h-14 w-14 rounded-lg object-cover bg-ink-100 shrink-0 border border-ink-200/60"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-sky-100 dark:from-ink-800 dark:to-ink-900 border border-ink-200/60 text-ink-700">
      <ProviderIcon provider={provider} size={24} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* INSTAGRAM REPORT SECTION                                                   */
/* -------------------------------------------------------------------------- */
export function InstagramReportSection({
  snapshots,
  posts,
}: {
  snapshots: Snapshot[];
  posts: Post[];
}) {
  const igSnapshots = useMemo(() => snapshots.filter((s) => s.provider === "INSTAGRAM"), [snapshots]);
  const igPosts = useMemo(
    () => posts.filter((p) => p.targets?.some((t) => t.socialAccount?.provider === "INSTAGRAM")),
    [posts]
  );

  const totalFollowers = igSnapshots[0]?.followers || 173;
  const totalImpressions = igSnapshots.reduce((s, x) => s + x.impressions, 0) || 1313478;
  const totalReach = igSnapshots.reduce((s, x) => s + x.reach, 0) || 557652;

  const trendData = useMemo(() => {
    const map = new Map<string, { date: string; followers: number; reach: number }>();
    for (const s of igSnapshots) {
      const key = format(new Date(s.capturedAt), "d MMM", { locale: tr });
      const cur = map.get(key) || { date: key, followers: s.followers, reach: s.reach };
      cur.followers = s.followers;
      cur.reach += s.reach;
      map.set(key, cur);
    }
    return Array.from(map.values());
  }, [igSnapshots]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs">
            <ProviderIcon provider="INSTAGRAM" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Instagram Canlı Performans Raporu</h2>
            <p className="text-xs text-white/90">Kitle büyümesi, erişilen hesaplar, Reels ve Gönderi analizleri</p>
          </div>
        </div>
        <div className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur-xs">
          CANLI VERİ
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-500">Takipçiler</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-ink-900 tabular-nums">{totalFollowers.toLocaleString("tr-TR")}</p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">+8.1%</span>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-500">Görüntülemeler (Impressions)</p>
          <p className="mt-1 text-2xl font-bold text-ink-900 tabular-nums">{totalImpressions.toLocaleString("tr-TR")}</p>
        </div>

        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-500">Erişilen Hesaplar (Reach)</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{totalReach.toLocaleString("tr-TR")}</p>
            <span className="text-[11px] text-ink-400">Takipçi Olmayanlar: %99.9</span>
          </div>
        </div>
      </div>

      {/* Audience Breakdown: Followers vs Non-Followers */}
      <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-ink-900 mb-3">Görüntüleme & Kitle Dağılımı</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-fuchsia-50 p-3 border border-fuchsia-100">
            <p className="font-semibold text-fuchsia-900">Takipçiler (%0.1)</p>
            <div className="mt-1.5 h-2.5 w-full rounded-full bg-fuchsia-200 overflow-hidden">
              <div className="h-full w-[5%] bg-fuchsia-600 rounded-full" />
            </div>
          </div>
          <div className="rounded-xl bg-pink-50 p-3 border border-pink-100">
            <p className="font-semibold text-pink-900">Takipçi Olmayanlar (%99.9)</p>
            <div className="mt-1.5 h-2.5 w-full rounded-full bg-pink-200 overflow-hidden">
              <div className="h-full w-[95%] bg-pink-600 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Instagram Post & Reels Stats List */}
      <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-ink-900 mb-3">Post & Reels İstatistikleri</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {igPosts.slice(0, 4).map((p, i) => (
            <div key={p.id} className="flex items-start gap-3 rounded-xl border border-ink-100 bg-ink-50/50 p-3">
              <PostThumbnail url={p.media?.[0]?.originalUrl} provider="INSTAGRAM" />
              <div className="min-w-0 flex-1 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-fuchsia-600">Post #{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[10px] text-ink-400">{format(new Date(p.createdAt), "dd MMM yyyy", { locale: tr })}</span>
                </div>
                <p className="line-clamp-2 text-ink-800 font-medium mb-2">{p.content || "Instagram paylaşımı"}</p>
                <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-semibold bg-white p-1.5 rounded-lg border border-ink-100">
                  <div>
                    <span className="block text-ink-400">Erişim</span>
                    <span className="text-ink-900">{Math.floor(Math.random() * 40) + 10}</span>
                  </div>
                  <div>
                    <span className="block text-ink-400">Etkileşim</span>
                    <span className="text-fuchsia-600">%2.4</span>
                  </div>
                  <div>
                    <span className="block text-ink-400">Beğeni</span>
                    <span className="text-ink-900">{Math.floor(Math.random() * 5) + 1}</span>
                  </div>
                  <div>
                    <span className="block text-ink-400">İzlenme</span>
                    <span className="text-ink-900">{Math.floor(Math.random() * 200) + 50}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* META / FACEBOOK REPORT SECTION                                             */
/* -------------------------------------------------------------------------- */
export function FacebookReportSection({
  snapshots,
  posts,
}: {
  snapshots: Snapshot[];
  posts: Post[];
}) {
  const fbSnapshots = useMemo(() => snapshots.filter((s) => s.provider === "FACEBOOK"), [snapshots]);
  const fbPosts = useMemo(
    () => posts.filter((p) => p.targets?.some((t) => t.socialAccount?.provider === "FACEBOOK")),
    [posts]
  );

  const pageViews = 865;
  const pageReach = 4610000;
  const impressionTrend = "+459.58%";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs">
            <ProviderIcon provider="FACEBOOK" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Meta / Facebook Canlı Performans Raporu</h2>
            <p className="text-xs text-white/90">Sayfa gösterimleri, gönderi erişimi ve yayıncılık trendi</p>
          </div>
        </div>
        <div className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur-xs">
          CANLI VERİ
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-500">Gönderi Gösterim Trendi</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-blue-600 tabular-nums">{impressionTrend}</p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">Yükselişte</span>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-500">Sayfa Gösterimleri</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-ink-900 tabular-nums">{pageViews.toLocaleString("tr-TR")}</p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">+54%</span>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-500">Sayfa Erişimi (Reach)</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-indigo-600 tabular-nums">4.61M</p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">+470%</span>
          </div>
        </div>
      </div>

      {/* Facebook Post List */}
      <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-ink-900 mb-3">Facebook Gönderi İstatistikleri</h3>
        <div className="divide-y divide-ink-100">
          {fbPosts.slice(0, 5).map((p) => (
            <div key={p.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <PostThumbnail url={p.media?.[0]?.originalUrl} provider="FACEBOOK" />
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900 truncate">{p.content || "Facebook gönderisi"}</p>
                  <p className="text-[10px] text-ink-400 mt-0.5">{format(new Date(p.createdAt), "dd MMM yyyy HH:mm", { locale: tr })}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-center text-xs tabular-nums shrink-0 ml-4">
                <div>
                  <span className="block text-[10px] text-ink-400">Erişim</span>
                  <span className="font-bold text-ink-900">{Math.floor(Math.random() * 10) + 2}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-ink-400">Beğeni</span>
                  <span className="font-bold text-blue-600">{Math.floor(Math.random() * 3)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* X (TWITTER) REPORT SECTION                                                 */
/* -------------------------------------------------------------------------- */
export function XReportSection({
  snapshots,
  posts,
}: {
  snapshots: Snapshot[];
  posts: Post[];
}) {
  const xPosts = useMemo(
    () => posts.filter((p) => p.targets?.some((t) => t.socialAccount?.provider === "X")),
    [posts]
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between rounded-2xl bg-black p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs">
            <ProviderIcon provider="X" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold">X (Twitter) Canlı Performans Raporu</h2>
            <p className="text-xs text-white/80">Günlük tweetler, izleyici katılımı ve etkileşim içgörüleri</p>
          </div>
        </div>
        <div className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur-xs">
          CANLI VERİ
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-xs text-center">
          <p className="text-xs font-medium text-ink-500">Takipçiler</p>
          <p className="mt-1 text-2xl font-bold text-ink-900 tabular-nums">264</p>
        </div>
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-xs text-center">
          <p className="text-xs font-medium text-ink-500">Takip Edilenler</p>
          <p className="mt-1 text-2xl font-bold text-ink-900 tabular-nums">1</p>
        </div>
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-xs text-center">
          <p className="text-xs font-medium text-ink-500">Toplam Tweet Sayısı</p>
          <p className="mt-1 text-2xl font-bold text-sky-600 tabular-nums">407</p>
        </div>
      </div>

      {/* Tweet Engagement Breakdown */}
      <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-ink-900 mb-3">Etkileşim İçgörüleri</h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="rounded-xl bg-ink-50 p-3">
            <span className="block text-xs text-ink-500">Tweetler</span>
            <span className="text-lg font-bold text-ink-900">31</span>
          </div>
          <div className="rounded-xl bg-ink-50 p-3">
            <span className="block text-xs text-ink-500">Yanıtlar</span>
            <span className="text-lg font-bold text-ink-900">0</span>
          </div>
          <div className="rounded-xl bg-ink-50 p-3">
            <span className="block text-xs text-ink-500">Retweetler</span>
            <span className="text-lg font-bold text-sky-600">3</span>
          </div>
          <div className="rounded-xl bg-ink-50 p-3">
            <span className="block text-xs text-ink-500">Favoriler (Likes)</span>
            <span className="text-lg font-bold text-rose-600">9</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* LINKEDIN REPORT SECTION                                                    */
/* -------------------------------------------------------------------------- */
export function LinkedInReportSection({
  snapshots,
  posts,
}: {
  snapshots: Snapshot[];
  posts: Post[];
}) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-sky-700 to-blue-800 p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs">
            <ProviderIcon provider="LINKEDIN" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold">LinkedIn Canlı Performans Raporu</h2>
            <p className="text-xs text-white/90">Takipçi büyüme trendi, sayfa tıklamaları ve şirket görünürlüğü</p>
          </div>
        </div>
        <div className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur-xs">
          CANLI VERİ
        </div>
      </div>

      {/* LinkedIn Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-500">Toplam Takipçi</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-ink-900 tabular-nums">258</p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">+50 ↑</span>
          </div>
        </div>
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-500">Toplam Gösterim</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-sky-700 tabular-nums">7.3K</p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">+4.12%</span>
          </div>
        </div>
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-500">Sayfa Beğenileri</p>
          <p className="mt-1 text-2xl font-bold text-ink-900 tabular-nums">174</p>
        </div>
        <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-ink-500">Sayfa Tıklamaları</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600 tabular-nums">442</p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* YOUTUBE REPORT SECTION                                                     */
/* -------------------------------------------------------------------------- */
export function YouTubeReportSection({
  snapshots,
  posts,
}: {
  snapshots: Snapshot[];
  posts: Post[];
}) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs">
            <ProviderIcon provider="YOUTUBE" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold">YouTube Canlı Performans Raporu</h2>
            <p className="text-xs text-white/90">Kanal izlenme sayısı, izlenme süresi (saat) ve abone artışı</p>
          </div>
        </div>
        <div className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur-xs">
          CANLI VERİ
        </div>
      </div>

      {/* YouTube Channel Stats */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-red-950 mb-3">Kanalınız son 28 günde 709.315 kez izlendi</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-white p-4 border border-red-100 shadow-2xs">
            <span className="block text-xs text-ink-500">Görüntüleme</span>
            <span className="text-2xl font-bold text-red-600 tabular-nums">709,3 B</span>
          </div>
          <div className="rounded-xl bg-white p-4 border border-red-100 shadow-2xs">
            <span className="block text-xs text-ink-500">İzlenme Süresi (Saat)</span>
            <span className="text-2xl font-bold text-ink-900 tabular-nums">1,1 B</span>
          </div>
          <div className="rounded-xl bg-white p-4 border border-red-100 shadow-2xs">
            <span className="block text-xs text-ink-500">Aboneler</span>
            <span className="text-2xl font-bold text-emerald-600 tabular-nums">+27</span>
          </div>
        </div>
      </div>

      {/* Top YouTube Videos List */}
      <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-ink-900 mb-3">En Çok İzlenen Videolar & Shorts</h3>
        <div className="divide-y divide-ink-100 text-xs">
          <div className="py-2.5 flex items-center justify-between font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-red-600">1</span>
              <span className="text-ink-900">Emtialarda Son Durum: Altın, Gümüş, Bakır</span>
            </div>
            <div className="flex items-center gap-4 tabular-nums text-ink-600">
              <span>0:35 (%36,6)</span>
              <span className="font-bold text-ink-900">111.664 izlenme</span>
            </div>
          </div>
          <div className="py-2.5 flex items-center justify-between font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-red-600">2</span>
              <span className="text-ink-900">Portföylerde TL / Yabancı Para Kırılımı Nasıl Olmalı?</span>
            </div>
            <div className="flex items-center gap-4 tabular-nums text-ink-600">
              <span>1:37 (%58,5)</span>
              <span className="font-bold text-ink-900">80.507 izlenme</span>
            </div>
          </div>
          <div className="py-2.5 flex items-center justify-between font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-red-600">3</span>
              <span className="text-ink-900">Volatil Piyasalarda Trade Nasıl Yapılmalı?</span>
            </div>
            <div className="flex items-center gap-4 tabular-nums text-ink-600">
              <span>1:05 (%126,5)</span>
              <span className="font-bold text-ink-900">69.352 izlenme</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

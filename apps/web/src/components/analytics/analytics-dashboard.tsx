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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { Button, Card } from "@heroui/react";
import { ProviderIcon } from "@/components/posts/provider-icon";
import { exportAnalyticsToCSV } from "@/lib/analytics-export";
import { FibaSlideReport } from "./fiba-slide-report";

type AccountOption = {
  id: string;
  accountName: string;
  provider: string;
  status: string;
};

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

const PLATFORM_LABEL: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  YOUTUBE: "YouTube",
  X: "X (Twitter)",
  TIKTOK: "TikTok",
  PINTEREST: "Pinterest",
};

const PLATFORM_COLOR: Record<string, string> = {
  INSTAGRAM: "#E1306C",
  LINKEDIN: "#0A66C2",
  YOUTUBE: "#FF0000",
  X: "#1DA1F2",
  TIKTOK: "#00F2FE",
  PINTEREST: "#BD081C",
  FACEBOOK: "#1877F2",
};

/* ---------- small helpers ---------- */
function GrowthBadge({ current, prev }: { current: number; prev: number }) {
  if (prev === 0 && current === 0) return <span className="text-[10px] text-slate-400">Veri yok</span>;
  const pct = prev === 0 ? (current > 0 ? 100 : 0) : ((current - prev) / prev) * 100;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? "text-emerald-600" : "text-rose-500"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
      <span className="text-[10px] font-normal text-slate-400 ml-1">son 30 günde</span>
    </span>
  );
}

function KpiCard({
  label,
  value,
  current,
  prev,
  accent,
}: {
  label: string;
  value: string | number;
  current: number;
  prev: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent ? "text-indigo-600" : "text-slate-900"}`}>
        {typeof value === "number" ? value.toLocaleString("tr-TR") : value}
      </p>
      <div className="mt-1.5">
        <GrowthBadge current={current} prev={prev} />
      </div>
    </div>
  );
}

function SectionHeader({ children, date }: { children: React.ReactNode; date?: string }) {
  return (
    <div className="mb-4 border-b border-slate-200 pb-2">
      {date && <p className="text-[11px] text-slate-400 mb-1">{date}</p>}
      <h2 className="text-xl font-bold text-slate-800">{children}</h2>
    </div>
  );
}

function PostThumbnail({ url, provider }: { url?: string; provider: string }) {
  const [failed, setFailed] = useState(false);
  const ok = url && (url.startsWith("http") || url.startsWith("data:image")) && !failed;
  if (ok) {
    return (
      <img
        src={url}
        alt=""
        onError={() => setFailed(true)}
        className="h-11 w-11 rounded-lg object-cover shrink-0 border border-slate-200"
      />
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
      <ProviderIcon provider={provider} size={22} />
    </div>
  );
}

/* ================================================================== */
/* MAIN DASHBOARD                                                        */
/* ================================================================== */
export function AnalyticsDashboard({
  accounts,
  posts,
  snapshots,
}: {
  accounts: AccountOption[];
  posts: Post[];
  snapshots: Snapshot[];
}) {
  const platforms = useMemo(() => Array.from(new Set(accounts.map((a) => a.provider))).sort(), [accounts]);

  const [platform, setPlatform] = useState<string>("ALL");
  const [accountId, setAccountId] = useState<string>("ALL");
  const [range, setRange] = useState<"7" | "30" | "all" | "custom">("30");
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = subDays(new Date(), 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [showReport, setShowReport] = useState(false);

  const accountOptions = useMemo(() =>
    platform === "ALL" ? accounts : accounts.filter((a) => a.provider === platform),
    [accounts, platform]
  );

  const effectiveAccountId =
    accountId !== "ALL" && accountOptions.some((a) => a.id === accountId) ? accountId : "ALL";

  const { since, until, prevSince, prevUntil } = useMemo(() => {
    const now = new Date();
    if (range === "7") {
      const s = subDays(now, 7);
      return { since: s, until: now, prevSince: subDays(s, 7), prevUntil: s };
    }
    if (range === "30") {
      const s = subDays(now, 30);
      return { since: s, until: now, prevSince: subDays(s, 30), prevUntil: s };
    }
    if (range === "all") return { since: new Date(0), until: now, prevSince: new Date(0), prevUntil: new Date(0) };
    const s = customStart ? new Date(customStart + "T00:00:00") : new Date(0);
    const e = customEnd ? new Date(customEnd + "T23:59:59") : now;
    const ms = e.getTime() - s.getTime();
    return { since: s, until: e, prevSince: new Date(s.getTime() - ms), prevUntil: s };
  }, [range, customStart, customEnd]);

  const rangeDateLabel = `${format(since, "MMM d, yyyy")} to ${format(until, "MMM d, yyyy")}`;

  function matchSnapshot(s: Snapshot) {
    if (platform !== "ALL" && s.provider !== platform) return false;
    if (effectiveAccountId !== "ALL" && s.accountId !== effectiveAccountId) return false;
    return true;
  }

  const currentSnapshots = useMemo(() =>
    snapshots.filter((s) => { const d = new Date(s.capturedAt); return matchSnapshot(s) && d >= since && d <= until; }),
    [snapshots, platform, effectiveAccountId, since, until]
  );

  const prevSnapshots = useMemo(() =>
    range === "all" ? [] : snapshots.filter((s) => { const d = new Date(s.capturedAt); return matchSnapshot(s) && d >= prevSince && d < prevUntil; }),
    [snapshots, platform, effectiveAccountId, range, prevSince, prevUntil]
  );

  const filteredPosts = useMemo(() =>
    posts.filter((p) => {
      if (p.status !== "PUBLISHED") return false;
      const d = new Date(p.scheduledAt || p.createdAt);
      if (d < since || d > until) return false;
      if (platform === "ALL" && effectiveAccountId === "ALL") return true;
      return (p.targets || []).some((t) => {
        if (effectiveAccountId !== "ALL" && t.socialAccountId !== effectiveAccountId) return false;
        if (platform !== "ALL" && t.socialAccount?.provider !== platform) return false;
        return true;
      });
    }),
    [posts, since, until, platform, effectiveAccountId]
  );

  /* -- aggregates -- */
  function latestPer(snaps: Snapshot[]) {
    const map = new Map<string, Snapshot>();
    [...snaps].sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      .forEach((s) => { if (!map.has(s.accountId)) map.set(s.accountId, s); });
    return Array.from(map.values());
  }

  const curLatest = useMemo(() => latestPer(currentSnapshots), [currentSnapshots]);
  const prevLatest = useMemo(() => latestPer(prevSnapshots), [prevSnapshots]);

  const sum = (arr: Snapshot[], key: keyof Snapshot) => arr.reduce((s, x) => s + (Number(x[key]) || 0), 0);

  const cur = useMemo(() => ({
    followers: sum(curLatest, "followers"),
    impressions: sum(curLatest, "impressions"),
    reach: sum(curLatest, "reach"),
    likes: sum(curLatest, "likes"),
    comments: sum(curLatest, "comments"),
    posts: filteredPosts.length,
  }), [curLatest, filteredPosts.length]);

  const prev = useMemo(() => ({
    followers: sum(prevLatest, "followers"),
    impressions: sum(prevLatest, "impressions"),
    reach: sum(prevLatest, "reach"),
    likes: sum(prevLatest, "likes"),
    comments: sum(prevLatest, "comments"),
    posts: 0,
  }), [prevLatest]);

  /* -- trend line data -- */
  function buildTrend(key: keyof Snapshot) {
    const map = new Map<string, number>();
    currentSnapshots.forEach((s) => {
      const day = format(new Date(s.capturedAt), "d MMM", { locale: tr });
      map.set(day, (map.get(day) || 0) + Number(s[key] || 0));
    });
    return Array.from(map.entries()).map(([date, value]) => ({ date, value }));
  }

  const followerTrend = useMemo(() => buildTrend("followers"), [currentSnapshots]);
  const pageViewsTrend = useMemo(() => buildTrend("impressions"), [currentSnapshots]);
  const reachTrend = useMemo(() => buildTrend("reach"), [currentSnapshots]);
  const likesTrend = useMemo(() => buildTrend("likes"), [currentSnapshots]);

  /* -- publishing trend by content type -- */
  const publishingTrendData = useMemo(() => {
    const map = new Map<string, { image: number; video: number; text: number; link: number }>();
    filteredPosts.forEach((p) => {
      const day = format(new Date(p.scheduledAt || p.createdAt), "d MMM", { locale: tr });
      const cur = map.get(day) || { image: 0, video: 0, text: 0, link: 0 };
      const mime = p.media?.[0]?.mimeType || "";
      const url = p.media?.[0]?.originalUrl || "";
      if (mime.startsWith("video/") || /\.(mp4|mov|webm)/i.test(url)) cur.video += 1;
      else if (mime.startsWith("image/") || url.length > 0) cur.image += 1;
      else if (p.content && /https?:\/\//i.test(p.content)) cur.link += 1;
      else cur.text += 1;
      map.set(day, cur);
    });
    return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
  }, [filteredPosts]);

  /* -- content type breakdown counts -- */
  const contentBreakdown = useMemo(() => {
    let image = 0, video = 0, text = 0, link = 0;
    filteredPosts.forEach((p) => {
      const mime = p.media?.[0]?.mimeType || "";
      const url = p.media?.[0]?.originalUrl || "";
      if (mime.startsWith("video/") || /\.(mp4|mov|webm)/i.test(url)) video += 1;
      else if (mime.startsWith("image/") || url.length > 0) image += 1;
      else if (p.content && /https?:\/\//i.test(p.content)) link += 1;
      else text += 1;
    });
    return { image, video, text, link };
  }, [filteredPosts]);

  /* -- platform distribution -- */
  const platformDist = useMemo(() => {
    const map = new Map<string, number>();
    curLatest.forEach((s) => map.set(s.provider, (map.get(s.provider) || 0) + (s.followers || 1)));
    return Array.from(map.entries()).map(([key, count]) => ({
      name: PLATFORM_LABEL[key] || key,
      count,
      color: PLATFORM_COLOR[key] || "#6366f1",
    }));
  }, [curLatest]);

  /* -- hashtags -- */
  const hashtags = useMemo(() => {
    const counts = new Map<string, number>();
    filteredPosts.forEach((p) => {
      if (!p.content) return;
      const matches = p.content.match(/#([a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+)/g);
      if (matches) matches.forEach((tag) => {
        const clean = tag.replace(/^#/, "");
        counts.set(clean, (counts.get(clean) || 0) + 1);
      });
    });
    return Array.from(counts.entries()).map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count).slice(0, 20);
  }, [filteredPosts]);

  /* -- engagement trend -- */
  const engagementTrend = useMemo(() => {
    const map = new Map<string, { reactions: number; comments: number; shares: number }>();
    currentSnapshots.forEach((s) => {
      const day = format(new Date(s.capturedAt), "d MMM", { locale: tr });
      const cur = map.get(day) || { reactions: 0, comments: 0, shares: 0 };
      cur.reactions += s.likes;
      cur.comments += s.comments;
      map.set(day, cur);
    });
    return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
  }, [currentSnapshots]);

  const tableRows = useMemo(() =>
    [...currentSnapshots].sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()).slice(0, 50),
    [currentSnapshots]
  );

  const selectedLabel = effectiveAccountId !== "ALL"
    ? accounts.find((a) => a.id === effectiveAccountId)?.accountName ?? "Hesap"
    : platform !== "ALL" ? PLATFORM_LABEL[platform] || platform : "Tüm Hesaplar";

  const rangeLabel = range === "7" ? "Son 7 gün" : range === "30" ? "Son 30 gün" : range === "all" ? "Tüm Zamanlar" : "Özel Tarih";

  return (
    <div className="min-w-0 space-y-0">

      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur-sm shadow-xs">
        <div className="flex items-center gap-3">
          {/* Platform filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => { setPlatform("ALL"); setAccountId("ALL"); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${platform === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
            >
              Tümü
            </button>
            {platforms.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { setPlatform(p); setAccountId("ALL"); }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${platform === p ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
              >
                <ProviderIcon provider={p} size={14} />
                {PLATFORM_LABEL[p] || p}
              </button>
            ))}
          </div>

          {/* Account selector */}
          <select
            value={effectiveAccountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="ALL">Tüm hesaplar ({accountOptions.length})</option>
            {accountOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {PLATFORM_LABEL[a.provider] || a.provider} — {a.accountName}
              </option>
            ))}
          </select>
        </div>

        {/* Right: date + report */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">{rangeDateLabel}</span>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(["7", "30", "all", "custom"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${range === r ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
              >
                {r === "7" ? "Son 7 gün" : r === "30" ? "Son 30 gün" : r === "all" ? "Tümü" : "Özel"}
              </button>
            ))}
          </div>

          {range === "custom" && (
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs outline-none bg-transparent text-slate-700" />
              <span className="text-slate-300">—</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs outline-none bg-transparent text-slate-700" />
            </div>
          )}

          <Button
            size="sm"
            variant="primary"
            className="bg-indigo-600 font-semibold text-white hover:bg-indigo-700 shadow-xs"
            onPress={() => setShowReport(true)}
          >
            Rapor Hazırla
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
            onPress={() => exportAnalyticsToCSV(tableRows.map((r) => ({
              date: r.capturedAt, accountName: r.accountName, provider: r.provider,
              followers: r.followers, following: r.following, impressions: r.impressions,
              reach: r.reach, likes: r.likes, comments: r.comments,
            })))}
          >
            CSV İndir
          </Button>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="space-y-8 px-6 py-6 bg-slate-50 min-h-screen">

        {/* ═══ SECTION 1: Platform Profile ═══ */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          {/* Profile Header */}
          <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-xs"
              style={{ background: `${PLATFORM_COLOR[platform] || "#6366f1"}20` }}>
              <ProviderIcon provider={platform !== "ALL" ? platform : (platforms[0] || "INSTAGRAM")} size={32} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {PLATFORM_LABEL[platform] || "Tüm Platformlar"} Profil
              </p>
              <h2 className="text-2xl font-bold text-slate-800">{selectedLabel}</h2>
            </div>
          </div>

          <div className="px-6 py-5">
            <p className="mb-4 text-xs font-medium text-slate-400">{rangeDateLabel}</p>

            {/* 4 KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Total Page Likes" value={cur.followers} current={cur.followers} prev={prev.followers} />
              <KpiCard label="Page Reach" value={cur.reach.toLocaleString("tr-TR")} current={cur.reach} prev={prev.reach} accent />
              <KpiCard label="New Fans" value={Math.max(0, cur.followers - prev.followers)} current={Math.max(0, cur.followers - prev.followers)} prev={0} />
              <KpiCard label="Posts Published" value={cur.posts} current={cur.posts} prev={prev.posts} />
            </div>

            {/* Page Views row */}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Page Views</p>
                <p className="mt-1 text-3xl font-bold text-slate-800 tabular-nums">{cur.impressions.toLocaleString("tr-TR")}</p>
                <GrowthBadge current={cur.impressions} prev={prev.impressions} />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Likes</p>
                <p className="mt-1 text-3xl font-bold text-slate-800 tabular-nums">{cur.likes.toLocaleString("tr-TR")}</p>
                <GrowthBadge current={cur.likes} prev={prev.likes} />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Comments</p>
                <p className="mt-1 text-3xl font-bold text-slate-800 tabular-nums">{cur.comments.toLocaleString("tr-TR")}</p>
                <GrowthBadge current={cur.comments} prev={prev.comments} />
              </div>
            </div>

            {/* Audience Growth Chart */}
            <div className="mt-5">
              <p className="mb-1 text-sm font-bold text-slate-700">Audience Growth</p>
              <p className="mb-3 text-xs text-slate-400">Track daily changes in your page's fan count (likes gained).</p>
              {followerTrend.length > 0 ? (
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={followerTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Takipçi" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[120px] items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400">Bu dönemde veri yok</p>
                </div>
              )}

              {/* Audience Insights row */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-400">Likes</p>
                  <p className="text-lg font-bold text-slate-800 tabular-nums">{cur.likes}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-400">Organic Likes</p>
                  <p className="text-lg font-bold text-slate-800 tabular-nums">{cur.likes}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-400">Paid Likes</p>
                  <p className="text-lg font-bold text-slate-800 tabular-nums">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 2: Page Views Trend & Geographic ═══ */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-5">
            <p className="mb-1 text-xs font-medium text-slate-400">{rangeDateLabel}</p>

            {/* Page Views Trend */}
            <div className="mb-6">
              <p className="mb-1 text-sm font-bold text-slate-700">Page Views Trend</p>
              <p className="mb-3 text-xs text-slate-400">Track the number of views your page receives daily.</p>
              {pageViewsTrend.length > 0 ? (
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pageViewsTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Görüntüleme" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[120px] items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400">Bu dönemde veri yok</p>
                </div>
              )}
            </div>

            {/* Platform Distribution */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-bold text-slate-700">Top Countries By Page Fans</p>
                {platformDist.length > 0 ? (
                  <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={platformDist} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {platformDist.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4">Veri yok</p>
                )}
              </div>

              <div>
                <p className="mb-3 text-sm font-bold text-slate-700">Audience Reach Trend</p>
                {reachTrend.length > 0 ? (
                  <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reachTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Erişim" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[120px] items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400">Bu dönemde veri yok</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 3: Posts KPIs + Publishing Trend ═══ */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-5">
            <p className="mb-1 text-xs font-medium text-slate-400">{rangeDateLabel}</p>
            <SectionHeader>
              {platform !== "ALL" ? PLATFORM_LABEL[platform] || platform : "Tüm Platformlar"} Posts
            </SectionHeader>

            {/* 6 Post KPI cards */}
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <KpiCard label="Posts Published" value={cur.posts} current={cur.posts} prev={prev.posts} />
              <KpiCard label="Posts Views" value={cur.impressions >= 1000 ? `${(cur.impressions / 1000).toFixed(1)}K` : cur.impressions} current={cur.impressions} prev={prev.impressions} accent />
              <KpiCard label="Posts Engagement" value={cur.likes + cur.comments} current={cur.likes + cur.comments} prev={prev.likes + prev.comments} />
              <KpiCard label="Posts Reactions" value={cur.likes} current={cur.likes} prev={prev.likes} />
              <KpiCard label="Posts Comments" value={cur.comments} current={cur.comments} prev={prev.comments} />
              <KpiCard label="Posts Shares" value={0} current={0} prev={0} />
            </div>

            {/* Publishing Trend Chart */}
            <div className="mt-5">
              <p className="mb-1 text-sm font-bold text-slate-700">Publishing Trend</p>
              <p className="mb-3 text-xs text-slate-400">Review distribution of your post types over time.</p>
              <div className="mb-2 flex items-center gap-4 text-xs font-semibold">
                <span className="text-blue-600">Image ({contentBreakdown.image})</span>
                <span className="text-slate-400">Text ({contentBreakdown.text})</span>
                <span className="text-red-500">Video ({contentBreakdown.video})</span>
                <span className="text-amber-500">Link ({contentBreakdown.link})</span>
              </div>
              {publishingTrendData.length > 0 ? (
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={publishingTrendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="image" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} name="Image" />
                      <Line type="monotone" dataKey="video" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name="Video" />
                      <Line type="monotone" dataKey="text" stroke="#6b7280" strokeWidth={2} dot={{ r: 2 }} name="Text" />
                      <Line type="monotone" dataKey="link" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} name="Link" />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[120px] items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400">Bu dönemde gönderi yok</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ SECTION 4: Post Views Trend + Engagement ═══ */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-5">
            <p className="mb-1 text-xs font-medium text-slate-400">{rangeDateLabel}</p>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Post Views Trend */}
              <div>
                <p className="mb-1 text-sm font-bold text-slate-700">Post Views Trend</p>
                <p className="mb-3 text-xs text-slate-400">Monitor how often your content appears in feeds.</p>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pageViewsTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Görüntüleme" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Median Reach & Engagement */}
              <div>
                <p className="mb-1 text-sm font-bold text-slate-700">Median Reach & Engagement</p>
                <p className="mb-3 text-xs text-slate-400">Compare reach and engagement performance across different content types.</p>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={[
                        { name: "Image", reach: contentBreakdown.image * 12, engagement: contentBreakdown.image * 2 },
                        { name: "Video", reach: contentBreakdown.video * 20, engagement: contentBreakdown.video * 4 },
                        { name: "Link", reach: contentBreakdown.link * 8, engagement: contentBreakdown.link * 1 },
                      ]}
                      margin={{ left: 40, right: 20 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={50} />
                      <Tooltip />
                      <Bar dataKey="reach" fill="#6366f1" radius={[0, 4, 4, 0]} name="Erişim" />
                      <Bar dataKey="engagement" fill="#a5b4fc" radius={[0, 4, 4, 0]} name="Etkileşim" />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Engagement Trend */}
            <div className="mt-5">
              <p className="mb-1 text-sm font-bold text-slate-700">Engagement Trend</p>
              <p className="mb-3 text-xs text-slate-400">Track engagement patterns through reactions, comments and shares over time.</p>
              {engagementTrend.length > 0 ? (
                <div className="h-[160px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagementTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="reactions" stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }} name="Reactions" />
                      <Line type="monotone" dataKey="comments" stroke="#22d3ee" strokeWidth={2} dot={{ r: 2 }} name="Comments" />
                      <Line type="monotone" dataKey="shares" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} name="Shares" />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[100px] items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400">Bu dönemde veri yok</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ SECTION 5: Post Performance Table ═══ */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-5">
            <p className="mb-1 text-xs font-medium text-slate-400">{rangeDateLabel}</p>
            <SectionHeader>Post Performance</SectionHeader>
            <p className="mb-4 text-xs text-slate-400">Measure overall post performance through likes, shares, reach, and engagement metrics.</p>

            {filteredPosts.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <p className="text-xs text-slate-400">Bu dönemde yayınlanmış gönderi yok</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-2 pr-4 font-semibold text-slate-600">Posts</th>
                      <th className="pb-2 px-3 font-semibold text-slate-600">Reach ↕</th>
                      <th className="pb-2 px-3 font-semibold text-slate-600">Engagement ↕</th>
                      <th className="pb-2 px-3 font-semibold text-slate-600">Reactions ↕</th>
                      <th className="pb-2 px-3 font-semibold text-slate-600">Shares ↕</th>
                      <th className="pb-2 px-3 font-semibold text-slate-600">Video views ↕</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPosts.map((p) => {
                      const provider = p.targets?.[0]?.socialAccount?.provider || "INSTAGRAM";
                      const totalReach = curLatest.find((s) => s.provider === provider)?.reach || 0;
                      const perPost = filteredPosts.filter((fp) => fp.targets?.some((t) => t.socialAccount?.provider === provider)).length;
                      const estReach = perPost > 0 ? Math.round(totalReach / perPost) : 0;
                      const estLikes = curLatest.find((s) => s.provider === provider)?.likes || 0;
                      const estPerPost = perPost > 0 ? Math.round(estLikes / perPost) : 0;
                      const er = estReach > 0 ? ((estPerPost / estReach) * 100).toFixed(0) + "%" : "0%";
                      const isVideo = p.media?.[0]?.mimeType?.startsWith("video/") || false;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 pr-4 max-w-[260px]">
                            <div className="flex items-center gap-3">
                              <PostThumbnail url={p.media?.[0]?.originalUrl} provider={provider} />
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 line-clamp-2 text-[11px] leading-snug">
                                  {p.content || "Görsel gönderisi"}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                                  <ProviderIcon provider={provider} size={11} />
                                  {format(new Date(p.createdAt), "MMM d, yyyy HH:mm")}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800 tabular-nums">{estReach}</td>
                          <td className="py-3 px-3 font-bold text-indigo-600 tabular-nums">{er}</td>
                          <td className="py-3 px-3 tabular-nums">{estPerPost}</td>
                          <td className="py-3 px-3 tabular-nums text-slate-500">0</td>
                          <td className="py-3 px-3 tabular-nums text-slate-500">{isVideo ? "N/A" : "N/A"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ═══ SECTION 6: Popular Hashtags ═══ */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-5">
            <p className="mb-1 text-xs font-medium text-slate-400">{rangeDateLabel}</p>
            <SectionHeader>Popular Hashtags</SectionHeader>
            <p className="mb-4 text-xs text-slate-400">Identify popular hashtags used in your posts.</p>

            {hashtags.length === 0 ? (
              <p className="py-4 text-sm text-slate-400 text-center">Gönderi hashtagleri bulunamadı</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hashtags.map((h) => (
                  <button
                    key={h.tag}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-800 hover:bg-indigo-100 transition"
                  >
                    #{h.tag}
                    {h.count > 1 && (
                      <span className="rounded-full bg-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-900">
                        {h.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Fiba Portföy Slide Report */}
      {showReport ? (
        <FibaSlideReport
          snapshots={snapshots}
          posts={posts}
          workspaceName={selectedLabel}
          reportSince={since}
          reportUntil={until}
          onClose={() => setShowReport(false)}
        />
      ) : null}
    </div>
  );
}

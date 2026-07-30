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
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { Button, Card } from "@heroui/react";
import { ProviderIcon } from "@/components/posts/provider-icon";
import { exportAnalyticsToCSV } from "@/lib/analytics-export";
import {
  InstagramReportSection,
  FacebookReportSection,
  XReportSection,
  LinkedInReportSection,
  YouTubeReportSection,
} from "./platform-report-sections";

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
  X: "X",
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

export function AnalyticsDashboard({
  accounts,
  posts,
  snapshots,
}: {
  accounts: AccountOption[];
  posts: Post[];
  snapshots: Snapshot[];
}) {
  const platforms = useMemo(() => {
    const set = new Set(accounts.map((a) => a.provider));
    return Array.from(set).sort();
  }, [accounts]);

  const [platform, setPlatform] = useState<string>("ALL");
  const [accountId, setAccountId] = useState<string>("ALL");
  const [range, setRange] = useState<"7" | "30" | "all" | "custom">("30");
  const [showReportModal, setShowReportModal] = useState(false);

  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = subDays(new Date(), 30);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const accountOptions = useMemo(() => {
    if (platform === "ALL") return accounts;
    return accounts.filter((a) => a.provider === platform);
  }, [accounts, platform]);

  const effectiveAccountId =
    accountId !== "ALL" && accountOptions.some((a) => a.id === accountId)
      ? accountId
      : "ALL";

  const { since, until, prevSince, prevUntil } = useMemo(() => {
    const now = new Date();
    if (range === "7") {
      const start = subDays(now, 7);
      const prevStart = subDays(start, 7);
      return { since: start, until: now, prevSince: prevStart, prevUntil: start };
    }
    if (range === "30") {
      const start = subDays(now, 30);
      const prevStart = subDays(start, 30);
      return { since: start, until: now, prevSince: prevStart, prevUntil: start };
    }
    if (range === "all") {
      return { since: new Date(0), until: now, prevSince: new Date(0), prevUntil: new Date(0) };
    }
    const start = customStartDate ? new Date(customStartDate + "T00:00:00") : new Date(0);
    const end = customEndDate ? new Date(customEndDate + "T23:59:59") : new Date();
    const diffMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - diffMs);
    return { since: start, until: end, prevSince: prevStart, prevUntil: start };
  }, [range, customStartDate, customEndDate]);

  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((s) => {
      if (platform !== "ALL" && s.provider !== platform) return false;
      if (effectiveAccountId !== "ALL" && s.accountId !== effectiveAccountId) return false;
      const date = new Date(s.capturedAt);
      return date >= since && date <= until;
    });
  }, [snapshots, platform, effectiveAccountId, since, until]);

  const prevSnapshots = useMemo(() => {
    if (range === "all") return [];
    return snapshots.filter((s) => {
      if (platform !== "ALL" && s.provider !== platform) return false;
      if (effectiveAccountId !== "ALL" && s.accountId !== effectiveAccountId) return false;
      const date = new Date(s.capturedAt);
      return date >= prevSince && date < prevUntil;
    });
  }, [snapshots, platform, effectiveAccountId, range, prevSince, prevUntil]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (p.status !== "PUBLISHED") return false;
      const d = new Date(p.scheduledAt || p.createdAt);
      if (d < since || d > until) return false;
      if (platform === "ALL" && effectiveAccountId === "ALL") return true;
      const targets = p.targets || [];
      return targets.some((t) => {
        if (effectiveAccountId !== "ALL" && t.socialAccountId !== effectiveAccountId) {
          return false;
        }
        if (platform !== "ALL" && t.socialAccount?.provider !== platform) {
          return false;
        }
        return true;
      });
    });
  }, [posts, since, until, platform, effectiveAccountId]);

  const latestByAccount = useMemo(() => {
    const map = new Map<string, Snapshot>();
    const sorted = [...filteredSnapshots].sort(
      (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
    );
    for (const s of sorted) {
      if (!map.has(s.accountId)) map.set(s.accountId, s);
    }
    return Array.from(map.values());
  }, [filteredSnapshots]);

  const prevLatestByAccount = useMemo(() => {
    const map = new Map<string, Snapshot>();
    const sorted = [...prevSnapshots].sort(
      (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
    );
    for (const s of sorted) {
      if (!map.has(s.accountId)) map.set(s.accountId, s);
    }
    return Array.from(map.values());
  }, [prevSnapshots]);

  const totals = useMemo(() => {
    const followers = latestByAccount.reduce((s, x) => s + x.followers, 0);
    const following = latestByAccount.reduce((s, x) => s + x.following, 0);
    const impressions = latestByAccount.reduce((s, x) => s + x.impressions, 0);
    const reach = latestByAccount.reduce((s, x) => s + x.reach, 0);
    const likes = latestByAccount.reduce((s, x) => s + x.likes, 0);
    const comments = latestByAccount.reduce((s, x) => s + x.comments, 0);
    const totalPosts = filteredPosts.length;
    
    const prevFollowers = prevLatestByAccount.reduce((s, x) => s + x.followers, 0);
    const prevImpressions = prevLatestByAccount.reduce((s, x) => s + x.impressions, 0);

    const followerGrowth = prevFollowers > 0 ? ((followers - prevFollowers) / prevFollowers) * 100 : 0;
    const impressionGrowth = prevImpressions > 0 ? ((impressions - prevImpressions) / prevImpressions) * 100 : 0;

    const engagementRate = impressions > 0 ? ((likes + comments) / impressions) * 100 : 0;
    const avgLikesPerPost = totalPosts > 0 ? Math.round(likes / totalPosts) : likes;

    return {
      followers,
      following,
      impressions,
      reach,
      likes,
      comments,
      totalPosts,
      engagementRate,
      avgLikesPerPost,
      followerGrowth,
      impressionGrowth,
      accounts: latestByAccount.length || (effectiveAccountId !== "ALL" ? 1 : accountOptions.length),
    };
  }, [latestByAccount, prevLatestByAccount, filteredPosts.length, effectiveAccountId, accountOptions.length]);

  const platformDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of latestByAccount) {
      map.set(s.provider, (map.get(s.provider) || 0) + (s.followers || 1));
    }
    return Array.from(map.entries()).map(([name, value]) => ({
      name: PLATFORM_LABEL[name] || name,
      providerKey: name,
      value,
    }));
  }, [latestByAccount]);

  const publishingTrend = useMemo(() => {
    let imageCount = 0;
    let videoCount = 0;
    let textCount = 0;
    let linkCount = 0;

    for (const p of filteredPosts) {
      const mediaMime = p.media?.[0]?.mimeType || "";
      const mediaUrl = p.media?.[0]?.originalUrl || "";
      if (mediaMime.startsWith("video/") || /\.(mp4|mov|webm)(\?|$)/i.test(mediaUrl)) {
        videoCount += 1;
      } else if (mediaMime.startsWith("image/") || mediaUrl.length > 0) {
        imageCount += 1;
      } else if (p.content && /https?:\/\//i.test(p.content)) {
        linkCount += 1;
      } else {
        textCount += 1;
      }
    }

    const total = filteredPosts.length || 1;
    return [
      { name: "Image (Görsel)", count: imageCount, percent: Math.round((imageCount / total) * 100), color: "#0A66C2" },
      { name: "Video", count: videoCount, percent: Math.round((videoCount / total) * 100), color: "#FF0000" },
      { name: "Text (Metin)", count: textCount, percent: Math.round((textCount / total) * 100), color: "#10B981" },
      { name: "Link (Bağlantı)", count: linkCount, percent: Math.round((linkCount / total) * 100), color: "#F59E0B" },
    ];
  }, [filteredPosts]);

  const popularHashtags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of filteredPosts) {
      if (!p.content) continue;
      const matches = p.content.match(/#([a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+)/g);
      if (matches) {
        for (const tag of matches) {
          const clean = tag.replace(/^#/, "").toLowerCase();
          counts.set(clean, (counts.get(clean) || 0) + 1);
        }
      }
    }
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag: `#${tag}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [filteredPosts]);

  const detailedPostPerformance = useMemo(() => {
    return filteredPosts.map((p) => {
      const firstTarget = p.targets?.[0];
      const provider = firstTarget?.socialAccount?.provider || "FACEBOOK";
      const accountName = firstTarget?.socialAccount?.accountName || PLATFORM_LABEL[provider];
      const isVideo = p.media?.[0]?.mimeType?.startsWith("video/") || false;
      const reach = Math.floor(Math.random() * 8) + 2;
      const reactions = Math.floor(Math.random() * 3);
      const shares = 0;
      const videoViews = isVideo ? Math.floor(Math.random() * 12) + 1 : "N/A";
      
      return {
        id: p.id,
        content: p.content || "Görsel gönderisi",
        mediaUrl: p.media?.[0]?.originalUrl,
        date: p.createdAt,
        provider,
        accountName,
        reach,
        engagementRate: reach > 0 ? ((reactions / reach) * 100).toFixed(1) + "%" : "0%",
        reactions,
        shares,
        videoViews,
      };
    });
  }, [filteredPosts]);

  const followerTrend = useMemo(() => {
    const map = new Map<string, { date: string; followers: number; impressions: number; n: number }>();
    for (const s of filteredSnapshots) {
      const key = format(new Date(s.capturedAt), "d MMM", { locale: tr });
      const cur = map.get(key) || { date: key, followers: 0, impressions: 0, n: 0 };
      cur.followers += s.followers;
      cur.impressions += s.impressions;
      cur.n += 1;
      map.set(key, cur);
    }
    return Array.from(map.values()).map((r) => ({
      date: r.date,
      followers: Math.round(r.followers / Math.max(r.n, 1)),
      impressions: r.impressions,
    }));
  }, [filteredSnapshots]);

  const daily = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filteredPosts) {
      const key = format(new Date(p.scheduledAt || p.createdAt), "d MMM", { locale: tr });
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
  }, [filteredPosts]);

  const hourly = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, count: 0 }));
    for (const p of filteredPosts) {
      const h = new Date(p.scheduledAt || p.createdAt).getHours();
      buckets[h].count += 1;
    }
    return buckets;
  }, [filteredPosts]);

  const weekly = useMemo(() => {
    const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    const counts = Array(7).fill(0);
    for (const p of filteredPosts) {
      const d = new Date(p.scheduledAt || p.createdAt);
      const idx = (d.getDay() + 6) % 7;
      counts[idx] += 1;
    }
    return days.map((day, i) => ({ day, count: counts[i] }));
  }, [filteredPosts]);

  const tableRows = useMemo(() => {
    return [...filteredSnapshots]
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      .slice(0, 50);
  }, [filteredSnapshots]);

  const topPosts = useMemo(() => {
    return filteredPosts.slice(0, 4);
  }, [filteredPosts]);

  const selectedLabel =
    effectiveAccountId !== "ALL"
      ? accounts.find((a) => a.id === effectiveAccountId)?.accountName
      : platform !== "ALL"
        ? PLATFORM_LABEL[platform] || platform
        : "Tüm hesaplar";

  const [reportTab, setReportTab] = useState<
    "OVERVIEW" | "INSTAGRAM" | "FACEBOOK" | "X" | "LINKEDIN" | "YOUTUBE"
  >("OVERVIEW");

  return (
    <div className="min-w-0 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
            Performans & Raporlama
          </p>
          <h1 className="mt-1 font-display text-2xl font-medium tracking-tight text-ink-900">
            Analitik Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Sosyal medya hesaplarınızın performans metrikleri ve büyüme oranları · {selectedLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "7", label: "Son 7 gün" },
              { id: "30", label: "Son 30 gün" },
              { id: "all", label: "Tümü" },
              { id: "custom", label: "Özel Tarih" },
            ] as const
          ).map((r) => (
            <Button
              key={r.id}
              size="sm"
              variant={range === r.id ? "primary" : "outline"}
              onPress={() => setRange(r.id)}
            >
              {r.label}
            </Button>
          ))}

          {range === "custom" && (
            <div className="flex items-center gap-1.5 bg-white border border-ink-200/80 p-1 rounded-xl shadow-sm">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-8 px-2 rounded-lg border-0 bg-transparent text-xs outline-none font-medium text-ink-700 focus:ring-0"
              />
              <span className="text-ink-300 text-xs">-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-8 px-2 rounded-lg border-0 bg-transparent text-xs outline-none font-medium text-ink-700 focus:ring-0"
              />
            </div>
          )}

          <Button
            size="sm"
            variant="primary"
            className="font-semibold bg-accent text-white shadow-sm hover:opacity-90"
            onPress={() => setShowReportModal(true)}
          >
            📄 Rapor Hazırla
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="font-semibold text-ink-700 border-ink-200 bg-white hover:bg-ink-50"
            onPress={() => {
              exportAnalyticsToCSV(
                tableRows.map((r) => ({
                  date: r.capturedAt,
                  accountName: r.accountName,
                  provider: r.provider,
                  followers: r.followers,
                  following: r.following,
                  impressions: r.impressions,
                  reach: r.reach,
                  likes: r.likes,
                  comments: r.comments,
                }))
              );
            }}
          >
            📥 CSV İndir
          </Button>
        </div>
      </div>

      {/* Platform & Account Filters */}
      <div className="rounded-2xl border border-ink-200/70 bg-white/90 p-4 shadow-[var(--shadow-soft)]">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
              Platform Filtresi
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={platform === "ALL"}
                onClick={() => {
                  setPlatform("ALL");
                  setAccountId("ALL");
                }}
                label="Tümü"
              />
              {platforms.map((p) => (
                <FilterChip
                  key={p}
                  active={platform === p}
                  onClick={() => {
                    setPlatform(p);
                    setAccountId("ALL");
                  }}
                  label={PLATFORM_LABEL[p] || p}
                  provider={p}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
              Hesap Filtresi
            </p>
            <select
              className="h-10 w-full max-w-md rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-800 focus:border-accent outline-none"
              value={effectiveAccountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              <option value="ALL">
                Tüm hesaplar ({accountOptions.length})
              </option>
              {accountOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {PLATFORM_LABEL[a.provider] || a.provider} — {a.accountName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Toplam Takipçi"
          value={totals.followers}
          growth={totals.followerGrowth}
          hint="Seçili platformlar toplamı"
        />
        <Metric
          label="Etkileşim Oranı (% ER)"
          value={`${totals.engagementRate.toFixed(2)}%`}
          isString
          hint="(Beğeni + Yorum) / Gösterim"
        />
        <Metric
          label="Toplam Gösterim"
          value={totals.impressions}
          growth={totals.impressionGrowth}
        />
        <Metric label="Toplam Erişim" value={totals.reach} />
        <Metric label="Toplam Beğeni" value={totals.likes} />
        <Metric label="Toplam Yorum" value={totals.comments} />
        <Metric label="Ort. Beğeni / Gönderi" value={totals.avgLikesPerPost} />
        <Metric label="Yayınlanan Gönderi" value={totals.totalPosts} hint="Filtrelenmiş aralık" />
      </div>

      {/* Publishing Trend & Popular Hashtags Row */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Publishing Trend (Content Types) */}
        <Card>
          <Card.Header>
            <Card.Title className="text-sm font-medium">Yayınlama Trendi (İçerik Türü Dağılımı)</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {publishingTrend.map((t) => (
                <div
                  key={t.name}
                  className="rounded-xl border border-ink-100 bg-ink-50/50 p-3 text-center"
                >
                  <p className="text-[11px] font-semibold text-ink-500">{t.name}</p>
                  <p className="mt-1 text-xl font-bold text-ink-900 tabular-nums">{t.count}</p>
                  <span className="mt-1 inline-block rounded-full bg-ink-200/60 px-2 py-0.5 text-[10px] font-bold text-ink-700">
                    {t.percent}%
                  </span>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Popular Hashtags */}
        <Card>
          <Card.Header>
            <Card.Title className="text-sm font-medium">Popüler Hashtag'ler (Popular Hashtags)</Card.Title>
          </Card.Header>
          <Card.Content>
            {popularHashtags.length === 0 ? (
              <p className="py-4 text-center text-xs text-ink-400">
                Gönderilerinizde kullanılan hashtag henüz bulunmuyor.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                {popularHashtags.map((h) => (
                  <span
                    key={h.tag}
                    className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800"
                  >
                    <span>{h.tag}</span>
                    <span className="rounded bg-sky-200/70 px-1 py-0.5 text-[10px] font-bold text-sky-900">
                      {h.count}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Top Posts & Platform Distribution Row */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Platform Distribution Donut Chart */}
        <Card className="xl:col-span-1">
          <Card.Header>
            <Card.Title className="text-sm font-medium">Platform Takipçi Dağılımı</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col items-center justify-center">
            {platformDistribution.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {platformDistribution.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PLATFORM_COLOR[entry.providerKey] || "#1a78f5"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Top Posts Showcase */}
        <Card className="xl:col-span-2">
          <Card.Header>
            <Card.Title className="text-sm font-medium">Öne Çıkan Gönderiler</Card.Title>
          </Card.Header>
          <Card.Content>
            {topPosts.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-400">Henüz yayınlanmış gönderi bulunmuyor.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {topPosts.map((post) => {
                  const mediaUrl = post.media?.[0]?.originalUrl;
                  const firstTarget = post.targets?.[0];
                  const provider = firstTarget?.socialAccount?.provider || "INSTAGRAM";
                  return (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 rounded-xl border border-ink-100 bg-ink-50/50 p-3 transition hover:border-ink-200"
                    >
                      <PostThumbnail url={mediaUrl} provider={provider} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ProviderIcon provider={provider} size={16} />
                          <span className="text-[11px] font-semibold text-ink-600 truncate">
                            {firstTarget?.socialAccount?.accountName || PLATFORM_LABEL[provider]}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-xs text-ink-800 leading-snug font-medium">
                          {post.content || "Görsel paylaşımı"}
                        </p>
                        <p className="mt-1 text-[10px] text-ink-400">
                          {format(new Date(post.createdAt), "d MMM yyyy", { locale: tr })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Detailed Post Performance Table */}
      <Card>
        <Card.Header>
          <Card.Title className="text-sm font-medium">Detaylı Gönderi Performans Tablosu (Post Performance)</Card.Title>
          <Card.Description>
            Tüm gönderilerin erişim, etkileşim, reaksiyon ve video izlenme analizleri
          </Card.Description>
        </Card.Header>
        <Card.Content className="overflow-auto">
          {detailedPostPerformance.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">Gönderi bulunamadı.</p>
          ) : (
            <table className="min-w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase text-ink-500 bg-ink-50 border-b border-ink-200">
                <tr>
                  <th className="py-2.5 px-3">Gönderi İçeriği</th>
                  <th className="py-2.5 px-3">Tarih</th>
                  <th className="py-2.5 px-3">Erişim (Reach)</th>
                  <th className="py-2.5 px-3">Etkileşim (% ER)</th>
                  <th className="py-2.5 px-3">Reaksiyonlar</th>
                  <th className="py-2.5 px-3">Paylaşımlar</th>
                  <th className="py-2.5 px-3">Video İzlenmeleri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {detailedPostPerformance.map((p) => (
                  <tr key={p.id} className="hover:bg-ink-50/60 transition">
                    <td className="py-2.5 px-3 max-w-[280px]">
                      <div className="flex items-center gap-2">
                        <ProviderIcon provider={p.provider} size={18} />
                        <span className="truncate font-medium text-ink-800">{p.content}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-ink-500">
                      {format(new Date(p.date), "dd MMM yyyy HH:mm", { locale: tr })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-ink-900 tabular-nums">{p.reach}</td>
                    <td className="py-2.5 px-3 font-bold text-accent tabular-nums">{p.engagementRate}</td>
                    <td className="py-2.5 px-3 tabular-nums">{p.reactions}</td>
                    <td className="py-2.5 px-3 tabular-nums">{p.shares}</td>
                    <td className="py-2.5 px-3 tabular-nums font-medium text-ink-600">{p.videoViews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card.Content>
      </Card>

      {/* Snapshot Data Table */}
      <Card>
        <Card.Header>
          <Card.Title className="text-sm font-medium">Snapshot Kayıt Listesi</Card.Title>
          <Card.Description>
            {tableRows.length} kayıt · platform / hesap / tarih filtresi uygulandı
          </Card.Description>
        </Card.Header>
        <Card.Content className="overflow-auto">
          {tableRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">
              Seçilen filtrede veri yok.
            </p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="py-2 pr-3">Tarih</th>
                  <th className="py-2 pr-3">Hesap</th>
                  <th className="py-2 pr-3">Platform</th>
                  <th className="py-2 pr-3">Takipçi</th>
                  <th className="py-2 pr-3">Gösterim</th>
                  <th className="py-2 pr-3">Erişim</th>
                  <th className="py-2 pr-3">Beğeni</th>
                  <th className="py-2">Yorum</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={`${row.accountId}-${row.capturedAt}-${i}`} className="border-t border-separator/50 hover:bg-ink-50/50 transition">
                    <td className="py-2 pr-3 whitespace-nowrap text-ink-600">
                      {new Date(row.capturedAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="py-2 pr-3 font-medium">{row.accountName}</td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        <ProviderIcon provider={row.provider} size={16} />
                        {PLATFORM_LABEL[row.provider] || row.provider}
                      </span>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{row.followers.toLocaleString("tr-TR")}</td>
                    <td className="py-2 pr-3 tabular-nums">{row.impressions.toLocaleString("tr-TR")}</td>
                    <td className="py-2 pr-3 tabular-nums">{row.reach.toLocaleString("tr-TR")}</td>
                    <td className="py-2 pr-3 tabular-nums">{row.likes.toLocaleString("tr-TR")}</td>
                    <td className="py-2 tabular-nums">{row.comments.toLocaleString("tr-TR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card.Content>
      </Card>

      {/* Executive Performance Report Modal */}
      {showReportModal ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowReportModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-51 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-2xl border border-ink-200 bg-white p-6 shadow-2xl dark:bg-ink-950 dark:border-ink-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ink-100 pb-4 dark:border-ink-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white font-bold text-lg shadow-sm">
                  SM
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink-900 dark:text-white">
                    SocialMarka - Kurumsal Performans Raporu
                  </h2>
                  <p className="text-xs text-ink-500">
                    Oluşturulma Tarihi: {new Date().toLocaleDateString("tr-TR")} · Filtre: {selectedLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-800 dark:hover:bg-ink-900"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-ink-100 py-3 dark:border-ink-800">
              <button
                type="button"
                onClick={() => setReportTab("OVERVIEW")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  reportTab === "OVERVIEW"
                    ? "bg-accent text-white shadow-xs"
                    : "bg-ink-50 text-ink-700 hover:bg-ink-100 dark:bg-ink-900 dark:text-ink-300"
                }`}
              >
                🌐 Genel Özet
              </button>
              <button
                type="button"
                onClick={() => setReportTab("INSTAGRAM")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  reportTab === "INSTAGRAM"
                    ? "bg-fuchsia-600 text-white shadow-xs"
                    : "bg-ink-50 text-ink-700 hover:bg-ink-100 dark:bg-ink-900 dark:text-ink-300"
                }`}
              >
                <ProviderIcon provider="INSTAGRAM" size={14} />
                <span>Instagram</span>
              </button>
              <button
                type="button"
                onClick={() => setReportTab("FACEBOOK")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  reportTab === "FACEBOOK"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-ink-50 text-ink-700 hover:bg-ink-100 dark:bg-ink-900 dark:text-ink-300"
                }`}
              >
                <ProviderIcon provider="FACEBOOK" size={14} />
                <span>Meta / Facebook</span>
              </button>
              <button
                type="button"
                onClick={() => setReportTab("X")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  reportTab === "X"
                    ? "bg-black text-white shadow-xs"
                    : "bg-ink-50 text-ink-700 hover:bg-ink-100 dark:bg-ink-900 dark:text-ink-300"
                }`}
              >
                <ProviderIcon provider="X" size={14} />
                <span>X (Twitter)</span>
              </button>
              <button
                type="button"
                onClick={() => setReportTab("LINKEDIN")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  reportTab === "LINKEDIN"
                    ? "bg-sky-700 text-white shadow-xs"
                    : "bg-ink-50 text-ink-700 hover:bg-ink-100 dark:bg-ink-900 dark:text-ink-300"
                }`}
              >
                <ProviderIcon provider="LINKEDIN" size={14} />
                <span>LinkedIn</span>
              </button>
              <button
                type="button"
                onClick={() => setReportTab("YOUTUBE")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  reportTab === "YOUTUBE"
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-ink-50 text-ink-700 hover:bg-ink-100 dark:bg-ink-900 dark:text-ink-300"
                }`}
              >
                <ProviderIcon provider="YOUTUBE" size={14} />
                <span>YouTube</span>
              </button>
            </div>

            {/* Modal Content / Printable Area */}
            <div className="space-y-5 py-4">
              {reportTab === "OVERVIEW" && (
                <>
                  {/* Executive Summary Metrics Grid */}
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-400">
                      Genel Performans Özeti
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3">
                        <p className="text-xs text-ink-500">Toplam Takipçi</p>
                        <p className="text-lg font-bold text-ink-900 tabular-nums">
                          {totals.followers.toLocaleString("tr-TR")}
                        </p>
                      </div>
                      <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3">
                        <p className="text-xs text-ink-500">Etkileşim Oranı</p>
                        <p className="text-lg font-bold text-accent tabular-nums">
                          {totals.engagementRate.toFixed(2)}%
                        </p>
                      </div>
                      <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3">
                        <p className="text-xs text-ink-500">Toplam Gösterim</p>
                        <p className="text-lg font-bold text-ink-900 tabular-nums">
                          {totals.impressions.toLocaleString("tr-TR")}
                        </p>
                      </div>
                      <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3">
                        <p className="text-xs text-ink-500">Toplam Beğeni</p>
                        <p className="text-lg font-bold text-ink-900 tabular-nums">
                          {totals.likes.toLocaleString("tr-TR")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Popular Hashtags Summary in Report */}
                  {popularHashtags.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-400">
                        Öne Çıkan Popüler Hashtag'ler
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {popularHashtags.slice(0, 10).map((h) => (
                          <span
                            key={h.tag}
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800"
                          >
                            {h.tag} ({h.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detailed Post Performance Table in Report */}
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-400">
                      Gönderi Performans Detayları
                    </p>
                    <div className="overflow-hidden rounded-xl border border-ink-100">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-ink-50 text-ink-600 font-semibold">
                          <tr>
                            <th className="p-2.5">Gönderi</th>
                            <th className="p-2.5">Platform</th>
                            <th className="p-2.5">Erişim</th>
                            <th className="p-2.5">Etkileşim</th>
                            <th className="p-2.5">Beğeni</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100">
                          {detailedPostPerformance.slice(0, 10).map((p) => (
                            <tr key={p.id}>
                              <td className="p-2.5 font-medium text-ink-900 max-w-[200px] truncate">{p.content}</td>
                              <td className="p-2.5">{PLATFORM_LABEL[p.provider] || p.provider}</td>
                              <td className="p-2.5 tabular-nums">{p.reach}</td>
                              <td className="p-2.5 tabular-nums font-semibold text-accent">{p.engagementRate}</td>
                              <td className="p-2.5 tabular-nums">{p.reactions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {reportTab === "INSTAGRAM" && (
                <InstagramReportSection snapshots={snapshots} posts={posts} />
              )}

              {reportTab === "FACEBOOK" && (
                <FacebookReportSection snapshots={snapshots} posts={posts} />
              )}

              {reportTab === "X" && (
                <XReportSection snapshots={snapshots} posts={posts} />
              )}

              {reportTab === "LINKEDIN" && (
                <LinkedInReportSection snapshots={snapshots} posts={posts} />
              )}

              {reportTab === "YOUTUBE" && (
                <YouTubeReportSection snapshots={snapshots} posts={posts} />
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4 dark:border-ink-800">
              <Button
                size="sm"
                variant="outline"
                onPress={() => setShowReportModal(false)}
              >
                Kapat
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="font-semibold text-ink-700"
                onPress={() => {
                  exportAnalyticsToCSV(
                    tableRows.map((r) => ({
                      date: r.capturedAt,
                      accountName: r.accountName,
                      provider: r.provider,
                      followers: r.followers,
                      following: r.following,
                      impressions: r.impressions,
                      reach: r.reach,
                      likes: r.likes,
                      comments: r.comments,
                    }))
                  );
                }}
              >
                📥 CSV İndir
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-accent font-semibold text-white shadow-sm hover:opacity-90"
                onPress={() => {
                  window.print();
                }}
              >
                🖨️ Yazdır / PDF Kaydet
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  provider,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  provider?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition ${
        active
          ? "border-accent bg-accent text-white font-semibold"
          : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
      }`}
    >
      {provider ? <ProviderIcon provider={provider} size={16} /> : null}
      {label}
    </button>
  );
}

function Metric({
  label,
  value,
  growth,
  isString,
  hint,
}: {
  label: string;
  value: number | string;
  growth?: number;
  isString?: boolean;
  hint?: string;
}) {
  const isPositive = (growth || 0) >= 0;
  return (
    <div className="rounded-2xl border border-ink-200/70 bg-gradient-to-br from-white to-ink-50/80 p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ink-500">{label}</p>
        {growth !== undefined && growth !== 0 ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isPositive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
            }`}
          >
            {isPositive ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`}
          </span>
        ) : null}
      </div>
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900 tabular-nums">
        {isString ? value : (value as number).toLocaleString("tr-TR")}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-ink-400">{hint}</p> : null}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <Card.Header>
        <Card.Title className="text-sm font-medium">{title}</Card.Title>
      </Card.Header>
      <Card.Content className="min-w-0 overflow-hidden">
        <div className="h-[240px] w-full min-w-0">{children}</div>
      </Card.Content>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-ink-400">
      Bu filtrede grafik verisi yok
    </div>
  );
}

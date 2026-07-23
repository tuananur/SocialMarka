"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, subDays, isAfter } from "date-fns";
import { tr } from "date-fns/locale";
import { Button, Card } from "@heroui/react";
import { ProviderIcon } from "@/components/posts/provider-icon";

type AccountOption = {
  id: string;
  accountName: string;
  provider: string;
  status: string;
};

type Post = {
  id: string;
  scheduledAt: string | null;
  status: string;
  createdAt: string;
  targets?: { socialAccountId: string; socialAccount?: { provider: string } }[];
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
  const [range, setRange] = useState<"7" | "30" | "all">("30");

  const accountOptions = useMemo(() => {
    if (platform === "ALL") return accounts;
    return accounts.filter((a) => a.provider === platform);
  }, [accounts, platform]);

  // Platform değişince geçersiz hesap seçimini sıfırla
  const effectiveAccountId =
    accountId !== "ALL" && accountOptions.some((a) => a.id === accountId)
      ? accountId
      : "ALL";

  const since = useMemo(() => {
    if (range === "all") return new Date(0);
    return subDays(new Date(), Number(range));
  }, [range]);

  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((s) => {
      if (platform !== "ALL" && s.provider !== platform) return false;
      if (effectiveAccountId !== "ALL" && s.accountId !== effectiveAccountId) return false;
      return isAfter(new Date(s.capturedAt), since);
    });
  }, [snapshots, platform, effectiveAccountId, since]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const d = new Date(p.scheduledAt || p.createdAt);
      if (!isAfter(d, since)) return false;
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
  }, [posts, since, platform, effectiveAccountId]);

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

  const totals = useMemo(() => {
    return {
      followers: latestByAccount.reduce((s, x) => s + x.followers, 0),
      following: latestByAccount.reduce((s, x) => s + x.following, 0),
      impressions: latestByAccount.reduce((s, x) => s + x.impressions, 0),
      reach: latestByAccount.reduce((s, x) => s + x.reach, 0),
      likes: latestByAccount.reduce((s, x) => s + x.likes, 0),
      comments: latestByAccount.reduce((s, x) => s + x.comments, 0),
      totalPosts: filteredPosts.length,
      accounts: latestByAccount.length || (effectiveAccountId !== "ALL" ? 1 : accountOptions.length),
    };
  }, [latestByAccount, filteredPosts.length, effectiveAccountId, accountOptions.length]);

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
      .slice(0, 40);
  }, [filteredSnapshots]);

  const selectedLabel =
    effectiveAccountId !== "ALL"
      ? accounts.find((a) => a.id === effectiveAccountId)?.accountName
      : platform !== "ALL"
        ? PLATFORM_LABEL[platform] || platform
        : "Tüm hesaplar";

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
            Performans
          </p>
          <h1 className="mt-1 font-display text-2xl font-medium tracking-tight text-ink-900">
            Analitik
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Platform ve hesap seçerek metrikleri filtreleyin · {selectedLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "7", label: "Son 7 gün" },
              { id: "30", label: "Son 30 gün" },
              { id: "all", label: "Tümü" },
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
        </div>
      </div>

      {/* Filtreler */}
      <div className="rounded-2xl border border-ink-200/70 bg-white/90 p-4 shadow-[var(--shadow-soft)]">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
              Platform
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
              Hesap
            </p>
            <select
              className="h-10 w-full max-w-md rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-800"
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
            {accountOptions.length === 0 ? (
              <p className="mt-2 text-xs text-ink-400">Bu platformda bağlı hesap yok.</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Metrik kartları */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Takipçi" value={totals.followers} hint="Son snapshot toplamı" />
        <Metric label="Takip edilen" value={totals.following} />
        <Metric label="Gösterim" value={totals.impressions} />
        <Metric label="Erişim" value={totals.reach} />
        <Metric label="Beğeni" value={totals.likes} />
        <Metric label="Yorum" value={totals.comments} />
        <Metric label="Gönderi" value={totals.totalPosts} hint="Filtrelenmiş aralık" />
        <Metric label="Hesap" value={totals.accounts} />
      </div>

      {/* Hesap kırılımı */}
      {latestByAccount.length > 0 ? (
        <div className="rounded-2xl border border-ink-200/70 bg-white/90 p-4 shadow-[var(--shadow-soft)]">
          <h2 className="text-sm font-semibold text-ink-900">Hesap özeti</h2>
          <p className="text-xs text-ink-500">Seçime göre son metrikler</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {latestByAccount.map((s) => (
              <button
                key={s.accountId}
                type="button"
                onClick={() => {
                  setPlatform(s.provider);
                  setAccountId(s.accountId);
                }}
                className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                  effectiveAccountId === s.accountId
                    ? "border-accent bg-sky-50/80"
                    : "border-ink-100 bg-ink-50/50 hover:border-ink-200"
                }`}
              >
                <ProviderIcon provider={s.provider} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-900">
                    {s.accountName}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-ink-400">
                    {PLATFORM_LABEL[s.provider] || s.provider}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-2 text-[11px] text-ink-600">
                    <span>{s.followers.toLocaleString("tr-TR")} takipçi</span>
                    <span>·</span>
                    <span>{s.impressions.toLocaleString("tr-TR")} gösterim</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <ChartCard title="Takipçi / Gösterim trendi">
          {followerTrend.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={followerTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5dce8" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={40} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="followers"
                  stroke="#1a78f5"
                  strokeWidth={2}
                  name="Takipçi"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Gösterim"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Günlük gönderi frekansı">
          {daily.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5dce8" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#1a78f5"
                  strokeWidth={2}
                  name="Gönderi"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Saatlik paylaşım yoğunluğu">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5dce8" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
              <Tooltip />
              <Bar dataKey="count" fill="#3399ff" name="Gönderi" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Haftalık dağılım">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5dce8" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} width={32} />
              <Tooltip />
              <Bar dataKey="count" fill="#1361e1" name="Gönderi" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Veri tablosu */}
      <Card>
        <Card.Header>
          <Card.Title>Snapshot listesi</Card.Title>
          <Card.Description>
            {tableRows.length} kayıt · platform / hesap / tarih filtresi uygulandı
          </Card.Description>
        </Card.Header>
        <Card.Content className="overflow-auto">
          {tableRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">
              Seçilen filtrede veri yok. Demo seed çalıştırdıysanız tarih aralığını genişletin.
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
                  <tr key={`${row.accountId}-${row.capturedAt}-${i}`} className="border-t border-separator/50">
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
          ? "border-accent bg-accent text-white"
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
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200/70 bg-gradient-to-br from-white to-ink-50/80 p-4 shadow-[var(--shadow-soft)]">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium tracking-tight text-ink-900 tabular-nums">
        {value.toLocaleString("tr-TR")}
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

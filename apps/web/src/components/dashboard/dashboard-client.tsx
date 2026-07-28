"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProviderIcon } from "@/components/posts/provider-icon";

type AccountStats = {
  id: string;
  accountName: string;
  provider: string;
  profilePicUrl: string | null;
  plannedCount: number;
  errorsCount: number;
  plannedUntil: Date | string | null;
};

type GroupStats = {
  id: string;
  name: string;
  plannedCount: number;
  idleCount: number;
  plannedUntil: Date | string | null;
};

type InboxStats = {
  id: string;
  accountName: string;
  provider: string;
  profilePicUrl: string | null;
  unreadCount: number;
};

type UpcomingPost = {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  targets: {
    socialAccount: { provider: string; accountName: string };
  }[];
};

type RecentPost = {
  id: string;
  content: string;
  status: string;
  updatedAt: string;
  targets: {
    socialAccount: { provider: string };
  }[];
};

type DashboardClientProps = {
  userName: string;
  role: string;
  summary: {
    queuedCount: number;
    deliveredCount: number;
    unscheduledCount: number;
    failedCount: number;
  };
  chartData: { date: string; count: number }[];
  accounts: AccountStats[];
  groups: GroupStats[];
  inboxes: InboxStats[];
  upcomingPosts: UpcomingPost[];
  recentPosts: RecentPost[];
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

export function DashboardClient({
  userName,
  role,
  summary,
  chartData,
  accounts,
  groups,
  inboxes,
  upcomingPosts,
  recentPosts,
}: DashboardClientProps) {
  const [filterType, setFilterType] = useState("current");

  const formatDate = (dateVal: Date | string | null) => {
    if (!dateVal) return "Zamanlanmadı";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "Zamanlanmadı";
    return d.toLocaleDateString("tr-TR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: "Taslak",
      SCHEDULED: "Zamanlandı",
      PENDING_REVIEW: "Onay bekliyor",
      PUBLISHED: "Yayınlandı",
      FAILED: "Başarısız",
      PARTIAL_FAILED: "Kısmi hata",
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: "bg-ink-100 text-ink-700",
      SCHEDULED: "bg-blue-100 text-blue-700",
      PENDING_REVIEW: "bg-amber-100 text-amber-700",
      PUBLISHED: "bg-green-100 text-green-700",
      FAILED: "bg-rose-100 text-rose-700",
      PARTIAL_FAILED: "bg-orange-100 text-orange-700",
    };
    return map[status] || "bg-ink-100 text-ink-700";
  };

  return (
    <div className="space-y-8 min-w-0 font-sans pb-12">
      {/* Üst Karşılama Alanı */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900">
            Hey, {userName} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Sosyal medya yayın akışınız, hesap performanslarınız ve gelen kutunuz tek ekranda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/posts"
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent/20 hover:bg-accent-600 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Gönderi Oluştur
          </Link>
        </div>
      </div>

      {/* Yayın Özet Kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Queued Posts */}
        <div className="rounded-2xl border border-ink-200/60 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-start gap-4">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/50 p-3 text-blue-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-500">Kuyruktaki Gönderiler</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-ink-900 tabular-nums">
              {summary.queuedCount}
            </p>
          </div>
        </div>

        {/* Delivered (30 Days) */}
        <div className="rounded-2xl border border-ink-200/60 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-start gap-4">
          <div className="rounded-xl bg-green-50 dark:bg-green-950/50 p-3 text-green-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-500">Gönderilen (Son 30 Gün)</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-ink-900 tabular-nums">
              {summary.deliveredCount}
            </p>
          </div>
        </div>

        {/* Unscheduled Posts */}
        <div className="rounded-2xl border border-ink-200/60 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-start gap-4">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/50 p-3 text-amber-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-500">Taslak / Bekleyen</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-ink-900 tabular-nums">
              {summary.unscheduledCount}
            </p>
          </div>
        </div>

        {/* Error Posts */}
        <div className="rounded-2xl border border-ink-200/60 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-start gap-4">
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 p-3 text-rose-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-500">Hatalı Gönderiler</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-ink-900 tabular-nums">
              {summary.failedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Hızlı Kısayol Linkleri */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Link
          href="/posts"
          className="flex flex-col items-center justify-center p-4 rounded-2xl border border-ink-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-accent/40 dark:hover:border-accent hover:bg-sky-50/20 dark:hover:bg-slate-800 text-center"
        >
          <span className="text-sm font-bold text-ink-900 dark:text-white">Gönderiler</span>
          <span className="text-[10px] text-ink-400 dark:text-slate-400 mt-0.5">Oluştur & Yönet</span>
        </Link>
        <Link
          href="/calendar"
          className="flex flex-col items-center justify-center p-4 rounded-2xl border border-ink-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-accent/40 dark:hover:border-accent hover:bg-sky-50/20 dark:hover:bg-slate-800 text-center"
        >
          <span className="text-sm font-bold text-ink-900 dark:text-white">Takvim</span>
          <span className="text-[10px] text-ink-400 dark:text-slate-400 mt-0.5">Haftalık Akış</span>
        </Link>
        <Link
          href="/accounts"
          className="flex flex-col items-center justify-center p-4 rounded-2xl border border-ink-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-accent/40 dark:hover:border-accent hover:bg-sky-50/20 dark:hover:bg-slate-800 text-center"
        >
          <span className="text-sm font-bold text-ink-900 dark:text-white">Hesaplar</span>
          <span className="text-[10px] text-ink-400 dark:text-slate-400 mt-0.5">{accounts.length} Bağlı Profil</span>
        </Link>
        <Link
          href="/analytics"
          className="flex flex-col items-center justify-center p-4 rounded-2xl border border-ink-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-accent/40 dark:hover:border-accent hover:bg-sky-50/20 dark:hover:bg-slate-800 text-center"
        >
          <span className="text-sm font-bold text-ink-900 dark:text-white">Analitik</span>
          <span className="text-[10px] text-ink-400 dark:text-slate-400 mt-0.5">Gösterim & Takipçi</span>
        </Link>
        <Link
          href="/inbox"
          className="flex flex-col items-center justify-center p-4 rounded-2xl border border-ink-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-accent/40 dark:hover:border-accent hover:bg-sky-50/20 dark:hover:bg-slate-800 text-center"
        >
          <span className="text-sm font-bold text-ink-900 dark:text-white">Mesajlar</span>
          <span className="text-[10px] text-ink-400 dark:text-slate-400 mt-0.5">Sosyal Gelen Kutusu</span>
        </Link>
        {role === "ADMIN" || role === "SYSTEM_ADMIN" ? (
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-ink-100 bg-ink-50/30 text-center">
            <span className="text-sm font-semibold text-ink-400">SocialMarka</span>
            <span className="text-[10px] text-ink-300 mt-0.5">Yönetici Yetkisi</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-ink-100 bg-ink-50/30 text-center">
            <span className="text-sm font-semibold text-ink-400">SocialMarka</span>
            <span className="text-[10px] text-ink-300 mt-0.5">Üye Yetkisi</span>
          </div>
        )}
      </div>

      {/* Yayınlama Trendleri Grafiği */}
      <section className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-950">Yayınlama Eğilimleri (Trendleri)</h2>
            <p className="text-xs text-ink-400">Son 30 günde gün başına başarılı yayınlanan gönderiler</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-500 font-medium">Filtre:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-xl border border-ink-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm focus:border-accent focus:outline-none"
            >
              <option value="current">Mevcut Dönem</option>
            </select>
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  fontSize: "12px",
                  color: "#1e293b",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Başarılı Yayınlanan"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#trendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* İki Sütunlu Detay Tabloları */}
      <div className="grid gap-8 xl:grid-cols-12">
        {/* Sol Sütun: Hesap ve Grup yayınları */}
        <div className="xl:col-span-8 space-y-6">
          {/* Hesap Bazlı Yayın Durumu */}
          <section className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-ink-950">Hesap Bazlı Yayın Durumu</h2>
              <Link href="/accounts" className="text-xs font-semibold text-accent hover:underline">
                Hesapları Yönet
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-ink-100 text-xs font-semibold text-ink-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Sosyal Hesap</th>
                    <th className="pb-3 text-center">Planlanan</th>
                    <th className="pb-3 text-center">Hata</th>
                    <th className="pb-3">Sonraki Planlama</th>
                    <th className="pb-3 pr-2 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-ink-400">
                        Bağlı sosyal hesap bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    accounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-ink-50/20 transition-all">
                        <td className="py-3.5 pl-2 flex items-center gap-3">
                          <div className="relative h-9 w-9 rounded-full bg-ink-100 flex items-center justify-center overflow-hidden border border-ink-200">
                            {acc.profilePicUrl ? (
                              <img
                                src={acc.profilePicUrl}
                                alt={acc.accountName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="font-semibold text-xs text-ink-500 uppercase">
                                {acc.accountName.slice(0, 2)}
                              </span>
                            )}
                            <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm border border-ink-100">
                              <ProviderIcon provider={acc.provider} size={13} />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink-900 truncate max-w-[200px]">
                              {acc.accountName}
                            </p>
                            <p className="text-[10px] text-ink-400 uppercase tracking-wider mt-0.5">
                              {PLATFORM_LABEL[acc.provider] || acc.provider}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 text-center font-semibold text-blue-600 tabular-nums">
                          {acc.plannedCount}
                        </td>
                        <td className="py-3.5 text-center font-semibold text-rose-500 tabular-nums">
                          {acc.errorsCount}
                        </td>
                        <td className="py-3.5 text-ink-500 text-xs">
                          {formatDate(acc.plannedUntil)}
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <Link
                            href="/posts"
                            className="rounded-lg bg-ink-100 hover:bg-accent hover:text-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition"
                          >
                            Gönderi Oluştur
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Grup Bazlı Yayın Durumu */}
          <section className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-ink-950">Grup Bazlı Yayın Durumu</h2>
              <span className="text-xs text-ink-400">{groups.length} aktif grup</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-ink-100 text-xs font-semibold text-ink-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Grup Adı</th>
                    <th className="pb-3 text-center">Planlanan</th>
                    <th className="pb-3 text-center">Boştaki Hesap</th>
                    <th className="pb-3 pr-2">Sonraki Planlama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {groups.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-ink-400">
                        Oluşturulmuş hesap grubu bulunmamaktadır.
                      </td>
                    </tr>
                  ) : (
                    groups.map((g) => (
                      <tr key={g.id} className="hover:bg-ink-50/20 transition-all">
                        <td className="py-3.5 pl-2 font-medium text-ink-900">{g.name}</td>
                        <td className="py-3.5 text-center font-semibold text-blue-600 tabular-nums">
                          {g.plannedCount}
                        </td>
                        <td className="py-3.5 text-center font-semibold text-amber-600 tabular-nums">
                          {g.idleCount}
                        </td>
                        <td className="py-3.5 pr-2 text-ink-500 text-xs">
                          {formatDate(g.plannedUntil)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sağ Sütun: Gelen Kutusu ve Ekstralar */}
        <div className="xl:col-span-4 space-y-6">
          {/* Sosyal Gelen Kutusu */}
          <section className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-ink-950">Sosyal Gelen Kutusu</h2>
              <Link href="/inbox" className="text-xs font-semibold text-accent hover:underline">
                Kutuya Git
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-ink-100 text-xs font-semibold text-ink-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Hesap Kutusu</th>
                    <th className="pb-3 pr-2 text-right">Okunmamış</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {inboxes.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-ink-400">
                        Aktif gelen kutusu bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    inboxes.map((inb) => (
                      <tr key={inb.id} className="hover:bg-ink-50/20 transition-all">
                        <td className="py-3 flex items-center gap-3 pl-2">
                          <div className="relative h-8 w-8 rounded-full bg-ink-100 flex items-center justify-center overflow-hidden border border-ink-200">
                            {inb.profilePicUrl ? (
                              <img
                                src={inb.profilePicUrl}
                                alt={inb.accountName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="font-semibold text-xs text-ink-500 uppercase">
                                {inb.accountName.slice(0, 2)}
                              </span>
                            )}
                            <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm border border-ink-100">
                              <ProviderIcon provider={inb.provider} size={11} />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink-900 truncate max-w-[130px]">
                              {inb.accountName}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 pr-2 text-right tabular-nums">
                          {inb.unreadCount > 0 ? (
                            <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                              {inb.unreadCount}
                            </span>
                          ) : (
                            <span className="text-ink-300 text-xs">0</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Eski Panelden Taşınan Kullanışlı Bölümler: Yaklaşan ve Son Gönderiler */}
      <div className="grid gap-8 xl:grid-cols-2">
        {/* Yaklaşan Yayınlar (7 Günlük Liste) */}
        <section className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-950">Yaklaşan Yayınlar</h2>
              <p className="text-xs text-ink-400">Önümüzdeki 7 günde zamanlanmış olanlar</p>
            </div>
            <Link href="/calendar" className="text-xs font-semibold text-accent hover:underline">
              Takvime Git
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingPosts.length === 0 ? (
              <div className="py-8 text-center text-sm text-ink-400 border border-dashed border-ink-200 rounded-xl">
                Önümüzdeki 7 gün için zamanlanmış gönderi yok.
              </div>
            ) : (
              upcomingPosts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-4 rounded-xl border border-ink-100 bg-ink-50/20 p-3.5 hover:border-ink-200 transition"
                >
                  <div className="flex -space-x-1.5 pt-1">
                    {p.targets.map((t, idx) => (
                      <ProviderIcon key={idx} provider={t.socialAccount.provider} size={18} />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-800 line-clamp-1">
                      {p.content || "Medya paylaşımı"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-ink-400">
                      <span>{formatDate(p.scheduledAt)}</span>
                      <span>•</span>
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${statusColor(p.status)}`}>
                        {statusLabel(p.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Son Gönderiler (Son Yapılan Paylaşımlar) */}
        <section className="rounded-2xl border border-ink-200/60 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-950">Güncel Gönderi Aktivitesi</h2>
              <p className="text-xs text-ink-400">En son işlem yapılan gönderileriniz</p>
            </div>
            <Link href="/posts" className="text-xs font-semibold text-accent hover:underline">
              Tüm Gönderiler
            </Link>
          </div>
          <div className="space-y-3">
            {recentPosts.length === 0 ? (
              <div className="py-8 text-center text-sm text-ink-400 border border-dashed border-ink-200 rounded-xl">
                Henüz sosyal medya gönderisi oluşturulmamış.
              </div>
            ) : (
              recentPosts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-4 rounded-xl border border-ink-100 bg-ink-50/20 p-3.5 hover:border-ink-200 transition"
                >
                  <div className="flex -space-x-1.5 pt-1">
                    {p.targets.map((t, idx) => (
                      <ProviderIcon key={idx} provider={t.socialAccount.provider} size={18} />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-800 line-clamp-1">
                      {p.content || "Medya paylaşımı"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-ink-400">
                      <span>Güncellendi: {formatDate(p.updatedAt)}</span>
                      <span>•</span>
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${statusColor(p.status)}`}>
                        {statusLabel(p.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

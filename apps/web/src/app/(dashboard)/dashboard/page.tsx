import Link from "next/link";
import { requireWorkspace, canAccessAdmin } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";
import { ProviderIcon } from "@/components/posts/provider-icon";

const PLATFORM_LABEL: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  YOUTUBE: "YouTube",
  X: "X",
  TIKTOK: "TikTok",
  PINTEREST: "Pinterest",
};

export default async function OverviewDashboardPage() {
  const { workspaceId, role, session } = await requireWorkspace();
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60_000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    postCounts,
    accounts,
    upcomingPosts,
    recentPosts,
    unreadInbox,
    recentInbox,
    failedTargets,
    membersCount,
    latestSnaps,
  ] = await Promise.all([
    prisma.post.groupBy({
      by: ["status"],
      where: { workspaceId },
      _count: true,
    }),
    prisma.socialAccount.findMany({
      where: { workspaceId },
      select: {
        id: true,
        accountName: true,
        provider: true,
        status: true,
        analyticsSnapshots: {
          orderBy: { capturedAt: "desc" },
          take: 1,
          select: { followers: true, impressions: true, likes: true },
        },
      },
      orderBy: { accountName: "asc" },
      take: 20,
    }),
    prisma.post.findMany({
      where: {
        workspaceId,
        status: { in: ["SCHEDULED", "PENDING_REVIEW"] },
        scheduledAt: { gte: now, lte: weekAhead },
      },
      select: {
        id: true,
        content: true,
        status: true,
        scheduledAt: true,
        targets: {
          select: {
            socialAccount: { select: { provider: true, accountName: true } },
          },
          take: 4,
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 6,
    }),
    prisma.post.findMany({
      where: { workspaceId },
      select: {
        id: true,
        content: true,
        status: true,
        updatedAt: true,
        targets: {
          select: { socialAccount: { select: { provider: true } } },
          take: 3,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.inboxConversation.count({
      where: { workspaceId, isRead: false },
    }),
    prisma.inboxConversation.findMany({
      where: { workspaceId },
      select: {
        id: true,
        senderName: true,
        lastMessage: true,
        lastMessageAt: true,
        isRead: true,
        type: true,
        socialAccount: { select: { provider: true, accountName: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 5,
    }),
    prisma.postTarget.count({
      where: {
        status: "FAILED",
        post: { workspaceId },
      },
    }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.socialAccount.findMany({
      where: { workspaceId },
      select: {
        analyticsSnapshots: {
          orderBy: { capturedAt: "desc" },
          take: 1,
          select: { followers: true, impressions: true, reach: true },
        },
      },
    }),
  ]);

  const statusMap = Object.fromEntries(
    postCounts.map((p) => [p.status, p._count])
  ) as Record<string, number>;

  const totals = {
    drafts: statusMap.DRAFT || 0,
    queued: statusMap.SCHEDULED || 0,
    published: statusMap.PUBLISHED || 0,
    failed: (statusMap.FAILED || 0) + (statusMap.PARTIAL_FAILED || 0),
    review: statusMap.PENDING_REVIEW || 0,
    accounts: accounts.length,
    connected: accounts.filter((a) => a.status === "CONNECTED").length,
    reauth: accounts.filter((a) => a.status === "REQUIRES_REAUTH").length,
    members: membersCount,
    unreadInbox,
    failedTargets,
    followers: latestSnaps.reduce(
      (s, a) => s + (a.analyticsSnapshots[0]?.followers || 0),
      0
    ),
    impressions: latestSnaps.reduce(
      (s, a) => s + (a.analyticsSnapshots[0]?.impressions || 0),
      0
    ),
  };

  const publishedThisMonth = await prisma.post.count({
    where: {
      workspaceId,
      status: "PUBLISHED",
      updatedAt: { gte: monthStart },
    },
  });

  const name = session.user?.name || "Merhaba";

  return (
    <div className="min-w-0 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
            Gösterge paneli
          </p>
          <h1 className="mt-1 font-display text-2xl font-medium tracking-tight text-ink-900">
            {name}, işte özetiniz
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Gönderiler, hesaplar, gelen kutusu, analitik ve takvim tek bakışta
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/posts"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm shadow-accent/20"
          >
            Yeni gönderi
          </Link>
          <Link
            href="/calendar"
            className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            Takvim
          </Link>
        </div>
      </div>

      {/* Ana metrikler */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Takipçi"
          value={totals.followers}
          href="/analytics"
          tone="brand"
        />
        <Stat
          label="Kuyruktaki gönderi"
          value={totals.queued}
          href="/posts"
          tone="warn"
        />
        <Stat
          label="Okunmamış mesaj"
          value={totals.unreadInbox}
          href="/inbox"
          tone="sky"
        />
        <Stat
          label="Başarısız hedef"
          value={totals.failedTargets}
          href="/admin"
          tone="danger"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <MiniStat label="Taslak" value={totals.drafts} />
        <MiniStat label="Onay bekleyen" value={totals.review} />
        <MiniStat label="Yayınlanan" value={totals.published} />
        <MiniStat label="Bu ay yayın" value={publishedThisMonth} />
        <MiniStat label="Bağlı hesap" value={totals.connected} />
        <MiniStat label="Ekip üyesi" value={totals.members} />
      </div>

      {/* Hızlı linkler */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLink href="/posts" title="Gönderiler" desc="Oluştur, düzenle, paylaş" />
        <QuickLink href="/calendar" title="Takvim" desc="Haftalık / aylık plan" />
        <QuickLink href="/accounts" title="Hesaplar" desc={`${totals.accounts} hesap · ${totals.reauth} yeniden bağlan`} />
        <QuickLink href="/analytics" title="Analitik" desc={`${totals.impressions.toLocaleString("tr-TR")} gösterim`} />
        <QuickLink href="/inbox" title="Gelen kutusu" desc={`${totals.unreadInbox} okunmamış`} />
        {canAccessAdmin(role) ? (
          <QuickLink href="/admin" title="Yönetim" desc="Ekip, kuyruk, metrikler" />
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Yaklaşan */}
        <section className="rounded-2xl border border-ink-200/70 bg-white/90 p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-medium text-ink-900">Yaklaşan yayınlar</h2>
              <p className="text-xs text-ink-500">Önümüzdeki 7 gün</p>
            </div>
            <Link href="/calendar" className="text-xs font-medium text-accent hover:underline">
              Takvime git
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {upcomingPosts.length === 0 ? (
              <li className="text-sm text-ink-400">Zamanlanmış gönderi yok.</li>
            ) : (
              upcomingPosts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start gap-3 rounded-xl border border-ink-100 bg-ink-50/40 px-3 py-2.5"
                >
                  <div className="flex -space-x-1 pt-0.5">
                    {p.targets.map((t, i) => (
                      <ProviderIcon
                        key={i}
                        provider={t.socialAccount.provider}
                        size={18}
                      />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">
                      {p.content.slice(0, 80)}
                      {p.content.length > 80 ? "…" : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      {p.scheduledAt
                        ? new Date(p.scheduledAt).toLocaleString("tr-TR")
                        : "—"}{" "}
                      · {statusLabel(p.status)}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Inbox */}
        <section className="rounded-2xl border border-ink-200/70 bg-white/90 p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-medium text-ink-900">Gelen kutusu</h2>
              <p className="text-xs text-ink-500">Son konuşmalar</p>
            </div>
            <Link href="/inbox" className="text-xs font-medium text-accent hover:underline">
              Tümü
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {recentInbox.length === 0 ? (
              <li className="text-sm text-ink-400">Mesaj yok.</li>
            ) : (
              recentInbox.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl border border-ink-100 bg-ink-50/40 px-3 py-2.5"
                >
                  <ProviderIcon provider={c.socialAccount.provider} size={22} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink-800">{c.senderName}</p>
                      {!c.isRead ? (
                        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                          Yeni
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-500">{c.lastMessage}</p>
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      {PLATFORM_LABEL[c.socialAccount.provider] || c.socialAccount.provider} ·{" "}
                      {new Date(c.lastMessageAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Hesaplar */}
        <section className="rounded-2xl border border-ink-200/70 bg-white/90 p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-medium text-ink-900">Bağlı hesaplar</h2>
              <p className="text-xs text-ink-500">Son takipçi / gösterim</p>
            </div>
            <Link href="/accounts" className="text-xs font-medium text-accent hover:underline">
              Yönet
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {accounts.length === 0 ? (
              <li className="text-sm text-ink-400">Henüz hesap yok.</li>
            ) : (
              accounts.slice(0, 8).map((a) => {
                const snap = a.analyticsSnapshots[0];
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl border border-ink-100 px-3 py-2"
                  >
                    <ProviderIcon provider={a.provider} size={24} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-800">{a.accountName}</p>
                      <p className="text-[11px] text-ink-400">
                        {PLATFORM_LABEL[a.provider] || a.provider} · {accountStatusLabel(a.status)}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-ink-500">
                      <div className="tabular-nums font-medium text-ink-800">
                        {(snap?.followers || 0).toLocaleString("tr-TR")}
                      </div>
                      <div>takipçi</div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        {/* Son gönderiler */}
        <section className="rounded-2xl border border-ink-200/70 bg-white/90 p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-medium text-ink-900">Son gönderiler</h2>
              <p className="text-xs text-ink-500">Güncel aktivite</p>
            </div>
            <Link href="/posts" className="text-xs font-medium text-accent hover:underline">
              Tümü
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {recentPosts.length === 0 ? (
              <li className="text-sm text-ink-400">Gönderi yok.</li>
            ) : (
              recentPosts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start gap-3 rounded-xl border border-ink-100 bg-ink-50/40 px-3 py-2.5"
                >
                  <div className="flex -space-x-1 pt-0.5">
                    {p.targets.map((t, i) => (
                      <ProviderIcon key={i} provider={t.socialAccount.provider} size={18} />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">
                      {p.content.slice(0, 70)}
                      {p.content.length > 70 ? "…" : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      {statusLabel(p.status)} ·{" "}
                      {new Date(p.updatedAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  tone: "brand" | "warn" | "sky" | "danger";
}) {
  const tones = {
    brand: "from-brand-50 to-white border-brand-200/70",
    warn: "from-amber-50 to-white border-amber-200/70",
    sky: "from-sky-50 to-white border-sky-200/70",
    danger: "from-rose-50 to-white border-rose-200/70",
  };
  return (
    <Link
      href={href}
      className={`block rounded-2xl border bg-gradient-to-br p-4 shadow-[var(--shadow-soft)] transition hover:scale-[1.01] ${tones[tone]}`}
    >
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-medium tracking-tight text-ink-900 tabular-nums">
        {value.toLocaleString("tr-TR")}
      </p>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-ink-200/70 bg-white/90 px-3 py-3 text-center shadow-[var(--shadow-soft)]">
      <p className="font-display text-xl font-medium tabular-nums text-ink-900">
        {value.toLocaleString("tr-TR")}
      </p>
      <p className="mt-0.5 text-[11px] text-ink-500">{label}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-ink-200/70 bg-white/90 px-4 py-3 shadow-[var(--shadow-soft)] transition hover:border-accent/40 hover:bg-sky-50/40"
    >
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      <p className="mt-0.5 text-xs text-ink-500">{desc}</p>
    </Link>
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: "Taslak",
    SCHEDULED: "Zamanlandı",
    PENDING_REVIEW: "Onay bekliyor",
    PUBLISHED: "Yayınlandı",
    FAILED: "Başarısız",
    PARTIAL_FAILED: "Kısmi hata",
  };
  return map[status] || status;
}

function accountStatusLabel(status: string) {
  if (status === "CONNECTED") return "Bağlı";
  if (status === "REQUIRES_REAUTH") return "Yeniden bağlan";
  return "Kopuk";
}

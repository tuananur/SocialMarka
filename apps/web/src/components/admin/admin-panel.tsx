"use client";

import { useState } from "react";
import { Alert, Button, Card, Chip, Input } from "@heroui/react";

export type AdminSection = "metrics" | "workspaces" | "team" | "queues" | "audit";

type Metrics = {
  totalUsers: number;
  totalWorkspaces: number;
  totalSocialAccounts: number;
  totalPublishedPosts: number;
  totalQueuedPosts: number;
  totalFailedPosts: number;
};

type WorkspaceRow = {
  id: string;
  name: string;
  isActive: boolean;
  members: number;
  accounts: number;
  postsThisMonth: number;
  totalPosts: number;
};

type QueueStat = {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
};

type Audit = {
  id: string;
  action: string;
  createdAt: string;
  user: { name: string | null; email: string };
  workspace: { name: string };
  details: unknown;
};

type Member = {
  id: string;
  role: string;
  userId: string;
  user: { id: string; name: string | null; email: string; image: string | null };
};

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Yönetici" },
  { value: "MEMBER", label: "Editör" },
  { value: "VIEWER", label: "İzleyici" },
] as const;

const TITLES: Record<AdminSection, { title: string; desc: string }> = {
  metrics: {
    title: "Sistem metrikleri",
    desc: "Kullanıcı, hesap, gönderi sayaçları ve platform kırılımı",
  },
  workspaces: {
    title: "Müşteri & Marka (Workspace)",
    desc: "Ajans müşterilerini listele, ekle veya pasife al",
  },
  team: {
    title: "Ekip & Roller (RBAC)",
    desc: "SYSTEM_ADMIN / ADMIN tam erişim · MEMBER editör · VIEWER salt okunur",
  },
  queues: {
    title: "Kuyruk izleme (BullMQ)",
    desc: "publish, media, analytics, webhook, token-refresh yükü",
  },
  audit: {
    title: "İşlem geçmişi (Audit)",
    desc: "Kim ne zaman ne yaptı — log kayıtları",
  },
};

export function AdminPanel({
  section,
  metrics: initialMetrics,
  platformBreakdown: initialPlatform,
  workspaces: initialWorkspaces,
  queueStats: initialQueues,
  auditLogs: initialAudits,
  members: initialMembers,
  currentUserId,
  isSystemAdmin,
}: {
  section: AdminSection;
  metrics: Metrics;
  platformBreakdown: { provider: string; count: number }[];
  workspaces: WorkspaceRow[];
  queueStats: QueueStat[];
  auditLogs: Audit[];
  members: Member[];
  currentUserId: string;
  isSystemAdmin: boolean;
}) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [platformBreakdown, setPlatformBreakdown] = useState(initialPlatform);
  const [queueStats, setQueueStats] = useState(initialQueues);
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [members, setMembers] = useState(initialMembers);
  const [auditLogs, setAuditLogs] = useState(initialAudits);
  const [newName, setNewName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const meta = TITLES[section];

  async function refreshMetrics() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/metrics");
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Metrikler yüklenemedi");
        return;
      }
      setMetrics(data.metrics);
      setPlatformBreakdown(data.platformBreakdown || []);
      setQueueStats(data.queueStats || []);
      setMessage("Yenilendi.");
    } finally {
      setBusy(false);
    }
  }

  async function createWorkspace() {
    if (!newName.trim()) return;
    const res = await fetch("/api/admin/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Oluşturulamadı");
      return;
    }
    setWorkspaces((prev) => [
      {
        id: data.workspace.id,
        name: data.workspace.name,
        isActive: true,
        members: 1,
        accounts: 0,
        postsThisMonth: 0,
        totalPosts: 0,
      },
      ...prev,
    ]);
    setNewName("");
    setMessage("Workspace oluşturuldu.");
  }

  async function toggleWorkspace(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/workspaces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Güncellenemedi");
      return;
    }
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isActive: !isActive } : w))
    );
    setMessage(!isActive ? "Aktifleştirildi." : "Pasife alındı.");
  }

  async function retryFailed(scope: "workspace" | "all" = "workspace") {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/retry-failed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      const data = await res.json();
      setMessage(data.message || data.error || "Tamamlandı.");
      await refreshMetrics();
    } finally {
      setBusy(false);
    }
  }

  async function inviteMember() {
    if (!inviteEmail.trim()) return;
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Üye eklenemedi");
      return;
    }
    setMembers((prev) => [...prev, data.member]);
    setInviteEmail("");
    setMessage("Üye eklendi.");
  }

  async function changeRole(memberId: string, role: string) {
    const res = await fetch(`/api/admin/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Rol güncellenemedi");
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === memberId ? data.member : m)));
    setMessage("Rol güncellendi.");
  }

  async function removeMember(memberId: string) {
    const res = await fetch(`/api/admin/members/${memberId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Üye çıkarılamadı");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    setMessage("Üye çıkarıldı.");
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
            Admin paneli
          </p>
          <h1 className="mt-1 font-display text-2xl font-medium tracking-tight text-ink-900">
            {meta.title}
          </h1>
          <p className="mt-1 text-sm text-ink-500">{meta.desc}</p>
        </div>
        {(section === "metrics" || section === "queues") && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" isDisabled={busy} onPress={refreshMetrics}>
              Yenile
            </Button>
            {section === "queues" ? (
              <>
                <Button
                  variant="danger-soft"
                  isDisabled={busy}
                  onPress={() => retryFailed("workspace")}
                >
                  Başarısızları Yeniden Dene
                </Button>
                {isSystemAdmin ? (
                  <Button variant="ghost" isDisabled={busy} onPress={() => retryFailed("all")}>
                    Tüm Sistem
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        )}
      </div>

      {message ? (
        <Alert status="accent">
          <Alert.Content>
            <Alert.Description>{message}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {section === "metrics" ? (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Metric label="Toplam Kullanıcı" value={metrics.totalUsers} tone="brand" />
            <Metric label="Toplam Workspace" value={metrics.totalWorkspaces} tone="ink" />
            <Metric label="Bağlı Hesap" value={metrics.totalSocialAccounts} tone="sky" />
            <Metric label="Yayınlanan Gönderi" value={metrics.totalPublishedPosts} tone="success" />
            <Metric label="Kuyruktaki Gönderi" value={metrics.totalQueuedPosts} tone="warn" />
            <Metric label="Başarısız Gönderi" value={metrics.totalFailedPosts} tone="danger" />
          </div>
          <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-[var(--shadow-soft)]">
            <h3 className="text-sm font-semibold text-ink-900">Platform kırılımı</h3>
            <p className="text-xs text-ink-500">Aktif bağlı hesap dağılımı</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {platformBreakdown.length === 0 ? (
                <span className="text-sm text-ink-400">Henüz bağlı hesap yok.</span>
              ) : null}
              {platformBreakdown.map((p) => (
                <span
                  key={p.provider}
                  className="inline-flex items-center gap-2 rounded-xl border border-ink-100 bg-ink-50/80 px-3 py-1.5 text-sm"
                >
                  <span className="font-medium text-ink-800">{p.provider}</span>
                  <span className="rounded-md bg-white px-1.5 py-0.5 text-xs font-semibold text-accent tabular-nums">
                    {p.count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {section === "workspaces" ? (
        <Card>
          <Card.Header className="flex flex-wrap items-end justify-between gap-3">
            <Card.Title>Workspace listesi</Card.Title>
            {isSystemAdmin ? (
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Yeni ajans / marka adı"
                />
                <Button variant="primary" onPress={createWorkspace}>
                  Ekle
                </Button>
              </div>
            ) : null}
          </Card.Header>
          <Card.Content className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="py-2 pr-4">Ad</th>
                  <th className="py-2 pr-4">Üye</th>
                  <th className="py-2 pr-4">Hesap</th>
                  <th className="py-2 pr-4">Bu Ay</th>
                  <th className="py-2 pr-4">Durum</th>
                  <th className="py-2">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((w) => (
                  <tr key={w.id} className="border-t border-separator/50">
                    <td className="py-2 pr-4 font-medium">{w.name}</td>
                    <td className="py-2 pr-4">{w.members}</td>
                    <td className="py-2 pr-4">{w.accounts}</td>
                    <td className="py-2 pr-4">{w.postsThisMonth}</td>
                    <td className="py-2 pr-4">
                      <Chip size="sm" color={w.isActive ? "success" : "default"} variant="soft">
                        <Chip.Label>{w.isActive ? "Aktif" : "Pasif"}</Chip.Label>
                      </Chip>
                    </td>
                    <td className="py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => toggleWorkspace(w.id, w.isActive)}
                      >
                        {w.isActive ? "Pasife Al" : "Aktifleştir"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card.Content>
        </Card>
      ) : null}

      {section === "team" ? (
        <Card>
          <Card.Header className="flex flex-wrap items-end justify-between gap-3">
            <Card.Title>Üyeler</Card.Title>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="uye@email.com"
                className="min-w-[12rem]"
              />
              <select
                className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <Button variant="primary" onPress={inviteMember}>
                Üye Ekle
              </Button>
            </div>
          </Card.Header>
          <Card.Content className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="py-2 pr-4">Kullanıcı</th>
                  <th className="py-2 pr-4">E-posta</th>
                  <th className="py-2 pr-4">Rol</th>
                  <th className="py-2">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const isSelf = m.userId === currentUserId;
                  const locked = m.role === "SYSTEM_ADMIN" && !isSystemAdmin;
                  return (
                    <tr key={m.id} className="border-t border-separator/50">
                      <td className="py-2 pr-4 font-medium">
                        {m.user.name || "—"}
                        {isSelf ? (
                          <span className="ml-2 text-[11px] text-ink-400">(siz)</span>
                        ) : null}
                      </td>
                      <td className="py-2 pr-4 text-ink-600">{m.user.email}</td>
                      <td className="py-2 pr-4">
                        {locked || isSelf ? (
                          <Chip size="sm" variant="soft">
                            <Chip.Label>{roleLabel(m.role)}</Chip.Label>
                          </Chip>
                        ) : (
                          <select
                            className="h-9 rounded-lg border border-ink-200 bg-white px-2 text-sm"
                            value={m.role}
                            onChange={(e) => changeRole(m.id, e.target.value)}
                          >
                            {isSystemAdmin ? (
                              <option value="SYSTEM_ADMIN">Sistem Yöneticisi</option>
                            ) : null}
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-2">
                        {!isSelf && !locked ? (
                          <Button variant="ghost" size="sm" onPress={() => removeMember(m.id)}>
                            Çıkar
                          </Button>
                        ) : (
                          <span className="text-xs text-ink-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card.Content>
        </Card>
      ) : null}

      {section === "queues" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {queueStats.length === 0 ? (
            <p className="text-sm text-muted">Redis bağlantısı yok veya kuyruk boş.</p>
          ) : null}
          {queueStats.map((q) => (
            <Card key={q.name}>
              <Card.Header>
                <Card.Title className="text-sm">{q.name}</Card.Title>
              </Card.Header>
              <Card.Content className="grid grid-cols-2 gap-1 text-xs text-muted">
                <span>Bekleyen: {q.waiting}</span>
                <span>Aktif: {q.active}</span>
                <span>Gecikmeli: {q.delayed}</span>
                <span>Başarısız: {q.failed}</span>
                <span>Tamamlanan: {q.completed}</span>
              </Card.Content>
            </Card>
          ))}
        </div>
      ) : null}

      {section === "audit" ? (
        <Card>
          <Card.Content className="max-h-[32rem] space-y-2 overflow-auto">
            {auditLogs.length === 0 ? <p className="text-sm text-muted">Kayıt yok.</p> : null}
            {auditLogs.map((log) => (
              <div key={log.id} className="border-b border-separator/50 py-2 text-sm">
                <div className="font-medium">{actionLabel(log.action)}</div>
                <div className="text-xs text-muted">
                  {log.user.name || log.user.email} · {log.workspace.name} ·{" "}
                  {new Date(log.createdAt).toLocaleString("tr-TR")}
                </div>
              </div>
            ))}
          </Card.Content>
        </Card>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: number;
  tone?: "brand" | "ink" | "sky" | "success" | "warn" | "danger";
}) {
  const accents: Record<string, string> = {
    brand: "from-brand-50 to-white border-brand-200/70",
    ink: "from-ink-50 to-white border-ink-200/70",
    sky: "from-sky-50 to-white border-sky-200/70",
    success: "from-emerald-50 to-white border-emerald-200/70",
    warn: "from-amber-50 to-white border-amber-200/70",
    danger: "from-rose-50 to-white border-rose-200/70",
  };
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-4 shadow-[var(--shadow-soft)] ${accents[tone]}`}
    >
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-medium tracking-tight text-ink-900 tabular-nums">
        {value.toLocaleString("tr-TR")}
      </p>
    </div>
  );
}

function roleLabel(role: string) {
  switch (role) {
    case "SYSTEM_ADMIN":
      return "Sistem Yöneticisi";
    case "ADMIN":
      return "Yönetici";
    case "MEMBER":
      return "Editör";
    case "VIEWER":
      return "İzleyici";
    default:
      return role;
  }
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    POST_CREATED: "Gönderi oluşturuldu",
    POST_UPDATED: "Gönderi güncellendi",
    POST_DELETED: "Gönderi silindi",
    POST_SHARE_NOW: "Hemen paylaşım tetiklendi",
    ACCOUNT_CONNECTED: "Hesap bağlandı",
    ACCOUNT_DISCONNECTED: "Hesap bağlantısı kesildi",
    WORKSPACE_CREATED: "Workspace oluşturuldu",
    WORKSPACE_ACTIVATED: "Workspace aktifleştirildi",
    WORKSPACE_DEACTIVATED: "Workspace pasife alındı",
    ROLE_CHANGED: "Rol değiştirildi",
    MEMBER_ADDED: "Üye eklendi",
    MEMBER_REMOVED: "Üye çıkarıldı",
    RETRY_FAILED: "Başarısız gönderiler yeniden denendi",
  };
  return map[action] || action;
}

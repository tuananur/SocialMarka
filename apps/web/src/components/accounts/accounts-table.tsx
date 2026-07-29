"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProviderIcon } from "@/components/posts/provider-icon";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Account = {
  id: string;
  accountName: string;
  provider: string;
  providerAccountId: string;
  status: string;
  lastConnectedBy: string | null;
  profilePicUrl?: string | null;
  groups: { name: string }[];
  createdAt: string;
};

const PLATFORM_ORDER = [
  "FACEBOOK",
  "INSTAGRAM",
  "LINKEDIN",
  "YOUTUBE",
  "X",
  "TIKTOK",
  "PINTEREST",
] as const;

const PLATFORM_LABEL: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  YOUTUBE: "YouTube",
  X: "X",
  TIKTOK: "TikTok",
  PINTEREST: "Pinterest",
};

export function AccountsTable({
  accounts: initial,
  memberCount,
  canManage,
  accountLimit = 50,
}: {
  accounts: Account[];
  memberCount: number;
  canManage: boolean;
  accountLimit?: number;
}) {
  const search = useSearchParams();
  const router = useRouter();
  const [accounts, setAccounts] = useState(initial);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const [groups, setGroups] = useState<any[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupAccounts, setGroupAccounts] = useState<string[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      const res = await fetch("/api/accounts/groups");
      const data = await res.json();
      if (res.ok) setGroups(data.groups || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSaveGroup() {
    if (!groupName.trim()) return;
    setBusy(true);
    try {
      const url = editingGroupId ? `/api/accounts/groups/${editingGroupId}` : "/api/accounts/groups";
      const method = editingGroupId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, accountIds: groupAccounts }),
      });
      if (res.ok) {
        setIsGroupModalOpen(false);
        setGroupName("");
        setGroupAccounts([]);
        setEditingGroupId(null);
        await fetchGroups();
        router.refresh();
      } else {
        const d = await res.json();
        alert(d.error || "Grup kaydedilemedi");
      }
    } catch (err: any) {
      alert(err?.message || "Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm("Bu grubu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/accounts/groups/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchGroups();
        router.refresh();
      }
    } catch (err: any) {
      alert(err?.message || "Silme hatası");
    }
  }

  useEffect(() => {
    const ok =
      search.get("status") === "success" || search.get("connected") === "1";
    if (!ok) return;
    const provider = (search.get("provider") || "").toUpperCase();
    const name = search.get("name") || PLATFORM_LABEL[provider] || provider;
    const label = PLATFORM_LABEL[provider] || provider;
    setBanner({
      title: `${label} bağlandı`,
      description: `“${name}” çalışma alanına eklendi.`,
    });
    router.replace("/accounts", { scroll: false });
  }, [search, router]);

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 8000);
    return () => window.clearTimeout(t);
  }, [banner]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.accountName.toLowerCase().includes(q) ||
        a.provider.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    );
  }, [accounts, query]);

  const connectedCount = accounts.filter((a) => a.status === "CONNECTED").length;

  const byProvider = useMemo(() => {
    const map = new Map<string, Account[]>();
    for (const a of accounts) {
      if (a.status === "DISCONNECTED") continue;
      const list = map.get(a.provider) || [];
      list.push(a);
      map.set(a.provider, list);
    }
    return map;
  }, [accounts]);

  async function confirmDisconnect() {
    if (!disconnectId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/accounts/${disconnectId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== disconnectId));
        setSelected((prev) => prev.filter((id) => id !== disconnectId));
      } else {
        alert(data.error || "Hesap bağlantısı kesilirken bir hata oluştu.");
      }
    } catch (err: any) {
      alert(err?.message || "Hesap silme hatası oluştu.");
    } finally {
      setBusy(false);
      setDisconnectId(null);
    }
  }

  function toggleAll() {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((a) => a.id));
  }

  return (
    <div className="space-y-4">
      {banner ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          <div>
            <p className="text-sm font-semibold">{banner.title}</p>
            <p className="mt-0.5 text-sm opacity-90">{banner.description}</p>
          </div>
          <button
            type="button"
            className="shrink-0 text-sm opacity-60 hover:opacity-100"
            onClick={() => setBanner(null)}
          >
            ✕
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink-200/80 pb-3">
        <div>
          <h1 className="relative inline-block font-display text-2xl font-medium tracking-tight text-ink-900">
            Hesaplar
            <span className="absolute inset-x-0 -bottom-3 h-[3px] rounded-full bg-amber-400" />
          </h1>
          <p className="mt-4 text-sm text-ink-500">
            Platform hesaplarını bağla, gruplara ayır ve gönderilerde kullan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700">
            {connectedCount}/{accountLimit} hesap bağlı
          </span>
          {canManage ? (
            <Link
              href="/accounts/create"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-accent/25 hover:opacity-95"
            >
              + Hesap Bağla
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {PLATFORM_ORDER.map((p) => {
          const list = byProvider.get(p) || [];
          const linked = list.length > 0;
          return (
            <div
              key={p}
              className={`rounded-xl border px-3 py-2.5 ${
                linked ? "border-emerald-200 bg-emerald-50/70" : "border-ink-100 bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <ProviderIcon provider={p} size={20} />
                <span className="text-xs font-semibold text-ink-800">{PLATFORM_LABEL[p]}</span>
              </div>
              {linked ? (
                <>
                  <p className="mt-1.5 truncate text-[11px] font-medium text-ink-700">
                    {list[0].accountName}
                    {list.length > 1 ? ` +${list.length - 1}` : ""}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    ● Bağlı
                  </p>
                </>
              ) : (
                <p className="mt-1.5 text-[11px] text-ink-400">Bağlı değil</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Gruplar Bölümü */}
      <div className="rounded-2xl border border-ink-200/60 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink-800">Hesap Grupları</h2>
          {canManage && (
            <button
              onClick={() => {
                setEditingGroupId(null);
                setGroupName("");
                setGroupAccounts([]);
                setIsGroupModalOpen(true);
              }}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              + Yeni Grup Oluştur
            </button>
          )}
        </div>
        {groups.length === 0 ? (
          <p className="text-xs text-ink-400">Henüz bir hesap grubu oluşturulmamış.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-2 rounded-xl border border-ink-150 bg-ink-50/50 px-3 py-1.5 text-xs font-semibold text-ink-700"
              >
                <span>{g.name} ({g.accounts.length} hesap)</span>
                {canManage && (
                  <div className="flex items-center gap-1 border-l border-ink-200 pl-1.5">
                    <button
                      onClick={() => {
                        setEditingGroupId(g.id);
                        setGroupName(g.name);
                        setGroupAccounts(g.accounts.map((a: any) => a.id));
                        setIsGroupModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(g.id)}
                      className="text-rose-600 hover:text-rose-800"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hesap ara…"
          className="w-full max-w-xs rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <p className="text-xs text-ink-400">
          1 — {filtered.length} / {accounts.length}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-200/80 bg-white shadow-[var(--shadow-soft)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-[#fafbfc] dark:bg-ink-50 dark:border-ink-800 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.length === filtered.length}
                    onChange={toggleAll}
                    className="h-4 w-4"
                  />
                </th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Hesap Adı</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Ekip</th>
                <th className="px-4 py-3">Gruplar</th>
                <th className="px-4 py-3">Son Bağlayan</th>
                {canManage ? <th className="px-4 py-3">İşlem</th> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 8 : 7}
                    className="px-4 py-14 text-center text-ink-400"
                  >
                    Henüz bağlı hesap yok.{" "}
                    <Link href="/accounts/create" className="font-semibold text-accent underline">
                      Hesap Bağla
                    </Link>
                  </td>
                </tr>
              ) : null}
              {filtered.map((a) => {
                const needsReauth = a.status === "REQUIRES_REAUTH";
                return (
                  <tr key={a.id} className="border-b border-ink-100/80 hover:bg-ink-50/40">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(a.id)}
                        onChange={() =>
                          setSelected((prev) =>
                            prev.includes(a.id)
                              ? prev.filter((id) => id !== a.id)
                              : [...prev, a.id]
                          )
                        }
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-500">
                      {a.providerAccountId.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {a.profilePicUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.profilePicUrl}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <ProviderIcon provider={a.provider} size={22} />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-ink-900">{a.accountName}</p>
                          <p className="text-[11px] text-ink-400">
                            {PLATFORM_LABEL[a.provider] || a.provider}
                          </p>
                        </div>
                        {needsReauth ? (
                          <a
                            href={`/api/accounts/oauth/${a.provider.toLowerCase()}?type=page`}
                            className="rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white"
                          >
                            Yeniden Bağlan
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {a.status === "DISCONNECTED" ? (
                        <span className="inline-flex rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                          Kopuk
                        </span>
                      ) : needsReauth ? (
                        <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          Yeniden yetkilendir
                        </span>
                      ) : (
                        <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          Bağlı
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-accent">{memberCount}</td>
                    <td className="px-4 py-3 text-ink-500">
                      {a.groups.map((g) => g.name).join(", ") || "0"}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{a.lastConnectedBy || "—"}</td>
                    {canManage ? (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setDisconnectId(a.id)}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          Bağlantıyı Kes
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!disconnectId}
        title="Bağlantıyı kes"
        description="Bu sosyal hesap workspace’ten kaldırılacak."
        confirmLabel="Bağlantıyı kes"
        danger
        busy={busy}
        onConfirm={() => void confirmDisconnect()}
        onCancel={() => setDisconnectId(null)}
      />

      {/* Group Modal Dialog */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-ink-950">
              {editingGroupId ? "Grubu Düzenle" : "Yeni Grup Oluştur"}
            </h3>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-ink-600">Grup Adı</label>
              <input
                type="text"
                placeholder="Örn: Pazarlama Grubu"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
              />
              
              <label className="block text-xs font-semibold text-ink-600 mt-2">Hesapları Seçin</label>
              <div className="max-h-48 overflow-y-auto border border-ink-150 rounded-xl p-2 space-y-2">
                {accounts.length === 0 ? (
                  <p className="text-xs text-ink-400 p-2">Grup eklemek için önce en az bir hesap bağlamalısınız.</p>
                ) : (
                  accounts.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer p-1 hover:bg-ink-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={groupAccounts.includes(a.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGroupAccounts((prev) => [...prev, a.id]);
                          } else {
                            setGroupAccounts((prev) => prev.filter((id) => id !== a.id));
                          }
                        }}
                      />
                      <ProviderIcon provider={a.provider} size={16} />
                      <span>{a.accountName}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
              >
                İptal
              </button>
              <button
                onClick={handleSaveGroup}
                disabled={busy || !groupName.trim()}
                className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

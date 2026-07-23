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

  useEffect(() => {
    const ok =
      search.get("status") === "success" || search.get("connected") === "1";
    if (!ok) return;
    const provider = (search.get("provider") || "").toUpperCase();
    const name = search.get("name") || PLATFORM_LABEL[provider] || provider;
    const label = PLATFORM_LABEL[provider] || provider;
    setBanner({
      title: `${label} connected`,
      description: `“${name}” was added to your workspace.`,
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
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== disconnectId));
        setSelected((prev) => prev.filter((id) => id !== disconnectId));
      }
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
            API’siz bağla, marka grubuna ekle, Gönderiler’de kullan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700">
            {connectedCount}/{accountLimit} Accounts Connected
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
            <thead className="border-b border-ink-100 bg-[#fafbfc] text-[11px] font-semibold uppercase tracking-wide text-ink-500">
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
    </div>
  );
}

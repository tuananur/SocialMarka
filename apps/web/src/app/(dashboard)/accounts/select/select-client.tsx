"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Avatar } from "@heroui/react";

type TempAccount = {
  providerAccountId: string;
  accountName: string;
  profilePicUrl?: string;
};

export function SelectAccountsClient({
  list,
  provider,
}: {
  list: TempAccount[];
  provider: string;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    list.map((a) => a.providerAccountId) // select all by default
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const label = provider.toUpperCase() === "INSTAGRAM" ? "Instagram" : "Facebook";

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleImport = async () => {
    if (selectedIds.length === 0) {
      setError("Lütfen içe aktarmak için en az bir hesap seçin.");
      return;
    }
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/accounts/import-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedIds }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push(
          `/accounts?status=success&provider=${provider}&name=${encodeURIComponent(
            selectedIds.length > 1 ? `${selectedIds.length} hesap` : data.firstAccountName || "Hesap"
          )}`
        );
      } else {
        setError(data.error || "İçe aktarma sırasında bir hata oluştu.");
        setBusy(false);
      }
    } catch (err: any) {
      setError(err?.message || "Bağlantı hatası oluştu.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl py-10 px-4">
      <Card className="p-6 border border-ink-200 bg-white shadow-sm dark:bg-ink-50">
        <h1 className="text-xl font-bold text-ink-900 mb-2">
          {label} Hesaplarını İçe Aktarın
        </h1>
        <p className="text-sm text-ink-500 mb-6">
          Aşağıdaki listeden SocialMarka çalışma alanınıza bağlamak istediğiniz sayfaları/hesapları seçin.
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/30">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          {list.map((acc) => {
            const isChecked = selectedIds.includes(acc.providerAccountId);
            return (
              <div
                key={acc.providerAccountId}
                onClick={() => toggleSelect(acc.providerAccountId)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition cursor-pointer select-none ${
                  isChecked
                    ? "border-brand-500 bg-brand-50/10 dark:border-brand-400"
                    : "border-ink-200 bg-white hover:border-ink-300 dark:bg-ink-50 dark:border-ink-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-ink-200">
                    {acc.profilePicUrl ? (
                      <Avatar.Image src={acc.profilePicUrl} alt="" />
                    ) : null}
                  </Avatar>
                  <div>
                    <p className="font-semibold text-ink-800 text-sm dark:text-white">
                      {acc.accountName}
                    </p>
                    <p className="text-xs text-ink-400">ID: {acc.providerAccountId}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}} // handled by div onClick
                  className="h-5 w-5 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-ink-100 pt-4 dark:border-ink-800">
          <button
            type="button"
            onClick={() => router.push("/accounts")}
            disabled={busy}
            className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50 transition disabled:opacity-50 dark:bg-ink-50 dark:border-ink-800 dark:text-white"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={busy}
            className="rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
          >
            {busy ? "İçe Aktarılıyor..." : "Seçilenleri İçe Aktar"}
          </button>
        </div>
      </Card>
    </div>
  );
}

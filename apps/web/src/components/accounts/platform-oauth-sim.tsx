"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProviderIcon } from "@/components/posts/provider-icon";

const META: Record<
  string,
  {
    name: string;
    brand: string;
    headline: string;
    accent: string;
    bg: string;
    placeholder: string;
  }
> = {
  facebook: {
    name: "Facebook",
    brand: "#1877F2",
    headline: "Sevdiğin şeyleri keşfet.",
    accent: "Bağlan",
    bg: "from-[#e8f0fe] via-white to-[#f0f4ff]",
    placeholder: "Örn: Beyin Atölyesi Facebook",
  },
  instagram: {
    name: "Instagram",
    brand: "#E1306C",
    headline: "Anlarını paylaş.",
    accent: "Bağlan",
    bg: "from-[#fff5f8] via-white to-[#f3e8ff]",
    placeholder: "Örn: @beyinatolyesi",
  },
  linkedin: {
    name: "LinkedIn",
    brand: "#0A66C2",
    headline: "Profesyonel ağınıza bağlanın.",
    accent: "Bağlan",
    bg: "from-[#eef5fb] via-white to-[#f5f9fc]",
    placeholder: "Örn: Beyin Atölyesi Ltd.",
  },
  youtube: {
    name: "YouTube",
    brand: "#FF0000",
    headline: "Kanalınızı bağlayın.",
    accent: "Bağlan",
    bg: "from-[#fff5f5] via-white to-white",
    placeholder: "Örn: Beyin Atölyesi Kanal",
  },
  x: {
    name: "X",
    brand: "#0F1419",
    headline: "Profilinizi bağlayın.",
    accent: "Bağlan",
    bg: "from-[#f4f4f5] via-white to-white",
    placeholder: "Örn: @beyinatolyesi",
  },
  tiktok: {
    name: "TikTok",
    brand: "#010101",
    headline: "İş hesabınızı bağlayın.",
    accent: "Bağlan",
    bg: "from-[#f5f5f5] via-white to-[#eefcff]",
    placeholder: "Örn: @beyinatolyesi",
  },
  pinterest: {
    name: "Pinterest",
    brand: "#E60023",
    headline: "Panonuzu bağlayın.",
    accent: "Bağlan",
    bg: "from-[#fff0f2] via-white to-white",
    placeholder: "Örn: Beyin Atölyesi Pano",
  },
};

export function PlatformOAuthSim({
  provider,
  userName,
  existingGroups = [],
}: {
  provider: string;
  userName?: string | null;
  existingGroups?: { id: string; name: string }[];
}) {
  const search = useSearchParams();
  const router = useRouter();
  const state = search.get("state") || "";
  const type = search.get("type") || "page";
  const key = provider.toLowerCase();
  const meta = META[key] || META.facebook;
  const [busy, setBusy] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [groupMode, setGroupMode] = useState<"none" | "existing" | "new">(
    existingGroups.length ? "existing" : "new"
  );
  const [groupId, setGroupId] = useState(existingGroups[0]?.id || "");
  const [newGroupName, setNewGroupName] = useState("");

  const canContinue = Boolean(state && accountName.trim().length >= 2);

  const continueUrl = useMemo(() => {
    if (!state || !accountName.trim()) return null;
    const qs = new URLSearchParams({
      state,
      code: `auth_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      accountName: accountName.trim().slice(0, 120),
      local: "1",
    });
    if (groupMode === "existing" && groupId) {
      qs.set("groupId", groupId);
    }
    if (groupMode === "new" && newGroupName.trim()) {
      qs.set("groupName", newGroupName.trim().slice(0, 80));
    }
    return `/api/accounts/oauth/${key}/callback?${qs.toString()}`;
  }, [key, state, type, accountName, groupMode, groupId, newGroupName]);

  return (
    <div className={`fixed inset-0 z-[40] flex min-h-dvh bg-gradient-to-br ${meta.bg}`}>
      <div className="mx-auto flex w-full max-w-5xl flex-col items-stretch lg:flex-row lg:items-center lg:px-8">
        <aside className="hidden flex-1 flex-col justify-center p-10 lg:flex">
          <ProviderIcon provider={provider.toUpperCase()} size={56} />
          <h1 className="mt-8 max-w-md font-display text-4xl font-semibold tracking-tight text-ink-900">
            {meta.headline}
          </h1>
          <p className="mt-4 max-w-sm text-sm text-ink-500">
            Hesap adını yazıp bağlayın. İsterseniz bir marka grubuna ekleyin — gönderi
            ekranında grupla seçim yaparsınız.
          </p>
          <ol className="mt-6 max-w-sm space-y-2 text-sm text-ink-600">
            <li>1. Hesap adını girin</li>
            <li>2. (İsteğe bağlı) marka grubu seçin / oluşturun</li>
            <li>3. Bağlan’a tıklayın</li>
          </ol>
        </aside>

        <main className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-2xl border border-ink-200/80 bg-white p-8 shadow-xl">
            <div className="mb-5 flex justify-center">
              <ProviderIcon provider={provider.toUpperCase()} size={48} />
            </div>
            <p className="text-center text-lg font-semibold text-ink-900">{meta.name}</p>
            <p className="mt-1 text-center text-xs text-ink-400">
              SocialMarka · test bağlantısı (API gerekmez)
            </p>

            <label className="mt-6 block text-left">
              <span className="text-xs font-semibold text-ink-500">Hesap adı *</span>
              <input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={meta.placeholder}
                className="mt-1.5 w-full rounded-xl border border-ink-200 bg-ink-50/50 px-3 py-2.5 text-sm text-ink-900 outline-none ring-accent focus:bg-white focus:ring-2"
                autoFocus
              />
            </label>

            <div className="mt-4 space-y-2">
              <span className="text-xs font-semibold text-ink-500">Marka grubu</span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "none", label: "Yok" },
                    ...(existingGroups.length
                      ? [{ id: "existing" as const, label: "Mevcut" }]
                      : []),
                    { id: "new", label: "Yeni grup" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGroupMode(opt.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      groupMode === opt.id
                        ? "bg-ink-900 text-white"
                        : "border border-ink-200 text-ink-600 hover:bg-ink-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {groupMode === "existing" ? (
                <select
                  className="mt-1 h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  {existingGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              ) : null}
              {groupMode === "new" ? (
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Örn: Beyin Atölyesi"
                  className="mt-1 w-full rounded-xl border border-ink-200 bg-ink-50/50 px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-accent"
                />
              ) : null}
            </div>

            {continueUrl && canContinue ? (
              <a
                href={continueUrl}
                onClick={() => setBusy(true)}
                className="mt-6 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                style={{ backgroundColor: meta.brand }}
              >
                {busy ? "Bağlanıyor…" : meta.accent}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="mt-6 w-full rounded-xl bg-ink-200 px-4 py-3 text-sm font-semibold text-ink-500"
              >
                {!state ? "Oturum bulunamadı" : "Hesap adını girin"}
              </button>
            )}

            <button
              type="button"
              onClick={() => router.push("/accounts/create")}
              className="mt-3 w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-800 hover:bg-ink-50"
            >
              İptal
            </button>
            {userName ? (
              <p className="mt-3 text-center text-[11px] text-ink-400">Oturum: {userName}</p>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

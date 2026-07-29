"use client";

import { Input } from "@heroui/react";
import type { PlatformId, YtPrivacy } from "./composer-types";

export function PlatformFields({
  activePlatform,
  canEdit,
  pinTitle,
  setPinTitle,
  pinLink,
  setPinLink,
  pinAlt,
  setPinAlt,
  pinHashtags = "",
  setPinHashtags = () => {},
  ytTitle = "",
  setYtTitle = () => {},
  ytPrivacy,
  setYtPrivacy,
  ytTags,
  setYtTags,
  ytAdvanceOpen,
  setYtAdvanceOpen,
}: {
  activePlatform: PlatformId;
  canEdit: boolean;
  pinTitle: string;
  setPinTitle: (v: string) => void;
  pinLink: string;
  setPinLink: (v: string) => void;
  pinAlt: boolean;
  setPinAlt: (v: boolean) => void;
  pinHashtags?: string;
  setPinHashtags?: (v: string) => void;
  ytTitle?: string;
  setYtTitle?: (v: string) => void;
  ytPrivacy: YtPrivacy;
  setYtPrivacy: (v: YtPrivacy) => void;
  ytTags: string;
  setYtTags: (v: string) => void;
  ytAdvanceOpen: boolean;
  setYtAdvanceOpen: (v: boolean) => void;
}) {
  if (activePlatform === "PINTEREST") {
    return (
      <div className="mb-3 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-ink-800">
            Hedef link (Destination)
          </label>
          <Input
            fullWidth
            value={pinLink}
            onChange={(e) => setPinLink(e.target.value)}
            placeholder="https://"
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-ink-800">
            Başlık (zorunlu, max 100)
          </label>
          <div className="relative">
            <Input
              fullWidth
              value={pinTitle}
              onChange={(e) => setPinTitle(e.target.value.slice(0, 100))}
              disabled={!canEdit}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-ink-600">
              {pinTitle.length}/100
            </span>
          </div>
        </div>
        
        {/* Pinterest Hashtags Section */}
        <div>
          <label className="mb-1 block text-xs font-bold text-ink-800">
            Hashtagler (Boşluklarla ayırın)
          </label>
          <Input
            fullWidth
            value={pinHashtags}
            onChange={(e) => setPinHashtags(e.target.value)}
            placeholder="ör. #tasarim #dekorasyon"
            disabled={!canEdit}
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {["#tasarim", "#dekorasyon", "#yemek", "#moda", "#seyahat", "#egitim", "#motivasyon", "#trend", "#diy", "#art"].map((tag) => (
              <button
                key={tag}
                type="button"
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                  pinHashtags.includes(tag)
                    ? "bg-accent text-white"
                    : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"
                }`}
                onClick={() => {
                  if (pinHashtags.includes(tag)) {
                    setPinHashtags(pinHashtags.replace(tag, "").replace(/\s+/g, " ").trim());
                  } else {
                    setPinHashtags(`${pinHashtags} ${tag}`.trim());
                  }
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-1.5 text-[11px] font-semibold text-accent hover:underline flex items-center gap-1"
            onClick={() => {
              const tagsToAdd: string[] = [];
              const text = pinTitle.toLowerCase() + " " + (pinLink || "").toLowerCase();
              if (text.includes("tasarım") || text.includes("dizayn") || text.includes("art") || text.includes("resim")) {
                tagsToAdd.push("#tasarim", "#art", "#diy");
              }
              if (text.includes("ev") || text.includes("oda") || text.includes("dekor") || text.includes("mobilya")) {
                tagsToAdd.push("#dekorasyon", "#diy");
              }
              if (text.includes("yemek") || text.includes("tarif") || text.includes("mutfak") || text.includes("pasta")) {
                tagsToAdd.push("#yemek", "#tarifler");
              }
              if (text.includes("moda") || text.includes("elbise") || text.includes("kombin") || text.includes("tarz")) {
                tagsToAdd.push("#moda", "#trend");
              }
              if (text.includes("seyahat") || text.includes("tatil") || text.includes("gezi")) {
                tagsToAdd.push("#seyahat");
              }
              if (text.includes("basari") || text.includes("motivasyon") || text.includes("girisim") || text.includes("is")) {
                tagsToAdd.push("#motivasyon", "#egitim");
              }
              if (tagsToAdd.length === 0) {
                tagsToAdd.push("#trend", "#pinterest");
              }
              
              let current = pinHashtags;
              for (const t of tagsToAdd) {
                if (!current.includes(t)) {
                  current = `${current} ${t}`.trim();
                }
              }
              setPinHashtags(current);
            }}
          >
            ✨ Posta Göre Hashtagleri Ayarla
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={pinAlt}
            onChange={(e) => setPinAlt(e.target.checked)}
            disabled={!canEdit}
          />
          Pin için alt metin (Alt Text)
        </label>
      </div>
    );
  }

  if (activePlatform === "YOUTUBE") {
    return (
      <div className="mb-3 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-ink-800">
            Video Başlığı * (max 100)
          </label>
          <div className="relative">
            <Input
              fullWidth
              value={ytTitle}
              onChange={(e) => setYtTitle(e.target.value.slice(0, 100))}
              placeholder="Video başlığını girin..."
              disabled={!canEdit}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-ink-600">
              {ytTitle.length}/100
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-ink-800">
            Video Altyazıları
          </label>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
            disabled={!canEdit}
          >
            <span className="text-sm font-bold">+</span> Altyazı Dosyası Ekle (Add File)
          </button>
        </div>

        <div>
          <p className="mb-1 text-xs font-bold text-ink-800">Gizlilik durumu</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {(
              [
                { id: "public" as const, label: "Herkese açık" },
                { id: "private" as const, label: "Özel" },
                { id: "unlisted" as const, label: "Liste dışı" },
              ]
            ).map((o) => (
              <label key={o.id} className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-ink-700">
                <input
                  type="radio"
                  name="ytPrivacy"
                  checked={ytPrivacy === o.id}
                  onChange={() => setYtPrivacy(o.id)}
                  disabled={!canEdit}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-ink-200 bg-[#fafbfc] dark:bg-ink-50 dark:border-ink-800">
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-semibold text-ink-800"
            onClick={() => setYtAdvanceOpen(!ytAdvanceOpen)}
          >
            Gelişmiş ayarlar
            <span className="text-ink-400">{ytAdvanceOpen ? "▴" : "▾"}</span>
          </button>
          {ytAdvanceOpen ? (
            <div className="space-y-2 border-t border-ink-100 px-3 py-3">
              <label className="block text-xs font-semibold text-ink-500">Etiketler</label>
              <Input
                fullWidth
                value={ytTags}
                onChange={(e) => setYtTags(e.target.value)}
                placeholder="ör. sosyal, pazarlama, ipucu"
                disabled={!canEdit}
              />
              <p className="text-[11px] text-ink-400">Kategori: People & Blogs (22)</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}

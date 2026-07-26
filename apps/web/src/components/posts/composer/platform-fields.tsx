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
          <label className="mb-1 block text-xs font-semibold text-ink-500">
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
          <label className="mb-1 block text-xs font-semibold text-ink-500">
            Başlık (zorunlu, max 100)
          </label>
          <div className="relative">
            <Input
              fullWidth
              value={pinTitle}
              onChange={(e) => setPinTitle(e.target.value.slice(0, 100))}
              disabled={!canEdit}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-400">
              {pinTitle.length}/100
            </span>
          </div>
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
      <div className="mt-3 space-y-3">
        <div>
          <p className="mb-2 text-xs font-semibold text-ink-500">Gizlilik durumu</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {(
              [
                { id: "public" as const, label: "Herkese açık" },
                { id: "private" as const, label: "Özel" },
                { id: "unlisted" as const, label: "Liste dışı" },
              ]
            ).map((o) => (
              <label key={o.id} className="flex items-center gap-1.5">
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
        <div className="rounded-xl border border-ink-200 bg-[#fafbfc]">
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

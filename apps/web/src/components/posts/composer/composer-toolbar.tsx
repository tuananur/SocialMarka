"use client";

import { Input } from "@heroui/react";
import { QUICK_EMOJIS } from "./composer-types";

function ToolIcon({
  label,
  title,
  onClick,
  disabled,
}: {
  label: string;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md px-2 py-1 text-base hover:bg-ink-100 disabled:opacity-40"
    >
      {label}
    </button>
  );
}

export function ComposerToolbar({
  canEdit,
  charCount,
  charLimit,
  showEmojis,
  setShowEmojis,
  showLocation,
  setShowLocation,
  showUtm,
  setShowUtm,
  locationLabel,
  setLocationLabel,
  utmUrl,
  setUtmUrl,
  utmSource,
  setUtmSource,
  utmMedium,
  setUtmMedium,
  utmCampaign,
  setUtmCampaign,
  onMediaClick,
  onInsertHashtag,
  onInsertEmoji,
  onAiCaption,
  onApplyLocation,
  onApplyUtm,
}: {
  canEdit: boolean;
  charCount: number;
  charLimit: number | null;
  showEmojis: boolean;
  setShowEmojis: (v: boolean | ((p: boolean) => boolean)) => void;
  showLocation: boolean;
  setShowLocation: (v: boolean | ((p: boolean) => boolean)) => void;
  showUtm: boolean;
  setShowUtm: (v: boolean | ((p: boolean) => boolean)) => void;
  locationLabel: string;
  setLocationLabel: (v: string) => void;
  utmUrl: string;
  setUtmUrl: (v: string) => void;
  utmSource: string;
  setUtmSource: (v: string) => void;
  utmMedium: string;
  setUtmMedium: (v: string) => void;
  utmCampaign: string;
  setUtmCampaign: (v: string) => void;
  onMediaClick: () => void;
  onInsertHashtag: () => void;
  onInsertEmoji: (e: string) => void;
  onAiCaption: () => void;
  onApplyLocation: () => void;
  onApplyUtm: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 border-t border-ink-100 bg-[#fafbfc] dark:bg-ink-950 dark:border-ink-800 px-2 py-2">
        <ToolIcon label="📎" title="Medya ekle" onClick={onMediaClick} disabled={!canEdit} />
        <ToolIcon
          label="😊"
          title="Emoji"
          onClick={() => {
            setShowEmojis((v) => !v);
            setShowLocation(false);
            setShowUtm(false);
          }}
          disabled={!canEdit}
        />
        <ToolIcon
          label="📍"
          title="Lokasyon"
          onClick={() => {
            setShowLocation((v) => !v);
            setShowEmojis(false);
            setShowUtm(false);
          }}
          disabled={!canEdit}
        />
        <ToolIcon
          label="🔗"
          title="Link / UTM"
          onClick={() => {
            setShowUtm((v) => !v);
            setShowEmojis(false);
            setShowLocation(false);
          }}
          disabled={!canEdit}
        />
        <ToolIcon label="#" title="Hashtag" onClick={onInsertHashtag} disabled={!canEdit} />
        <button
          type="button"
          disabled={!canEdit}
          onClick={onAiCaption}
          className="ml-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
        >
          ✨ AI Caption
        </button>
        <span
          className={`ml-auto pr-2 text-xs tabular-nums ${
            charLimit && charCount > charLimit ? "font-bold text-rose-600" : "text-ink-400"
          }`}
        >
          {charLimit ? `${charCount}/${charLimit}` : charCount}
        </span>
      </div>

      {showEmojis ? (
        <div className="mt-2 flex flex-wrap gap-1 rounded-xl border border-ink-100 bg-white p-2 shadow-sm">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="rounded-lg px-2 py-1 text-lg hover:bg-ink-50"
              onClick={() => onInsertEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
      ) : null}

      {showLocation ? (
        <div className="mt-2 space-y-2 rounded-xl border border-ink-100 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold text-ink-500">Lokasyon ekle</p>
          <Input
            fullWidth
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            placeholder="Örn. İstanbul, Türkiye"
            disabled={!canEdit}
          />
          <button
            type="button"
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white"
            onClick={onApplyLocation}
          >
            Metne ekle
          </button>
        </div>
      ) : null}

      {showUtm ? (
        <div className="mt-2 space-y-2 rounded-xl border border-ink-100 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold text-ink-500">Link / UTM</p>
          <Input
            fullWidth
            value={utmUrl}
            onChange={(e) => setUtmUrl(e.target.value)}
            placeholder="https://ornek.com/sayfa"
            disabled={!canEdit}
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              placeholder="utm_source"
              disabled={!canEdit}
            />
            <Input
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              placeholder="utm_medium"
              disabled={!canEdit}
            />
            <Input
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              placeholder="utm_campaign"
              disabled={!canEdit}
            />
          </div>
          <button
            type="button"
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white"
            onClick={onApplyUtm}
          >
            Linki metne ekle
          </button>
        </div>
      ) : null}
    </div>
  );
}

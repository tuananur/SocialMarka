"use client";

import React, { useState } from "react";
import { Input } from "@heroui/react";
import { QUICK_EMOJIS } from "./composer-types";

function PaperclipIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94a3 3 0 1 1 4.243 4.243L8.567 18.306a1.5 1.5 0 0 1-2.122-2.122l8.834-8.833" />
    </svg>
  );
}

function SmileIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm4.5 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Z" />
    </svg>
  );
}

function MapPinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function LinkIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  );
}

function HashIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h13.5m-13.5 7.5h13.5m-9-12 1.5 16.5m4.5-16.5 1.5 16.5" />
    </svg>
  );
}

function SparklesIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a2.25 2.25 0 0 0-1.545-1.545L15.16 7l1.035-.259a2.25 2.25 0 0 0 1.545-1.545L18 4.16l.259 1.035a2.25 2.25 0 0 0 1.545 1.545L20.84 7l-1.035.259a2.25 2.25 0 0 0-1.545 1.545Z" />
    </svg>
  );
}

function DeviceIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
  );
}

function GoogleDriveIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" fill="none">
      <path d="M6.6 66.85l18.5-32.1h55.6l-18.5 32.1z" fill="#0066DA" />
      <path d="M43.65 2.65l18.5 32.1-27.8 48.1-18.5-32.1z" fill="#00AC47" />
      <path d="M73.8 34.75L46 81.35H9.6l27.8-46.6z" fill="#EA4335" />
      <path d="M25.1 34.75L43.65 2.65l18.5 32.1H25.1z" fill="#FFBA00" />
    </svg>
  );
}

function DropboxIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#0061FF">
      <path d="M6 2l6 3.75L6 9.5 0 5.75 6 2zm12 0l6 3.75-6 3.75-6-3.75L18 2zM0 13.25l6-3.75 6 3.75-6 3.75-6-3.75zm24 0l-6-3.75-6 3.75 6 3.75 6-3.75zM6 18.25l6-3.75 6 3.75-6 3.75-6-3.75z" />
    </svg>
  );
}

function BoxIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#0061D5">
      <path d="M19.5 3.5h-15C3.1 3.5 2 4.6 2 6v12c0 1.4 1.1 2.5 2.5 2.5h15c1.4 0 2.5-1.1 2.5-2.5V6c0-1.4-1.1-2.5-2.5-2.5zm-7.5 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
    </svg>
  );
}

function ToolIconButton({
  icon: Icon,
  title,
  onClick,
  disabled,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg p-1.5 text-ink-500 hover:text-ink-900 hover:bg-ink-100 dark:text-ink-400 dark:hover:text-ink-100 dark:hover:bg-ink-800 transition disabled:opacity-40 ${
        active ? "bg-ink-100 text-ink-900 dark:bg-ink-800 dark:text-ink-100 font-semibold" : ""
      }`}
    >
      <Icon className="w-4 h-4" />
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
  onAddUrlMedia,
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
  onAddUrlMedia?: (url: string) => void;
  onInsertHashtag: () => void;
  onInsertEmoji: (e: string) => void;
  onAiCaption: () => void;
  onApplyLocation: () => void;
  onApplyUtm: () => void;
}) {
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [cloudPrompt, setCloudPrompt] = useState<{ provider: string; title: string; placeholder: string } | null>(null);
  const [cloudUrlInput, setCloudUrlInput] = useState("");

  const handleUrlSubmit = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    onAddUrlMedia?.(url);
    setImageUrlInput("");
    setShowMediaMenu(false);
  };

  const handleCloudSubmit = () => {
    const url = cloudUrlInput.trim();
    if (!url) return;
    onAddUrlMedia?.(url);
    setCloudUrlInput("");
    setCloudPrompt(null);
  };

  return (
    <div>
      <div className="relative flex flex-wrap items-center gap-1.5 border-t border-ink-100 bg-[#fafbfc] dark:bg-ink-50 dark:border-ink-800 px-3 py-2">
        <ToolIconButton
          icon={PaperclipIcon}
          title="Medya ekle"
          active={showMediaMenu}
          onClick={() => {
            setShowMediaMenu((v) => !v);
            setShowEmojis(false);
            setShowLocation(false);
            setShowUtm(false);
          }}
          disabled={!canEdit}
        />

        {/* Media Add Menu Popover */}
        {showMediaMenu ? (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMediaMenu(false)} />
            <div className="absolute left-3 top-10 z-50 min-w-[280px] max-w-[320px] rounded-xl border border-ink-200/80 bg-white p-3.5 shadow-xl dark:bg-ink-950 dark:border-ink-800 animate-in fade-in zoom-in-95 duration-100">
              {/* Add Media Section */}
              <div className="mb-3">
                <p className="mb-2 text-xs font-bold tracking-tight text-ink-800 dark:text-white border-b border-amber-400 pb-1 w-fit">
                  Add Media
                </p>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Enter Image or Video URL"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleUrlSubmit();
                      }
                    }}
                    className="h-8 flex-1 rounded-lg border border-ink-200 bg-ink-50 px-2.5 text-xs text-ink-800 outline-none focus:border-accent focus:bg-white dark:bg-ink-900 dark:border-ink-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleUrlSubmit}
                    className="h-8 rounded-lg px-3 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950 transition-colors"
                  >
                    Upload
                  </button>
                </div>
              </div>

              <div className="my-2.5 h-[1px] bg-ink-100 dark:bg-ink-800" />

              {/* Upload Image or Video Section */}
              <div>
                <p className="mb-2 text-xs font-bold tracking-tight text-ink-800 dark:text-white border-b border-amber-400 pb-1 w-fit">
                  Upload Image or Video
                </p>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMediaMenu(false);
                      onMediaClick();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-900 transition-colors"
                  >
                    <DeviceIcon className="w-4 h-4 text-sky-600" />
                    <span>My device</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMediaMenu(false);
                      setCloudPrompt({
                        provider: "Dropbox",
                        title: "Dropbox Bağlantısı Ekle",
                        placeholder: "https://www.dropbox.com/s/...",
                      });
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-900 transition-colors"
                  >
                    <DropboxIcon className="w-4 h-4" />
                    <span>Dropbox</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMediaMenu(false);
                      setCloudPrompt({
                        provider: "Google Drive",
                        title: "Google Drive Bağlantısı Ekle",
                        placeholder: "https://drive.google.com/file/d/...",
                      });
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-900 transition-colors"
                  >
                    <GoogleDriveIcon className="w-4 h-4" />
                    <span>Google Drive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMediaMenu(false);
                      setCloudPrompt({
                        provider: "Box",
                        title: "Box Bağlantısı Ekle",
                        placeholder: "https://app.box.com/s/...",
                      });
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-900 transition-colors"
                  >
                    <BoxIcon className="w-4 h-4" />
                    <span>Box</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* Cloud Link Input Modal */}
        {cloudPrompt ? (
          <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" onClick={() => setCloudPrompt(null)} />
            <div className="fixed left-1/2 top-1/2 z-51 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-ink-200 bg-white p-5 shadow-2xl dark:bg-ink-950 dark:border-ink-800">
              <div className="flex items-center gap-2 mb-3">
                {cloudPrompt.provider === "Google Drive" && <GoogleDriveIcon className="w-5 h-5" />}
                {cloudPrompt.provider === "Dropbox" && <DropboxIcon className="w-5 h-5" />}
                {cloudPrompt.provider === "Box" && <BoxIcon className="w-5 h-5" />}
                <h3 className="text-sm font-bold text-ink-900 dark:text-white">{cloudPrompt.title}</h3>
              </div>
              <p className="text-xs text-ink-500 mb-3">
                {cloudPrompt.provider} üzerindeki dosyanızın paylaşım bağlantısını yapıştırın:
              </p>
              <input
                type="url"
                value={cloudUrlInput}
                onChange={(e) => setCloudUrlInput(e.target.value)}
                placeholder={cloudPrompt.placeholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCloudSubmit();
                  }
                }}
                className="w-full h-9 rounded-xl border border-ink-200 bg-ink-50 px-3 text-xs text-ink-800 outline-none focus:border-accent focus:bg-white dark:bg-ink-900 dark:border-ink-800 dark:text-white mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCloudPrompt(null)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleCloudSubmit}
                  className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
                >
                  Medyayı Ekle
                </button>
              </div>
            </div>
          </>
        ) : null}

        <ToolIconButton
          icon={SmileIcon}
          title="Emoji"
          active={showEmojis}
          onClick={() => {
            setShowEmojis((v) => !v);
            setShowLocation(false);
            setShowUtm(false);
            setShowMediaMenu(false);
          }}
          disabled={!canEdit}
        />
        <ToolIconButton
          icon={MapPinIcon}
          title="Lokasyon"
          active={showLocation}
          onClick={() => {
            setShowLocation((v) => !v);
            setShowEmojis(false);
            setShowUtm(false);
            setShowMediaMenu(false);
          }}
          disabled={!canEdit}
        />
        <ToolIconButton
          icon={LinkIcon}
          title="Link / UTM"
          active={showUtm}
          onClick={() => {
            setShowUtm((v) => !v);
            setShowEmojis(false);
            setShowLocation(false);
            setShowMediaMenu(false);
          }}
          disabled={!canEdit}
        />
        <ToolIconButton icon={HashIcon} title="Hashtag" onClick={onInsertHashtag} disabled={!canEdit} />
        <button
          type="button"
          disabled={!canEdit}
          onClick={onAiCaption}
          className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-amber-300/60 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-2xs hover:border-amber-400 hover:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-200 transition disabled:opacity-40"
        >
          <SparklesIcon className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>AI Caption</span>
        </button>
        <span
          className={`ml-auto pr-2 text-xs tabular-nums font-medium ${
            charLimit && charCount > charLimit ? "font-bold text-rose-600" : "text-ink-400"
          }`}
        >
          {charLimit ? `${charCount}/${charLimit}` : charCount}
        </span>
      </div>

      {showEmojis ? (
        <div className="mt-2 flex flex-wrap gap-1 rounded-xl border border-ink-100 bg-white p-2 shadow-sm dark:bg-ink-950 dark:border-ink-800">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="rounded-lg px-2 py-1 text-lg hover:bg-ink-50 dark:hover:bg-ink-900 transition"
              onClick={() => onInsertEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
      ) : null}

      {showLocation ? (
        <div className="mt-2 space-y-2 rounded-xl border border-ink-100 bg-white p-3 shadow-sm dark:bg-ink-950 dark:border-ink-800">
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
        <div className="mt-2 space-y-2 rounded-xl border border-ink-100 bg-white p-3 shadow-sm dark:bg-ink-950 dark:border-ink-800">
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

"use client";

import { useMemo } from "react";

function isVideoUrl(url: string, mimeHint?: string) {
  if (mimeHint?.startsWith("video/")) return true;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || url.startsWith("data:video/");
}

export function ComposerMediaPreview({
  url,
  mimeHint,
  fileName,
  onRemove,
  className = "",
}: {
  url: string;
  mimeHint?: string;
  fileName?: string;
  onRemove?: () => void;
  className?: string;
}) {
  const isVideo = useMemo(() => isVideoUrl(url, mimeHint), [url, mimeHint]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-ink-200/80 bg-ink-50 ${className}`}
    >
      {isVideo ? (
        <video
          src={url}
          className="max-h-64 w-full object-contain"
          controls
          playsInline
          muted
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={fileName || "Yüklenen medya"}
          className="max-h-64 w-full object-contain"
        />
      )}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 rounded-lg bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/70"
        >
          Kaldır
        </button>
      ) : null}
      {fileName ? (
        <p className="truncate border-t border-ink-100 bg-white px-3 py-1.5 text-[11px] text-ink-500">
          {fileName}
        </p>
      ) : null}
    </div>
  );
}

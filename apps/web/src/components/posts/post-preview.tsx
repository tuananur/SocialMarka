"use client";

import { Chip } from "@heroui/react";

export function PostPreview({
  platform,
  text,
  mediaUrl,
  mediaMime,
  format = "post",
}: {
  platform: string;
  text: string;
  mediaUrl?: string | null;
  mediaMime?: string | null;
  format?: string;
}) {
  const p = platform.toUpperCase();
  const f = format.toLowerCase();
  const isStory = f === "story";
  const isVertical =
    !isStory &&
    (p === "TIKTOK" ||
      f === "reel" ||
      (p === "YOUTUBE" && f === "shorts"));

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
        Canlı önizleme · {p} ({f})
      </p>
      {isStory && (
        <StoryPreview platform={p} mediaUrl={mediaUrl} mediaMime={mediaMime} />
      )}
      {isVertical && (
        <VerticalPreview platform={p} text={text} mediaUrl={mediaUrl} mediaMime={mediaMime} />
      )}
      {!isStory && !isVertical && p === "X" && (
        <XPreview text={text} mediaUrl={mediaUrl} mediaMime={mediaMime} />
      )}
      {!isStory && !isVertical && p !== "X" && (
        <CardPreview
          platform={p === "ORIGINAL" ? "LINKEDIN" : p}
          text={text}
          mediaUrl={mediaUrl}
          mediaMime={mediaMime}
          format={f}
        />
      )}
    </div>
  );
}

function StoryPreview({
  platform,
  mediaUrl,
  mediaMime,
}: {
  platform: string;
  mediaUrl?: string | null;
  mediaMime?: string | null;
}) {
  const isVideo = mediaMime?.startsWith("video/") || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(mediaUrl || "");
  return (
    <div className="mx-auto w-[220px] overflow-hidden rounded-2xl border border-ink-800 bg-ink-950 text-white shadow-xl">
      <div className="relative aspect-[9/16] bg-gradient-to-b from-ink-800 via-ink-900 to-ink-950 flex flex-col justify-between p-2.5">
        {mediaUrl ? (
          isVideo ? (
            <video
              src={mediaUrl}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-ink-400">
            Hikâye Görseli / Videosu
          </div>
        )}
        
        {/* Story Top Bar */}
        <div className="relative z-10 space-y-1.5 bg-gradient-to-b from-black/70 via-black/40 to-transparent p-2.5 -m-2.5 mb-0">
          {/* Progress bar line */}
          <div className="h-0.5 w-full rounded-full bg-white/40 overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-white" />
          </div>
          {/* User info */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-amber-500 to-fuchsia-600 p-[1.5px]">
              <div className="h-full w-full rounded-full bg-ink-900 border border-white/20" />
            </div>
            <span className="text-[11px] font-bold tracking-tight text-white drop-shadow">socialmarka</span>
            <span className="text-[10px] text-white/70">5d</span>
          </div>
        </div>

        {/* Story Bottom Reply Bar */}
        <div className="relative z-10 -m-2.5 mt-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-full border border-white/40 bg-black/30 px-3 py-1.5 text-[10px] text-white/70 backdrop-blur-xs">
              Mesaj gönder...
            </div>
            <div className="flex items-center justify-center text-white/90">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <div className="flex items-center justify-center text-white/90">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaBlock({
  mediaUrl,
  mediaMime,
  format = "post",
}: {
  mediaUrl?: string | null;
  mediaMime?: string | null;
  format?: string;
}) {
  if (!mediaUrl) {
    const aspectClass = format === "story" || format === "reel" ? "aspect-[9/16]" : "aspect-video";
    return (
      <div className={`${aspectClass} rounded-lg bg-gradient-to-br from-brand-100 to-brand-300`} />
    );
  }
  const isVideo =
    mediaMime?.startsWith("video/") ||
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(mediaUrl) ||
    (mediaUrl.includes("video") && !mediaUrl.startsWith("blob:"));
  
  const mediaClass = format === "post"
    ? "aspect-square object-cover w-full rounded-lg bg-ink-50 dark:bg-ink-900"
    : "max-h-80 w-full rounded-lg object-contain bg-ink-50 dark:bg-ink-900";

  if (isVideo) {
    return (
      <video
        src={mediaUrl}
        className={mediaClass}
        controls
        playsInline
        muted
      />
    );
  }
  return (
    <img
      src={mediaUrl}
      alt=""
      className={mediaClass}
    />
  );
}

function XPreview({
  text,
  mediaUrl,
  mediaMime,
}: {
  text: string;
  mediaUrl?: string | null;
  mediaMime?: string | null;
}) {
  const count = text.length;
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-full bg-ink-200" />
        <div>
          <div className="text-sm font-bold">SocialMarka</div>
          <div className="text-xs text-ink-400">@socialmarka</div>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm">{text || "Tweet metni..."}</p>
      {mediaUrl ? (
        <div className="mt-3">
          <MediaBlock mediaUrl={mediaUrl} mediaMime={mediaMime} />
        </div>
      ) : null}
      <Chip size="sm" className="mt-3" color={count > 280 ? "danger" : "default"} variant="soft">
        <Chip.Label>{count}/280</Chip.Label>
      </Chip>
    </div>
  );
}

function VerticalPreview({
  platform,
  text,
  mediaUrl,
  mediaMime,
}: {
  platform: string;
  text: string;
  mediaUrl?: string | null;
  mediaMime?: string | null;
}) {
  const isVideo = mediaMime?.startsWith("video/");
  return (
    <div className="mx-auto w-[220px] overflow-hidden rounded-2xl border border-ink-800 bg-ink-950 text-white shadow-lg">
      <div className="relative aspect-[9/16] bg-gradient-to-b from-ink-700 to-ink-950">
        {mediaUrl ? (
          isVideo ? (
            <video
              src={mediaUrl}
              className="absolute inset-0 h-full w-full object-cover opacity-90"
              muted
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
          )
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-accent" />
            <span className="text-xs font-semibold">Kanal</span>
            <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold">
              {platform === "YOUTUBE" ? "ABONE OL" : "Takip"}
            </span>
          </div>
          <p className="line-clamp-3 text-[11px] leading-snug opacity-90">
            {text || "Dikey video açıklaması..."}
          </p>
        </div>
      </div>
    </div>
  );
}

function CardPreview({
  platform,
  text,
  mediaUrl,
  mediaMime,
  format = "post",
}: {
  platform: string;
  text: string;
  mediaUrl?: string | null;
  mediaMime?: string | null;
  format?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm dark:bg-ink-950 dark:border-ink-800">
      <div className="flex items-center gap-2 border-b border-ink-100 p-3 dark:border-ink-800">
        <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-ink-800" />
        <div>
          <div className="text-sm font-semibold">SocialMarka</div>
          <div className="text-[10px] text-ink-400">{platform}</div>
        </div>
      </div>
      <p className="whitespace-pre-wrap p-3 text-sm">{text || "Gönderi metni burada görünecek..."}</p>
      {mediaUrl ? (
        <div className="px-3 pb-3">
          <MediaBlock mediaUrl={mediaUrl} mediaMime={mediaMime} format={format} />
        </div>
      ) : null}
    </div>
  );
}

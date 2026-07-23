"use client";

import { Chip } from "@heroui/react";

export function PostPreview({
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
  const p = platform.toUpperCase();

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
        Canlı önizleme · {p}
      </p>
      {p === "X" && <XPreview text={text} mediaUrl={mediaUrl} mediaMime={mediaMime} />}
      {(p === "INSTAGRAM" || p === "YOUTUBE" || p === "TIKTOK") && (
        <VerticalPreview platform={p} text={text} mediaUrl={mediaUrl} mediaMime={mediaMime} />
      )}
      {(p === "LINKEDIN" || p === "FACEBOOK" || p === "PINTEREST" || p === "ORIGINAL") && (
        <CardPreview
          platform={p === "ORIGINAL" ? "LINKEDIN" : p}
          text={text}
          mediaUrl={mediaUrl}
          mediaMime={mediaMime}
        />
      )}
      {!["X", "INSTAGRAM", "YOUTUBE", "TIKTOK", "LINKEDIN", "FACEBOOK", "PINTEREST", "ORIGINAL"].includes(
        p
      ) && <CardPreview platform={p} text={text} mediaUrl={mediaUrl} mediaMime={mediaMime} />}
    </div>
  );
}

function MediaBlock({
  mediaUrl,
  mediaMime,
}: {
  mediaUrl?: string | null;
  mediaMime?: string | null;
}) {
  if (!mediaUrl) {
    return (
      <div className="aspect-video rounded-lg bg-gradient-to-br from-brand-100 to-brand-300" />
    );
  }
  const isVideo =
    mediaMime?.startsWith("video/") ||
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(mediaUrl) ||
    (mediaUrl.includes("video") && !mediaUrl.startsWith("blob:"));
  if (isVideo) {
    return (
      <video
        src={mediaUrl}
        className="max-h-80 w-full rounded-lg object-contain"
        controls
        playsInline
        muted
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={mediaUrl}
      alt=""
      className="max-h-80 w-full rounded-lg object-contain bg-ink-50"
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
}: {
  platform: string;
  text: string;
  mediaUrl?: string | null;
  mediaMime?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-ink-100 p-3">
        <div className="h-9 w-9 rounded-full bg-brand-100" />
        <div>
          <div className="text-sm font-semibold">SocialMarka</div>
          <div className="text-[10px] text-ink-400">{platform}</div>
        </div>
      </div>
      <p className="whitespace-pre-wrap p-3 text-sm">{text || "Gönderi metni burada görünecek..."}</p>
      {mediaUrl ? (
        <div className="px-3 pb-3">
          <MediaBlock mediaUrl={mediaUrl} mediaMime={mediaMime} />
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ProviderIcon } from "./provider-icon";
import {
  type ManagePost,
  postIsVideo,
  postPrimaryError,
  postStatusLabel,
  postStatusTone,
  postThumbnail,
} from "@/lib/post-display";

export function PostManageCard({
  post,
  canEdit,
  targetIndex,
  onOpen,
  onEdit,
  onDelete,
  onRetry,
  onRestore,
}: {
  post: ManagePost;
  canEdit: boolean;
  targetIndex?: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: (targetId?: string) => void;
  onRetry?: () => void;
  onRestore?: (targetId?: string) => void;
}) {
  const thumb = postThumbnail(post);
  const isVideo = postIsVideo(post);
  const when = post.scheduledAt ? new Date(post.scheduledAt) : null;
  // If targetIndex is provided, show only that target; otherwise show all
  const displayTargets = targetIndex != null && post.targets[targetIndex]
    ? [post.targets[targetIndex]]
    : post.targets;
  const accounts = displayTargets.map((t) => t.socialAccount);
  const error = targetIndex != null && post.targets[targetIndex]?.errorMessage
    ? post.targets[targetIndex].errorMessage
    : postPrimaryError(post);
  const showRetry =
    Boolean(onRetry) &&
    (post.status === "FAILED" ||
      post.status === "PARTIAL_FAILED" ||
      post.status === "SCHEDULED" ||
      post.status === "DRAFT");

  return (
    <article className="overflow-hidden rounded-xl border border-ink-200/80 bg-white shadow-[var(--shadow-soft)] transition hover:border-brand-200/80">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-start"
      >
        <div className="flex shrink-0 items-start gap-3">
          {thumb ? (
            isVideo ? (
              <video
                src={thumb}
                muted
                playsInline
                preload="metadata"
                className="h-16 w-16 rounded-lg border border-ink-100 object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumb}
                alt=""
                className="h-16 w-16 rounded-lg border border-ink-100 object-cover"
              />
            )
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 text-[10px] font-medium text-brand-600">
              Metin
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm text-ink-800">{post.content || "—"}</p>
          {when ? (
            <p className="mt-2 text-xs text-ink-500">
              {format(when, "d MMM yyyy HH:mm", { locale: tr })}
            </p>
          ) : null}
          <p className="mt-1">
            <span
              className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${postStatusTone(post.status)}`}
            >
              {postStatusLabel(post.status)}
            </span>
          </p>
          {error ? (
            <p className="mt-2 line-clamp-2 text-xs text-rose-600" title={error}>
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:min-w-[140px]">
          <div className="flex flex-wrap justify-end gap-1">
            {accounts.map((a, i) => (
              <ProviderIcon key={`${a.provider}-${i}`} provider={a.provider} size={20} />
            ))}
          </div>
          {accounts[0] ? (
            <p className="max-w-[10rem] truncate text-right text-xs font-semibold text-ink-700">
              {accounts[0].accountName}
              {accounts.length > 1 ? ` +${accounts.length - 1}` : ""}
            </p>
          ) : null}
        </div>
      </button>
      {canEdit ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 bg-[#fafbfc] px-4 py-2 dark:bg-ink-950 dark:border-ink-800">
          {onRestore ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(displayTargets[0]?.id);
                }}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
              >
                Geri Yükle
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(displayTargets[0]?.id);
                }}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                Kalıcı Olarak Sil
              </button>
            </div>
          ) : (
            <>
              {showRetry ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry?.();
                  }}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-accent hover:bg-white"
                >
                  {post.status === "FAILED" || post.status === "PARTIAL_FAILED"
                    ? "Tekrar dene"
                    : "Hemen paylaş"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-ink-600 hover:bg-white"
              >
                Düzenle
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(displayTargets[0]?.id);
                }}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                Sil
              </button>
            </>
          )}
        </div>
      ) : null}
    </article>
  );
}

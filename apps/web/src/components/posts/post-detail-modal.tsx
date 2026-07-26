"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { PostPreview } from "./post-preview";
import { ProviderIcon } from "./provider-icon";
import {
  type ManagePost,
  postIsVideo,
  postPreviewPlatform,
  postPrimaryError,
  postStatusLabel,
  postStatusTone,
  postThumbnail,
} from "@/lib/post-display";

type Props = {
  post: ManagePost;
  canEdit: boolean;
  variant?: "full" | "compact";
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
};

export function PostDetailModal({
  post,
  canEdit,
  variant = "full",
  onClose,
  onEdit,
  onDelete,
  onRetry,
}: Props) {
  const thumb = postThumbnail(post);
  const isVideo = postIsVideo(post);
  const platform = postPreviewPlatform(post);
  const when = post.scheduledAt ? new Date(post.scheduledAt) : null;
  const error = postPrimaryError(post);

  if (variant === "compact") {
    const account = post.targets[0]?.socialAccount;
    return (
      <ModalShell onClose={onClose} title="Gönderi detayı" onDelete={canEdit ? onDelete : undefined}>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
          <div className="shrink-0">
            {thumb ? (
              isVideo ? (
                <video
                  src={thumb}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-28 w-28 rounded-lg border border-ink-200 object-cover sm:h-32 sm:w-32"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  className="h-28 w-28 rounded-lg border border-ink-200 object-cover sm:h-32 sm:w-32"
                />
              )
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-ink-100 text-xs text-ink-400 sm:h-32 sm:w-32">
                Medya yok
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {account ? <ProviderIcon provider={account.provider} size={22} /> : null}
              <span className="text-sm font-semibold text-ink-900">{account?.accountName}</span>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${postStatusTone(post.status)}`}
              >
                {postStatusLabel(post.status)}
              </span>
            </div>
            {when ? (
              <p className="mb-2 text-xs text-ink-500">
                {format(when, "HH:mm, d MMMM yyyy", { locale: tr })}
              </p>
            ) : null}
            <p className="whitespace-pre-wrap text-sm text-ink-800">{post.content}</p>
            {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
            {post.targets.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.targets.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 rounded-full border border-ink-100 bg-ink-50 px-2 py-0.5 text-[11px] font-medium text-ink-700"
                  >
                    <ProviderIcon provider={t.socialAccount.provider} size={14} />
                    {t.socialAccount.accountName}
                    <span className="text-ink-400">· {postStatusLabel(t.status)}</span>
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {canEdit && onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                >
                  Düzenle
                </button>
              ) : null}
              {canEdit && onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent hover:bg-accent/15"
                >
                  Tekrar dene
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      onClose={onClose}
      title="Gönderiyi Görüntüle"
      onDelete={canEdit ? onDelete : undefined}
    >
      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div className="min-h-0 overflow-y-auto border-b border-ink-200 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink-800">Gönderi önizlemesi</p>
            <div className="flex gap-2">
              {canEdit && onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent"
                >
                  Tekrar dene
                </button>
              ) : null}
              {canEdit && onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 shadow-sm hover:bg-ink-50"
                >
                  Düzenle
                </button>
              ) : null}
            </div>
          </div>
          <PostPreview platform={platform} text={post.content} mediaUrl={thumb} />
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
            <span className={`rounded-md px-2 py-1 font-medium ${postStatusTone(post.status)}`}>
              {postStatusLabel(post.status)}
            </span>
            {when ? (
              <span>{format(when, "d MMM yyyy HH:mm", { locale: tr })}</span>
            ) : (
              <span>Tarih yok</span>
            )}
          </div>
          {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {post.targets.map((t) => (
              <span
                key={t.id}
                className="inline-flex max-w-full flex-col gap-0.5 rounded-xl border border-ink-100 bg-ink-50 px-2 py-1.5 text-xs font-medium text-ink-700"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ProviderIcon provider={t.socialAccount.provider} size={18} />
                  {t.socialAccount.accountName}
                  <span className="text-ink-400">· {postStatusLabel(t.status)}</span>
                </span>
                {t.errorMessage ? (
                  <span className="pl-6 text-[11px] font-normal text-rose-600">{t.errorMessage}</span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
        <div className="flex min-h-[200px] flex-col bg-[#fafbfc] p-4 lg:min-h-0">
          <p className="mb-2 text-sm font-semibold text-ink-800">Hesap hedefleri</p>
          <p className="text-sm text-ink-500">
            Bu gönderinin yayın durumu yukarıdaki hesap satırlarında görünür. Yorum özelliği yakında.
          </p>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  children,
  title,
  onClose,
  onDelete,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-ink-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(92dvh,820px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          <div className="flex items-center gap-1">
            {onDelete ? (
              <button
                type="button"
                title="Sil"
                onClick={onDelete}
                className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
              >
                Sil
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-ink-500 hover:bg-ink-50"
              aria-label="Kapat"
            >
              ×
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}

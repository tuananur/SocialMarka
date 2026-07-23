"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { PostPreview } from "./post-preview";
import { ProviderIcon } from "./provider-icon";
import {
  type ManagePost,
  postPreviewPlatform,
  postStatusLabel,
  postThumbnail,
} from "@/lib/post-display";

type Props = {
  post: ManagePost;
  canEdit: boolean;
  variant?: "full" | "compact";
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function PostDetailModal({
  post,
  canEdit,
  variant = "full",
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const [commentTab, setCommentTab] = useState<"team" | "public">("team");
  const thumb = postThumbnail(post);
  const platform = postPreviewPlatform(post);
  const when = post.scheduledAt ? new Date(post.scheduledAt) : null;

  if (variant === "compact") {
    const account = post.targets[0]?.socialAccount;
    return (
      <ModalShell onClose={onClose} title="Gönderi detayı" onDelete={canEdit ? onDelete : undefined}>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
          <div className="shrink-0">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumb}
                alt=""
                className="h-28 w-28 rounded-lg border border-ink-200 object-cover sm:h-32 sm:w-32"
              />
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
              <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                {postStatusLabel(post.status)}
              </span>
            </div>
            {when ? (
              <p className="mb-2 text-xs text-ink-500">
                📅 {format(when, "HH:mm, d MMMM yyyy", { locale: tr })}
              </p>
            ) : null}
            <p className="whitespace-pre-wrap text-sm text-ink-800">{post.content}</p>
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
            {canEdit && onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 shadow-sm hover:bg-ink-50"
              >
                ✎ Düzenle
              </button>
            ) : null}
          </div>
          <PostPreview platform={platform} text={post.content} mediaUrl={thumb} />
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
            <span className="rounded-md bg-ink-100 px-2 py-1 font-medium">
              {postStatusLabel(post.status)}
            </span>
            {when ? (
              <span>{format(when, "d MMM yyyy HH:mm", { locale: tr })}</span>
            ) : (
              <span>Tarih yok</span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {post.targets.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-ink-50 px-2 py-1 text-xs font-medium text-ink-700"
              >
                <ProviderIcon provider={t.socialAccount.provider} size={18} />
                {t.socialAccount.accountName}
              </span>
            ))}
          </div>
        </div>
        <div className="flex min-h-[240px] flex-col bg-[#fafbfc] lg:min-h-0">
          <p className="border-b border-ink-200 px-4 py-3 text-sm font-semibold text-ink-800">
            Yorumlar
          </p>
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-center text-sm text-ink-400">Henüz yorum yok.</p>
          </div>
          <div className="border-t border-ink-200 p-4">
            <div className="mb-2 flex gap-1 rounded-lg bg-ink-100/80 p-1">
              {(["team", "public"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCommentTab(tab)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold ${
                    commentTab === tab ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
                  }`}
                >
                  {tab === "team" ? "Ekip" : "Herkese açık"}
                </button>
              ))}
            </div>
            <textarea
              className="min-h-[72px] w-full resize-none rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Yanıt yazın…"
              disabled
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                disabled
                className="rounded-lg bg-accent/40 px-4 py-1.5 text-sm font-semibold text-white"
              >
                Gönder
              </button>
            </div>
          </div>
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
                🗑
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

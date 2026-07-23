"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ProviderIcon } from "./provider-icon";
import { type ManagePost, postStatusLabel, postThumbnail } from "@/lib/post-display";

export function PostManageCard({
  post,
  canEdit,
  onOpen,
  onEdit,
  onDelete,
}: {
  post: ManagePost;
  canEdit: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const thumb = postThumbnail(post);
  const when = post.scheduledAt ? new Date(post.scheduledAt) : null;
  const accounts = post.targets.map((t) => t.socialAccount);

  return (
    <article className="overflow-hidden rounded-xl border border-ink-200/80 bg-white shadow-[var(--shadow-soft)] transition hover:border-brand-200/80">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-start"
      >
        <div className="flex shrink-0 items-start gap-3">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              className="h-16 w-16 rounded-lg border border-ink-100 object-cover"
            />
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
              📅 {format(when, "d MMM yyyy HH:mm", { locale: tr })}
            </p>
          ) : null}
          <p className="mt-1 text-xs font-medium text-ink-400">{postStatusLabel(post.status)}</p>
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
            </p>
          ) : null}
        </div>
      </button>
      {canEdit ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 bg-[#fafbfc] px-4 py-2">
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
              onDelete();
            }}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            Sil
          </button>
        </div>
      ) : null}
    </article>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { tr } from "date-fns/locale";
import { Button, Input } from "@heroui/react";
import { ProviderIcon } from "@/components/posts/provider-icon";
import { PostDetailModal } from "@/components/posts/post-detail-modal";
import {
  type ManagePost,
  postStatusLabel,
  postThumbnail,
} from "@/lib/post-display";

type Post = ManagePost;

type View = "list" | "day" | "week" | "month";

export function CalendarView({ posts, canEdit = false }: { posts: Post[]; canEdit?: boolean }) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(new Date());
  const [search, setSearch] = useState("");
  const [detailPost, setDetailPost] = useState<Post | null>(null);

  const views: { id: View; label: string }[] = [
    { id: "list", label: "Liste" },
    { id: "day", label: "Gün" },
    { id: "week", label: "Hafta" },
    { id: "month", label: "Ay" },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => p.content.toLowerCase().includes(q));
  }, [posts, search]);

  const dayPosts = useMemo(
    () => filtered.filter((p) => p.scheduledAt && isSameDay(new Date(p.scheduledAt), cursor)),
    [filtered, cursor]
  );

  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStart = startOfMonth(cursor);
  const monthGridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthGridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const monthDays: Date[] = [];
  for (let d = monthGridStart; d <= monthGridEnd; d = addDays(d, 1)) {
    monthDays.push(d);
  }

  const monthLabel = format(cursor, "MMMM yyyy", { locale: tr });

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink-200/80 pb-3">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-ink-900">Takvim</h1>
          <p className="text-sm text-ink-500">Planlı gönderiler — küçük resim ve başlık</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onPress={() =>
              setCursor((c) =>
                view === "month" ? addMonths(c, -1) : addDays(c, view === "day" ? -1 : -7)
              )
            }
          >
            ←
          </Button>
          <Button variant="secondary" size="sm" onPress={() => setCursor(new Date())}>
            Bugün
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() =>
              setCursor((c) =>
                view === "month" ? addMonths(c, 1) : addDays(c, view === "day" ? 1 : 7)
              )
            }
          >
            →
          </Button>
          <span className="min-w-[8rem] px-2 text-center text-sm font-semibold capitalize">
            {view === "month" ? monthLabel : format(cursor, "d MMMM yyyy", { locale: tr })}
          </span>
          <div className="flex gap-1 rounded-lg border border-ink-200 bg-white p-0.5">
            {views.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                  view === v.id ? "bg-accent text-white" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-200/70 bg-white p-3">
        <Input
          fullWidth
          className="max-w-sm"
          placeholder="Bir gönderi ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {view === "list" && (
        <div className="space-y-2">
          {filtered.length === 0 && <Empty>Takvimde gönderi yok.</Empty>}
          {filtered.map((p) => (
            <CalendarListRow key={p.id} post={p} onOpen={() => setDetailPost(p)} />
          ))}
        </div>
      )}

      {view === "day" && (
        <div className="space-y-2 rounded-xl border border-ink-200 bg-white p-4">
          {dayPosts.length === 0 && <Empty>Bu günde planlı gönderi yok.</Empty>}
          {dayPosts.map((p) => (
            <CalendarListRow key={p.id} post={p} onOpen={() => setDetailPost(p)} />
          ))}
        </div>
      )}

      {view === "week" && (
        <div className="min-w-0 overflow-x-auto overscroll-x-contain pb-1">
          <div className="grid min-w-[52rem] gap-2 md:min-w-0 md:grid-cols-7">
            {weekDays.map((day) => {
              const items = filtered.filter(
                (p) => p.scheduledAt && isSameDay(new Date(p.scheduledAt), day)
              );
              return (
                <div
                  key={day.toISOString()}
                  className="min-h-[200px] min-w-0 rounded-xl border border-ink-200/80 bg-white p-2"
                >
                  <div className="mb-2 text-xs font-semibold text-ink-500">
                    {format(day, "EEE d", { locale: tr })}
                  </div>
                  <div className="space-y-1.5">
                    {items.map((p) => (
                      <CalendarCellPost key={p.id} post={p} onOpen={() => setDetailPost(p)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "month" && (
        <div className="overflow-hidden rounded-xl border border-ink-200/80 bg-white">
          <div className="overflow-x-auto">
            <div className="grid min-w-[48rem] grid-cols-7">
              {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"].map(
                (d) => (
                  <div
                    key={d}
                    className="border-b border-ink-100 p-2 text-center text-[11px] font-semibold text-ink-500"
                  >
                    {d}
                  </div>
                )
              )}
              {monthDays.map((day) => {
                const items = filtered.filter(
                  (p) => p.scheduledAt && isSameDay(new Date(p.scheduledAt), day)
                );
                const inMonth = isSameMonth(day, cursor);
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[120px] border-b border-r border-ink-100/80 p-1.5 ${
                      inMonth ? "bg-white" : "bg-ink-50/50"
                    }`}
                  >
                    <div
                      className={`mb-1 text-[11px] font-semibold ${
                        inMonth ? "text-ink-700" : "text-ink-400"
                      }`}
                    >
                      {format(day, "d")}
                      {!inMonth ? (
                        <span className="ml-0.5 text-[10px] font-normal">
                          {format(day, "MMM", { locale: tr })}
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      {items.slice(0, 4).map((p) => (
                        <CalendarCellPost key={p.id} post={p} compact onOpen={() => setDetailPost(p)} />
                      ))}
                      {items.length > 4 ? (
                        <p className="text-[10px] font-medium text-accent">+{items.length - 4} daha</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {detailPost ? (
        <PostDetailModal
          post={detailPost}
          canEdit={canEdit}
          variant="compact"
          onClose={() => setDetailPost(null)}
          onEdit={
            canEdit
              ? () => {
                  const id = detailPost.id;
                  setDetailPost(null);
                  router.push(`/posts?edit=${id}`);
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-8 text-center text-sm text-ink-400">{children}</div>;
}

function CalendarListRow({ post, onOpen }: { post: Post; onOpen: () => void }) {
  const thumb = postThumbnail(post);
  const mime = post.media?.[0]?.mimeType || "";
  const isVideo =
    mime.startsWith("video/") ||
    Boolean(thumb && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(thumb));
  const when = post.scheduledAt ? new Date(post.scheduledAt) : null;
  const account = post.targets[0]?.socialAccount;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-ink-200/80 bg-white p-3 text-left hover:border-brand-200"
    >
      {thumb ? (
        isVideo ? (
          <video
            src={thumb}
            muted
            playsInline
            preload="metadata"
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
        )
      ) : (
        <div className="h-12 w-12 shrink-0 rounded-lg bg-ink-100" />
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm text-ink-800">{post.content}</p>
        <p className="text-xs text-ink-500">
          {when ? format(when, "d MMM yyyy HH:mm", { locale: tr }) : "—"} ·{" "}
          {postStatusLabel(post.status)}
        </p>
      </div>
      {account ? <ProviderIcon provider={account.provider} size={20} /> : null}
    </button>
  );
}

function CalendarCellPost({
  post,
  compact,
  onOpen,
}: {
  post: Post;
  compact?: boolean;
  onOpen: () => void;
}) {
  const thumb = postThumbnail(post);
  const mime = post.media?.[0]?.mimeType || "";
  const isVideo =
    mime.startsWith("video/") ||
    Boolean(thumb && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(thumb));
  const when = post.scheduledAt ? new Date(post.scheduledAt) : null;
  const account = post.targets[0]?.socialAccount;
  const title = post.content.trim().split("\n")[0] || "Gönderi";
  const thumbClass = `shrink-0 rounded object-cover ${compact ? "h-7 w-7" : "h-9 w-9"}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full min-w-0 gap-1.5 rounded-md border border-ink-100 bg-[#fafbfc] p-1 text-left transition hover:border-brand-200 hover:bg-white"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-1">
          {account ? <ProviderIcon provider={account.provider} size={14} /> : null}
          <span className="truncate text-[10px] font-semibold text-ink-700">
            {account?.accountName || "Hesap"}
          </span>
          {when ? (
            <span className="ml-auto shrink-0 text-[9px] tabular-nums text-ink-400">
              {format(when, "HH:mm")}
            </span>
          ) : null}
        </div>
        <div className="flex gap-1">
          {thumb ? (
            isVideo ? (
              <video src={thumb} muted playsInline preload="metadata" className={thumbClass} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className={thumbClass} />
            )
          ) : (
            <div className={`shrink-0 rounded bg-ink-200 ${compact ? "h-7 w-7" : "h-9 w-9"}`} />
          )}
          <p className={`line-clamp-2 flex-1 text-ink-700 ${compact ? "text-[9px] leading-tight" : "text-[10px] leading-snug"}`}>
            {title}
          </p>
        </div>
      </div>
    </button>
  );
}

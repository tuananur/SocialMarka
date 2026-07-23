"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Input, Alert } from "@heroui/react";
import { PostPreview } from "./post-preview";
import { ProviderBadge, ProviderIcon } from "./provider-icon";
import { ComposerMediaPreview } from "./composer-media-preview";
import { PostDetailModal } from "./post-detail-modal";
import { PostManageCard } from "./post-manage-card";
import type { ManagePost } from "@/lib/post-display";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const QUICK_EMOJIS = ["😀", "🔥", "✨", "📢", "🚀", "💡", "✅", "❤️", "🎉", "📈", "🙌", "💼"];

type Account = {
  id: string;
  accountName: string;
  provider: string;
  groups: { id: string; name: string }[];
};

type Group = {
  id: string;
  name: string;
  accounts: Account[];
};

type Post = ManagePost & {
  targets: (ManagePost["targets"][number] & {
    platformContent: string | null;
    socialAccount: Account;
  })[];
};

const listTabs = [
  { id: "SCHEDULED", label: "Sıradakiler" },
  { id: "DRAFT", label: "Taslaklar" },
  { id: "FAILED", label: "Hatalı" },
  { id: "PUBLISHED", label: "Yayınlanan" },
  { id: "PENDING_REVIEW", label: "Onay Bekleyen" },
];

const PLATFORMS = [
  { id: "ORIGINAL", label: "Orijinal Taslak", color: "bg-slate-700" },
  { id: "FACEBOOK", label: "Facebook", color: "bg-[#1877F2]" },
  { id: "INSTAGRAM", label: "Instagram", color: "bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" },
  { id: "LINKEDIN", label: "LinkedIn", color: "bg-[#0A66C2]" },
  { id: "YOUTUBE", label: "YouTube", color: "bg-[#FF0000]" },
  { id: "X", label: "X", color: "bg-zinc-900" },
  { id: "PINTEREST", label: "Pinterest", color: "bg-[#E60023]" },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

export function PostsWorkspace({
  canEdit,
  initialPosts,
  groups,
  accounts,
}: {
  canEdit: boolean;
  initialPosts: Post[];
  groups: Group[];
  accounts: Account[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [mode, setMode] = useState<"list" | "compose">("list");
  const [listTab, setListTab] = useState("SCHEDULED");
  const [content, setContent] = useState("");
  const [platformContents, setPlatformContents] = useState<Record<string, string>>({});
  const [firstComments, setFirstComments] = useState<Record<string, string>>({});
  const [activePlatform, setActivePlatform] = useState<PlatformId>("ORIGINAL");
  const [postFormat, setPostFormat] = useState<"post" | "story" | "reel">("post");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [accountQuery, setAccountQuery] = useState("");
  const [groupQuery, setGroupQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState<"group" | "client">("group");
  const [scheduledAt, setScheduledAt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaMime, setMediaMime] = useState<string | null>(null);
  const [mediaFileName, setMediaFileName] = useState<string | null>(null);
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [rightTab, setRightTab] = useState<"preview" | "accounts">("accounts");
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [postSearch, setPostSearch] = useState("");
  const [pinTitle, setPinTitle] = useState("");
  const [pinLink, setPinLink] = useState("");
  const [pinAlt, setPinAlt] = useState(false);
  const [ytPrivacy, setYtPrivacy] = useState<"public" | "private" | "unlisted">("public");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const openedEditFromQuery = useRef<string | null>(null);

  const filteredGroups = useMemo(() => {
    const q = groupQuery.toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, groupQuery]);

  const filteredAccounts = useMemo(() => {
    const q = accountQuery.toLowerCase();
    return accounts.filter(
      (a) =>
        a.accountName.toLowerCase().includes(q) || a.provider.toLowerCase().includes(q)
    );
  }, [accounts, accountQuery]);

  const filteredPosts = posts.filter((p) => {
    const q = postSearch.trim().toLowerCase();
    if (q && !p.content.toLowerCase().includes(q)) return false;
    if (listTab === "FAILED") return p.status === "FAILED" || p.status === "PARTIAL_FAILED";
    if (listTab === "DRAFT") return p.status === "DRAFT" || !p.scheduledAt;
    return p.status === listTab;
  });

  const draftText =
    activePlatform === "ORIGINAL" ? content : platformContents[activePlatform] ?? "";
  const charCount = draftText.length;
  const charLimit = activePlatform === "X" ? 280 : activePlatform === "PINTEREST" ? 500 : null;
  const showFormatTabs =
    activePlatform === "INSTAGRAM" || activePlatform === "FACEBOOK";
  const showFirstComment =
    activePlatform === "FACEBOOK" ||
    activePlatform === "INSTAGRAM" ||
    activePlatform === "LINKEDIN";

  /** Orijinal veya platform sekmesindeki metin — YouTube vb. sekmelerde yazınca content boş kalabiliyor */
  const captionText = useMemo(() => {
    const fromOriginal = content.trim();
    if (fromOriginal) return fromOriginal;
    const fromActive = draftText.trim();
    if (fromActive) return fromActive;
    for (const v of Object.values(platformContents)) {
      const t = v?.trim();
      if (t) return t;
    }
    return "";
  }, [content, draftText, platformContents]);
  const hasCaption = captionText.length > 0;

  function setDraftText(value: string) {
    if (activePlatform === "ORIGINAL") setContent(value);
    else {
      setPlatformContents((prev) => ({ ...prev, [activePlatform]: value }));
      // Orijinal boşsa ana içeriği de doldur — kayıt / buton kilidi için
      if (!content.trim()) setContent(value);
    }
  }

  function buildPlatformContents(): Record<string, string> {
    const out = { ...platformContents };
    for (const [provider, comment] of Object.entries(firstComments)) {
      if (!comment.trim()) continue;
      const base = out[provider] || content;
      out[provider] = `${base}\n\n[İlk yorum]: ${comment.trim()}`;
    }
    if (activePlatform === "PINTEREST" || out.PINTEREST || pinTitle || pinLink) {
      const base = out.PINTEREST || content;
      const bits = [base];
      if (pinTitle) bits.unshift(`Başlık: ${pinTitle}`);
      if (pinLink) bits.push(`Link: ${pinLink}`);
      if (pinAlt) bits.push("Alt text: açık");
      out.PINTEREST = bits.filter(Boolean).join("\n");
    }
    if (out.YOUTUBE || activePlatform === "YOUTUBE") {
      const base = out.YOUTUBE || content;
      out.YOUTUBE = `${base}\n\n[Gizlilik]: ${ytPrivacy}`;
    }
    return out;
  }

  function selectGroup(group: Group) {
    const ids = group.accounts.map((a) => a.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedAccountIds.includes(id));
    if (allSelected) {
      setSelectedAccountIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedAccountIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  }

  function toggleAccount(id: string) {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAllAccounts() {
    if (
      filteredAccounts.length > 0 &&
      filteredAccounts.every((a) => selectedAccountIds.includes(a.id))
    ) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(filteredAccounts.map((a) => a.id));
    }
  }

  const previewPlatform =
    activePlatform === "ORIGINAL"
      ? accounts.find((a) => selectedAccountIds.includes(a.id))?.provider || "LINKEDIN"
      : activePlatform;

  async function refresh() {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.posts || []);
  }

  function resetCompose() {
    setEditingId(null);
    setContent("");
    setPlatformContents({});
    setFirstComments({});
    setSelectedAccountIds([]);
    setScheduledAt("");
    clearMediaPreview();
    setShowEmojis(false);
    setShowMediaMenu(false);
    setPinTitle("");
    setPinLink("");
    setPinAlt(false);
    setYtPrivacy("public");
    setPostFormat("post");
    setActivePlatform("ORIGINAL");
  }

  async function savePost(opts: { shareNow?: boolean; asDraft?: boolean } = {}) {
    if (!canEdit) return;
    setBusy(true);
    setMessage(null);
    try {
      const postContent = (content.trim() || captionText).trim();
      if (!postContent) throw new Error("Gönderi metni gerekli");
      if (!opts.asDraft && selectedAccountIds.length === 0) {
        throw new Error("En az bir hesap seçin");
      }
      if (!opts.asDraft && !opts.shareNow && !scheduledAt) {
        throw new Error("Zamanlama için tarih seçin veya Hemen Paylaş / Taslak kullanın");
      }

      const selectedProviders = accounts
        .filter((a) => selectedAccountIds.includes(a.id))
        .map((a) => a.provider);
      if (
        !opts.asDraft &&
        selectedProviders.includes("YOUTUBE") &&
        !mediaAssetId
      ) {
        throw new Error("YouTube için video medyası ekleyin");
      }

      const body = {
        id: editingId,
        content: postContent,
        platformContents: buildPlatformContents(),
        socialAccountIds: selectedAccountIds,
        scheduledAt: opts.asDraft ? null : scheduledAt || null,
        shareNow: !!opts.shareNow,
        status: opts.asDraft ? "DRAFT" : undefined,
        mediaAssetIds: mediaAssetId ? [mediaAssetId] : [],
      };
      const res = await fetch("/api/posts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kayıt başarısız");

      setMessage(
        opts.shareNow
          ? "Hemen paylaşım kuyruğa alındı."
          : opts.asDraft
            ? "Taslak kaydedildi."
            : "Gönderi zamanlandı."
      );
      resetCompose();
      setMode("list");
      if (opts.asDraft) setListTab("DRAFT");
      else if (opts.shareNow) setListTab("SCHEDULED");
      else setListTab("SCHEDULED");
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  function openEdit(post: Post) {
    setEditingId(post.id);
    setContent(post.content);
    const pc: Record<string, string> = {};
    for (const t of post.targets) {
      if (t.platformContent) pc[t.socialAccount.provider] = t.platformContent;
    }
    setPlatformContents(pc);
    setSelectedAccountIds(
      post.targets
        .map((t) => t.socialAccount.id)
        .filter((id): id is string => Boolean(id)),
    );
    setScheduledAt(post.scheduledAt ? post.scheduledAt.slice(0, 16) : "");
    const m = post.media?.[0];
    if (m) {
      const url = m.thumbnailUrl || m.originalUrl;
      if (url && !url.includes("placehold.co") && !url.includes("/uploads/pending/")) {
        setMediaPreview(url);
        setMediaMime(m.mimeType || null);
        setMediaAssetId(m.id || null);
      }
    }
    setMode("compose");
  }

  function openCompose() {
    resetCompose();
    setMode("compose");
    setRightTab(accounts.length ? "accounts" : "preview");
  }

  async function shareNow(postId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/posts/${postId}/share-now`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Paylaşım başarısız");
      setMessage("Hemen paylaşım kuyruğa alındı.");
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(false);
    }
  }

  function requestDeletePost(postId: string) {
    if (!canEdit) return;
    setDeleteConfirmId(postId);
  }

  async function confirmDeletePost() {
    const postId = deleteConfirmId;
    if (!postId || !canEdit) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silinemedi");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (detailPost?.id === postId) setDetailPost(null);
      if (editingId === postId) {
        setMode("list");
        resetCompose();
      }
      setMessage("Gönderi silindi.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setBusy(false);
      setDeleteConfirmId(null);
    }
  }

  function openDetail(post: Post) {
    setDetailPost(post);
  }

  function clearMediaPreview() {
    setMediaPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setMediaMime(null);
    setMediaFileName(null);
    setMediaAssetId(null);
  }

  function setMediaFromUrl(url: string) {
    clearMediaPreview();
    setMediaPreview(url);
    setMediaMime(null);
    setMediaFileName(null);
    setMediaAssetId(null);
  }

  function editFromDetail() {
    if (!detailPost) return;
    setDetailPost(null);
    openEdit(detailPost);
  }

  async function uploadMedia(file: File) {
    if (!canEdit) return;
    setBusy(true);
    setMessage(null);
    setShowMediaMenu(false);
    try {
      const res = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          postId: editingId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yükleme başarısız");

      let publicUrl = String(data.publicUrl || "");
      const assetId = String(data.assetId || "");
      if (!assetId) throw new Error("Medya kaydı oluşmadı");

      if (data.uploadUrl) {
        const put = await fetch(data.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });
        if (!put.ok) throw new Error("Dosya yüklemesi başarısız");
      } else {
        // No R2/Blob presign — upload bytes via server (local disk or Vercel Blob)
        const form = new FormData();
        form.set("file", file);
        form.set("assetId", assetId);
        const local = await fetch("/api/uploads/local", {
          method: "POST",
          body: form,
        });
        const localData = await local.json();
        if (!local.ok) throw new Error(localData.error || "Dosya kaydedilemedi");
        publicUrl = String(localData.publicUrl || publicUrl);
      }

      setMediaAssetId(assetId);
      setMediaPreview(publicUrl);
      setMediaMime(file.type || null);
      setMediaFileName(file.name);
      setMessage("Medya yüklendi.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Medya yüklenemedi");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "compose") {
    return (
      <>
      <div className="fixed inset-x-0 bottom-0 top-14 z-[25] flex flex-col bg-[#f3f5f7] md:left-[15.5rem]">
        {/* Header tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200/80 bg-white px-4 py-0">
          <div className="flex items-center gap-0">
            <HeaderTab active label="Gönderi Oluştur" />
            <HeaderTab
              label="Taslaklar"
              onClick={() => {
                setMode("list");
                setListTab("DRAFT");
              }}
            />
            <HeaderTab label="Akış" disabled />
          </div>
          <div className="flex items-center gap-1">
            {editingId && canEdit ? (
              <button
                type="button"
                className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                onClick={() => requestDeletePost(editingId)}
              >
                Sil
              </button>
            ) : null}
            <button
              type="button"
              className="px-3 py-3 text-lg text-ink-400 hover:text-ink-800"
              onClick={() => setMode("list")}
              aria-label="Kapat"
            >
              ×
            </button>
          </div>
        </div>

        {message ? (
          <div className="border-b border-brand-100 bg-brand-50 px-4 py-2 text-sm text-ink-700">
            {message}
            <button type="button" className="ml-3 text-accent underline" onClick={() => setMessage(null)}>
              Kapat
            </button>
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-rows-[1fr] lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px]">
          {/* LEFT composer */}
          <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain border-r border-ink-200/70 bg-white p-4 sm:p-5">
            {/* Platform icons */}
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              {PLATFORMS.map((p) => {
                const active = activePlatform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    title={p.label}
                    disabled={!canEdit}
                    onClick={() => setActivePlatform(p.id)}
                    className={`relative flex h-11 w-11 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm transition ${p.color} ${
                      active ? "ring-2 ring-amber-400 ring-offset-2" : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    {p.id === "ORIGINAL" ? "OR" : p.id.slice(0, 2)}
                  </button>
                );
              })}
            </div>

            {showFormatTabs ? (
              <div className="mb-3 flex gap-1 rounded-lg bg-ink-50 p-1">
                {(
                  [
                    { id: "post", label: "Gönderi" },
                    { id: "story", label: "Hikâye" },
                    { id: "reel", label: "Reel" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPostFormat(f.id)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                      postFormat === f.id
                        ? "bg-white text-ink-900 shadow-sm"
                        : "text-ink-500 hover:text-ink-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Media dropzone */}
            <div className="relative mb-4">
              {mediaPreview ? (
                <ComposerMediaPreview
                  url={mediaPreview}
                  mimeHint={mediaMime || undefined}
                  fileName={mediaFileName || undefined}
                  onRemove={canEdit ? clearMediaPreview : undefined}
                  className="mb-2"
                />
              ) : null}
              <div
                className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 bg-[#fafbfc] px-4 transition hover:border-accent/50 hover:bg-brand-50/30 ${
                  mediaPreview ? "py-4" : "py-8"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files?.[0];
                  if (f) void uploadMedia(f);
                }}
              >
                {!mediaPreview ? (
                  <>
                    <span className="text-3xl text-ink-300">⬆</span>
                    <span className="text-sm font-semibold text-ink-700">
                      Dosyaları sürükleyin veya yükleyin
                    </span>
                    <span className="text-xs text-ink-400">PNG, JPG, GIF, WEBP, MP4, MOV, WEBM</span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-ink-500">Başka dosya eklemek için sürükleyin</span>
                )}
                <button
                  type="button"
                  disabled={!canEdit || busy}
                  onClick={() => setShowMediaMenu((v) => !v)}
                  className="mt-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-accent/40"
                >
                  Medya ekle
                </button>
              </div>

              {showMediaMenu ? (
                <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl border border-brand-200 bg-white p-3 shadow-xl">
                  <p className="mb-2 text-sm font-semibold text-ink-800">Medya Ekle</p>
                  <div className="mb-3 flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-accent"
                      placeholder="Görsel URL girin"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = (e.target as HTMLInputElement).value.trim();
                          if (v) {
                            setMediaFromUrl(v);
                            setShowMediaMenu(false);
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="text-sm font-semibold text-accent"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Yükle
                    </button>
                  </div>
                  <p className="mb-1 text-xs font-semibold text-ink-500">Görsel veya video yükle</p>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-ink-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="text-lg">☁</span> Cihazımdan
                  </button>
                  <div className="px-3 py-2 text-sm text-ink-400">Dropbox — yakında</div>
                  <div className="px-3 py-2 text-sm text-ink-400">Google Drive — yakında</div>
                </div>
              ) : null}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadMedia(f);
                e.target.value = "";
              }}
            />

            {/* Pinterest fields */}
            {activePlatform === "PINTEREST" ? (
              <div className="mb-3 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-500">Hedef link</label>
                  <Input fullWidth value={pinLink} onChange={(e) => setPinLink(e.target.value)} placeholder="https://" disabled={!canEdit} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-500">Başlık</label>
                  <div className="relative">
                    <Input fullWidth value={pinTitle} onChange={(e) => setPinTitle(e.target.value.slice(0, 100))} disabled={!canEdit} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-400">
                      {pinTitle.length}/100
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Caption */}
            <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                disabled={!canEdit}
                placeholder="Gönderi metnini yazın veya ✨ AI Pilot ile oluşturun"
                className="min-h-[160px] w-full resize-none px-4 py-3 text-sm text-ink-900 outline-none placeholder:text-ink-400"
              />
              <div className="flex flex-wrap items-center gap-1 border-t border-ink-100 bg-[#fafbfc] px-2 py-2">
                <ToolIcon label="📎" title="Medya" onClick={() => setShowMediaMenu((v) => !v)} disabled={!canEdit} />
                <ToolIcon label="😊" title="Emoji" onClick={() => setShowEmojis((v) => !v)} disabled={!canEdit} />
                <ToolIcon label="#" title="Hashtag" onClick={() => setDraftText(draftText + " #")} disabled={!canEdit} />
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() =>
                    setDraftText(
                      "Markanız için ilham verici bir içerik: Bugün hedef kitlenize değer katacak bir ipucu paylaşın. #SocialMarka"
                    )
                  }
                  className="ml-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
                >
                  ✨ AI <span className="rounded bg-emerald-500 px-1 text-[9px] text-white">YENİ</span>
                </button>
                <span
                  className={`ml-auto pr-2 text-xs tabular-nums ${
                    charLimit && charCount > charLimit ? "font-bold text-rose-600" : "text-ink-400"
                  }`}
                >
                  {charLimit ? `${charCount}/${charLimit}` : charCount}
                </span>
              </div>
            </div>

            {showEmojis ? (
              <div className="mt-2 flex flex-wrap gap-1 rounded-xl border border-ink-100 bg-white p-2 shadow-sm">
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="rounded-lg px-2 py-1 text-lg hover:bg-ink-50"
                    onClick={() => setDraftText(draftText + e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            ) : null}

            {activePlatform === "PINTEREST" ? (
              <label className="mt-3 flex items-center gap-2 text-sm text-ink-600">
                <input type="checkbox" checked={pinAlt} onChange={(e) => setPinAlt(e.target.checked)} />
                Pin için alt metin
              </label>
            ) : null}

            {activePlatform === "YOUTUBE" ? (
              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold text-ink-500">Gizlilik</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  {(
                    [
                      { id: "public", label: "Herkese açık" },
                      { id: "private", label: "Özel" },
                      { id: "unlisted", label: "Liste dışı" },
                    ] as const
                  ).map((o) => (
                    <label key={o.id} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="ytPrivacy"
                        checked={ytPrivacy === o.id}
                        onChange={() => setYtPrivacy(o.id)}
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {/* First comment */}
            {showFirstComment ? (
              <div className="mt-4 rounded-xl border border-ink-200 bg-[#f7f8fa] p-3">
                <p className="mb-2 text-sm font-semibold text-ink-800">
                  {activePlatform === "FACEBOOK"
                    ? "Facebook"
                    : activePlatform === "INSTAGRAM"
                      ? "Instagram"
                      : "LinkedIn"}{" "}
                  İlk Yorum
                </p>
                <textarea
                  value={firstComments[activePlatform] || ""}
                  onChange={(e) =>
                    setFirstComments((prev) => ({ ...prev, [activePlatform]: e.target.value }))
                  }
                  disabled={!canEdit}
                  placeholder={`${activePlatform} ilk yorumunu yazın`}
                  className="min-h-[72px] w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none"
                />
              </div>
            ) : null}

            {/* Footer actions */}
            <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-ink-100 pt-4">
              <div className="min-w-[220px] flex-1">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  Zamanlama
                </label>
                <Input
                  type="datetime-local"
                  fullWidth
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="font-semibold"
                  isDisabled={!canEdit || busy || !hasCaption}
                  onPress={() => savePost({ asDraft: true })}
                >
                  Taslak Kaydet
                </Button>
                <Button
                  variant="secondary"
                  className="font-semibold"
                  isDisabled={!canEdit || busy || !hasCaption || selectedAccountIds.length === 0}
                  onPress={() => savePost({ shareNow: true })}
                >
                  Hemen Paylaş
                </Button>
                <Button
                  variant="primary"
                  className="font-semibold shadow-md shadow-accent/25"
                  isDisabled={
                    !canEdit || busy || !hasCaption || selectedAccountIds.length === 0 || !scheduledAt
                  }
                  onPress={() => savePost()}
                >
                  📅 Zamanla
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT panel */}
          <aside className="flex min-h-0 flex-col bg-white">
            <div className="flex border-b border-ink-200">
              {(
                [
                  { id: "preview", label: "Önizleme" },
                  { id: "accounts", label: "Hesaplar" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRightTab(t.id)}
                  className={`relative flex-1 px-3 py-3 text-sm font-semibold ${
                    rightTab === t.id ? "text-ink-900" : "text-ink-400"
                  }`}
                >
                  {t.label}
                  {rightTab === t.id ? (
                    <span className="absolute inset-x-4 bottom-0 h-[3px] rounded-full bg-amber-400" />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              {rightTab === "preview" ? (
                <PostPreview
                  platform={previewPlatform}
                  text={draftText || content}
                  mediaUrl={mediaPreview}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-1 rounded-lg bg-ink-50 p-1">
                    <button
                      type="button"
                      className={`flex-1 rounded-md py-1.5 text-sm font-semibold ${
                        accountFilter === "group" ? "bg-white shadow-sm" : "text-ink-500"
                      }`}
                      onClick={() => setAccountFilter("group")}
                    >
                      Grup
                    </button>
                    <button
                      type="button"
                      className={`flex-1 rounded-md py-1.5 text-sm font-semibold ${
                        accountFilter === "client" ? "bg-white shadow-sm" : "text-ink-500"
                      }`}
                      onClick={() => setAccountFilter("client")}
                    >
                      Hesap
                    </button>
                  </div>

                  {accountFilter === "group" ? (
                    <div>
                      <Input
                        fullWidth
                        value={groupQuery}
                        onChange={(e) => setGroupQuery(e.target.value)}
                        placeholder="Grup ara..."
                        className="mb-2"
                      />
                      <div className="space-y-1">
                        {filteredGroups.length === 0 ? (
                          <p className="py-4 text-center text-xs text-ink-400">Grup yok</p>
                        ) : null}
                        {filteredGroups.map((g) => {
                          const ids = g.accounts.map((a) => a.id);
                          const checked =
                            ids.length > 0 && ids.every((id) => selectedAccountIds.includes(id));
                          return (
                            <label
                              key={g.id}
                              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-ink-50"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!canEdit || ids.length === 0}
                                onChange={() => selectGroup(g)}
                                className="h-4 w-4 accent-[var(--accent)]"
                              />
                              <span className="text-sm font-medium text-ink-800">{g.name}</span>
                              <span className="text-xs text-ink-400">({g.accounts.length})</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Input
                        fullWidth
                        value={accountQuery}
                        onChange={(e) => setAccountQuery(e.target.value)}
                        placeholder="Hesap ara..."
                      />
                    </div>
                    <label className="mb-2 flex cursor-pointer items-center gap-2 px-1 text-sm font-semibold text-ink-700">
                      <input
                        type="checkbox"
                        checked={
                          filteredAccounts.length > 0 &&
                          filteredAccounts.every((a) => selectedAccountIds.includes(a.id))
                        }
                        onChange={selectAllAccounts}
                        disabled={!canEdit || filteredAccounts.length === 0}
                        className="h-4 w-4"
                      />
                      Tümünü seç
                    </label>
                    <div className="max-h-[420px] space-y-0.5 overflow-y-auto">
                      {filteredAccounts.length === 0 ? (
                        <p className="py-8 text-center text-sm text-ink-400">
                          Bağlı hesap yok.
                          <br />
                          <a href="/accounts/create" className="font-semibold text-accent underline">
                            Hesap bağla
                          </a>
                        </p>
                      ) : null}
                      {filteredAccounts.map((a) => (
                          <label
                            key={a.id}
                            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2.5 hover:bg-ink-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAccountIds.includes(a.id)}
                              disabled={!canEdit}
                              onChange={() => toggleAccount(a.id)}
                              className="h-4 w-4"
                            />
                            <ProviderIcon provider={a.provider} size={22} />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800">
                              {a.accountName}
                            </span>
                          </label>
                        ))}
                    </div>
                    <p className="mt-3 text-center text-xs text-ink-400">
                      Seçili: {selectedAccountIds.length}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
      <ConfirmDialog
        open={!!deleteConfirmId}
        title="Gönderiyi sil"
        description="Bu gönderi kalıcı olarak silinecek. Bu işlem geri alınamaz."
        confirmLabel="Evet, sil"
        danger
        busy={busy}
        onConfirm={() => void confirmDeletePost()}
        onCancel={() => setDeleteConfirmId(null)}
      />
      </>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-ink-900">
            Gönderileri Yönet
          </h1>
          <p className="text-sm text-ink-500">Eklediklerinizi görün, detay açın veya düzenleyin</p>
        </div>
        {canEdit ? (
          <Button variant="primary" className="font-semibold shadow-md shadow-accent/20" onPress={openCompose}>
            + Yeni Gönderi
          </Button>
        ) : null}
      </div>

      {message ? (
        <Alert status="accent">
          <Alert.Content>
            <Alert.Description>{message}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-1 border-b border-ink-200/70 bg-white px-1">
        {listTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setListTab(t.id)}
            className={`relative px-3 py-2.5 text-sm font-semibold ${
              listTab === t.id ? "text-ink-900" : "text-ink-400 hover:text-ink-700"
            }`}
          >
            {t.label}
            {listTab === t.id ? (
              <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-amber-400" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-200/70 bg-white p-3">
        <Input
          fullWidth
          className="max-w-md"
          placeholder="Gönderi ara…"
          value={postSearch}
          onChange={(e) => setPostSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-white py-14 text-center">
            <p className="text-sm text-ink-500">Bu sekmede gönderi yok.</p>
            {canEdit ? (
              <Button variant="primary" className="mt-4" onPress={openCompose}>
                Gönderi oluştur
              </Button>
            ) : null}
          </div>
        ) : null}
        {filteredPosts.map((post) => (
          <PostManageCard
            key={post.id}
            post={post}
            canEdit={canEdit}
            onOpen={() => openDetail(post)}
            onEdit={() => openEdit(post)}
            onDelete={() => requestDeletePost(post.id)}
          />
        ))}
      </div>

      {detailPost ? (
        <PostDetailModal
          post={detailPost}
          canEdit={canEdit}
          variant="full"
          onClose={() => setDetailPost(null)}
          onEdit={editFromDetail}
          onDelete={() => requestDeletePost(detailPost.id)}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleteConfirmId}
        title="Gönderiyi sil"
        description="Bu gönderi kalıcı olarak silinecek. Bu işlem geri alınamaz."
        confirmLabel="Evet, sil"
        danger
        busy={busy}
        onConfirm={() => void confirmDeletePost()}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

function HeaderTab({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`relative px-4 py-3.5 text-sm font-semibold disabled:opacity-40 ${
        active ? "text-ink-900" : "text-ink-400 hover:text-ink-700"
      }`}
    >
      {label}
      {active ? (
        <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-amber-400" />
      ) : null}
    </button>
  );
}

function ToolIcon({
  label,
  title,
  onClick,
  disabled,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md px-2 py-1 text-sm hover:bg-ink-100 disabled:opacity-40"
    >
      {label}
    </button>
  );
}

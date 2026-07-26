"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Input, Alert } from "@heroui/react";
import { PostDetailModal } from "./post-detail-modal";
import { PostManageCard } from "./post-manage-card";
import { ComposerShell } from "./composer/composer-shell";
import { useComposerState } from "./composer/use-composer-state";
import type { ComposerAccount, ComposerGroup, MediaItem } from "./composer/composer-types";
import type { ManagePost } from "@/lib/post-display";
import {
  isUsableMediaUrl,
  listTabForStatus,
} from "@/lib/post-display";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Account = ComposerAccount;
type Group = ComposerGroup;

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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [postSearch, setPostSearch] = useState("");
  const [accountQuery, setAccountQuery] = useState("");
  const [groupQuery, setGroupQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState<"group" | "client">("group");
  const searchParams = useSearchParams();
  const openedEditFromQuery = useRef<string | null>(null);

  const composer = useComposerState(accounts);

  const filteredGroups = useMemo(() => {
    const q = groupQuery.toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, groupQuery]);

  const filteredAccounts = useMemo(() => {
    const q = accountQuery.toLowerCase();
    return accounts.filter(
      (a) =>
        a.accountName.toLowerCase().includes(q) || a.provider.toLowerCase().includes(q),
    );
  }, [accounts, accountQuery]);

  const filteredPosts = posts.filter((p) => {
    const q = postSearch.trim().toLowerCase();
    if (q && !p.content.toLowerCase().includes(q)) return false;
    if (listTab === "FAILED") return p.status === "FAILED" || p.status === "PARTIAL_FAILED";
    if (listTab === "DRAFT") return p.status === "DRAFT";
    return p.status === listTab;
  });

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of listTabs) counts[t.id] = 0;
    for (const p of posts) {
      const tab = listTabForStatus(p.status);
      counts[tab] = (counts[tab] || 0) + 1;
    }
    return counts;
  }, [posts]);

  async function refresh() {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.posts || []);
  }

  function selectGroup(group: Group) {
    const ids = group.accounts.map((a) => a.id);
    const allSelected = ids.length > 0 && ids.every((id) => composer.selectedAccountIds.includes(id));
    if (allSelected) {
      composer.setSelectedAccountIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      composer.setSelectedAccountIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  }

  function toggleAccount(id: string) {
    composer.setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function selectAllAccounts() {
    if (
      filteredAccounts.length > 0 &&
      filteredAccounts.every((a) => composer.selectedAccountIds.includes(a.id))
    ) {
      composer.setSelectedAccountIds([]);
    } else {
      composer.setSelectedAccountIds(filteredAccounts.map((a) => a.id));
    }
  }

  function formatResultsMessage(data: {
    summary?: { success?: number; failed?: number; pending?: number };
    results?: { success: boolean; accountName?: string; provider?: string; error?: string | null }[];
    post?: { status?: string };
  }, kind: "share" | "schedule" | "draft") {
    if (kind === "draft") return "Taslak kaydedildi.";
    const summary = data.summary;
    const results = data.results || [];
    const failed = results.filter((r) => !r.success && r.error);
    if (summary) {
      const ok = summary.success || 0;
      const bad = summary.failed || 0;
      const pending = summary.pending || 0;
      if (bad > 0) {
        const details = failed
          .slice(0, 3)
          .map((r) => `${r.accountName || r.provider}: ${r.error}`)
          .join(" · ");
        return `${ok} başarılı, ${bad} hatalı${pending ? `, ${pending} bekliyor` : ""}.${details ? ` ${details}` : ""}`;
      }
      if (ok > 0) return kind === "share" ? `${ok} hesapta yayınlandı.` : "Gönderi zamanlandı.";
      if (pending > 0) return "Gönderi zamanlandı — Sıradakiler / Takvim’de görünür.";
    }
    const savedStatus = String(data.post?.status || "");
    if (savedStatus === "PUBLISHED") return "Gönderi yayınlandı.";
    if (savedStatus === "FAILED" || savedStatus === "PARTIAL_FAILED") {
      return "Paylaşım tamamlanamadı — Hatalı sekmesine bakın.";
    }
    return kind === "share" ? "Hemen paylaşım işlendi." : "Gönderi zamanlandı.";
  }

  async function savePost(opts: { shareNow?: boolean; asDraft?: boolean } = {}) {
    if (!canEdit) return;
    const issues = composer.validateForSave(opts);
    if (issues.length) {
      setMessage(issues[0].message);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const body = composer.buildApiPayload(opts);
      const res = await fetch("/api/posts", {
        method: composer.editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kayıt başarısız");

      const savedStatus = String(
        data.post?.status || (opts.asDraft ? "DRAFT" : "SCHEDULED"),
      );
      setMessage(
        formatResultsMessage(
          data,
          opts.asDraft ? "draft" : opts.shareNow ? "share" : "schedule",
        ),
      );
      composer.resetCompose();
      setMode("list");
      setListTab(listTabForStatus(savedStatus));
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  function openEdit(post: Post) {
    composer.loadFromPost(post);
    // Fix media URLs that aren't usable
    composer.setMediaItems(
      (post.media || [])
        .filter((m) => m.id)
        .map((m) => ({
          assetId: m.id!,
          url: isUsableMediaUrl(m.thumbnailUrl || m.originalUrl)
            ? m.thumbnailUrl || m.originalUrl
            : "",
          mimeType: m.mimeType || null,
          fileName: null,
        }))
        .filter((m) => m.assetId) as MediaItem[],
    );
    setMode("compose");
  }

  function openCompose() {
    composer.resetCompose();
    setMode("compose");
  }

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || openedEditFromQuery.current === editId) return;
    const post = posts.find((p) => p.id === editId);
    if (!post) return;
    openedEditFromQuery.current = editId;
    openEdit(post);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("edit");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, posts]);

  async function shareNow(postId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/posts/${postId}/share-now`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Paylaşım başarısız");
      setMessage(formatResultsMessage(data, "share"));
      if (data.post?.status) setListTab(listTabForStatus(String(data.post.status)));
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
      if (composer.editingId === postId) {
        setMode("list");
        composer.resetCompose();
      }
      setMessage("Gönderi silindi.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setBusy(false);
      setDeleteConfirmId(null);
    }
  }

  async function uploadFiles(files: File[]) {
    if (!canEdit) return;
    setBusy(true);
    setMessage(null);
    try {
      for (const file of files) {
        if (file.size > 100 * 1024 * 1024) {
          throw new Error("Dosya 100MB sınırını aşıyor.");
        }
        const localPreview = URL.createObjectURL(file);
        const res = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            postId: composer.editingId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Yükleme başarısız");
        const assetId = String(data.assetId || "");
        if (!assetId) throw new Error("Medya kaydı oluşmadı");

        let publicUrl = String(data.publicUrl || "");

        if (data.uploadUrl) {
          const put = await fetch(data.uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type || "application/octet-stream" },
          });
          if (!put.ok) throw new Error("Dosya yüklemesi başarısız");
        } else if (data.useBlobClient && data.blobClientToken && data.blobPathname) {
          const { put } = await import("@vercel/blob/client");
          const blob = await put(String(data.blobPathname), file, {
            access: "public",
            token: String(data.blobClientToken),
            contentType: file.type || "application/octet-stream",
            multipart: file.size > 4 * 1024 * 1024,
          });
          const fin = await fetch("/api/uploads/finalize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assetId,
              publicUrl: blob.url,
              mimeType: file.type || blob.contentType || "application/octet-stream",
            }),
          });
          if (!fin.ok) throw new Error("Medya kaydı güncellenemedi");
          publicUrl = blob.url;
        } else {
          const form = new FormData();
          form.set("file", file);
          form.set("assetId", assetId);
          const local = await fetch("/api/uploads/local", { method: "POST", body: form });
          const localData = await local.json().catch(() => ({}));
          if (!local.ok) {
            throw new Error(
              (localData as { error?: string }).error || "Dosya kaydedilemedi",
            );
          }
          publicUrl = String((localData as { publicUrl?: string }).publicUrl || publicUrl);
        }

        URL.revokeObjectURL(localPreview);
        composer.setMediaItems((prev) => [
          ...prev,
          {
            assetId,
            url: publicUrl.includes("/uploads/pending/") ? localPreview : publicUrl,
            mimeType: file.type || null,
            fileName: file.name,
          },
        ]);
      }
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
        <ComposerShell
          canEdit={canEdit}
          busy={busy}
          message={message}
          onDismissMessage={() => setMessage(null)}
          onClose={() => {
            setMode("list");
            composer.resetCompose();
          }}
          onDelete={
            composer.editingId
              ? () => requestDeletePost(composer.editingId!)
              : undefined
          }
          onSaveDraft={() => void savePost({ asDraft: true })}
          onShareNow={() => void savePost({ shareNow: true })}
          onSchedule={() => void savePost()}
          onUploadFiles={uploadFiles}
          groups={groups}
          accounts={accounts}
          groupQuery={groupQuery}
          setGroupQuery={setGroupQuery}
          accountQuery={accountQuery}
          setAccountQuery={setAccountQuery}
          accountFilter={accountFilter}
          setAccountFilter={setAccountFilter}
          filteredGroups={filteredGroups}
          filteredAccounts={filteredAccounts}
          selectGroup={selectGroup}
          toggleAccount={toggleAccount}
          selectAllAccounts={selectAllAccounts}
          composer={composer}
        />
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
          <Button
            variant="primary"
            className="font-semibold shadow-md shadow-accent/20"
            onPress={openCompose}
          >
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
            <span className="ml-1.5 text-xs font-medium text-ink-400">
              {tabCounts[t.id] || 0}
            </span>
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
            <p className="mt-1 text-xs text-ink-400">
              Paylaştığınız gönderiler Yayınlanan / Hatalı sekmelerine düşebilir.
            </p>
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
            onOpen={() => setDetailPost(post)}
            onEdit={() => openEdit(post)}
            onDelete={() => requestDeletePost(post.id)}
            onRetry={
              canEdit &&
              (post.status === "FAILED" ||
                post.status === "PARTIAL_FAILED" ||
                post.status === "SCHEDULED" ||
                post.status === "DRAFT")
                ? () => void shareNow(post.id)
                : undefined
            }
          />
        ))}
      </div>

      {detailPost ? (
        <PostDetailModal
          post={detailPost}
          canEdit={canEdit}
          variant="full"
          onClose={() => setDetailPost(null)}
          onEdit={() => {
            const p = detailPost;
            setDetailPost(null);
            openEdit(p);
          }}
          onDelete={() => requestDeletePost(detailPost.id)}
          onRetry={
            canEdit &&
            (detailPost.status === "FAILED" ||
              detailPost.status === "PARTIAL_FAILED" ||
              detailPost.status === "SCHEDULED" ||
              detailPost.status === "DRAFT")
              ? () => {
                  const id = detailPost.id;
                  setDetailPost(null);
                  void shareNow(id);
                }
              : undefined
          }
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

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Card, Chip, Input } from "@heroui/react";
import { ProviderIcon } from "../posts/provider-icon";

type Conversation = {
  id: string;
  senderName: string;
  senderAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  isRead: boolean;
  type: string;
  socialAccount: { accountName: string; provider: string };
  messages: { id: string; senderType: string; messageText: string; createdAt: string }[];
};

type Activity = {
  id: string;
  senderName: string;
  senderAvatar: string | null;
  actionText: string;
  platform: string;
  time: string;
  targetPost?: string;
  type: "LIKE" | "FOLLOW" | "REPOST" | "SAVE";
  thanked?: boolean;
  isSystem?: boolean;
  remoteId?: string;
};

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: "act-1",
    senderName: "Melis Yılmaz",
    senderAvatar: null,
    actionText: "Instagram gönderinizi beğendi.",
    platform: "INSTAGRAM",
    time: "2 dakika önce",
    targetPost: "Yeni koleksiyonumuz satışta! 🌟",
    type: "LIKE"
  },
  {
    id: "act-2",
    senderName: "Can Demir",
    senderAvatar: null,
    actionText: "TikTok videonuzu beğendi.",
    platform: "TIKTOK",
    time: "15 dakika önce",
    targetPost: "Ofiste sıradan bir gün... 😂 #office",
    type: "LIKE"
  },
  {
    id: "act-3",
    senderName: "Serkan Kaya",
    senderAvatar: null,
    actionText: "LinkedIn'de sizi takip etmeye başladı.",
    platform: "LINKEDIN",
    time: "1 saat önce",
    type: "FOLLOW"
  },
  {
    id: "act-4",
    senderName: "Ayşe Şen",
    senderAvatar: null,
    actionText: "X'te gönderinizi repost etti.",
    platform: "X",
    time: "3 saat önce",
    targetPost: "SocialMarka ile tüm sosyal medyayı tek yerden yönetin!",
    type: "REPOST"
  },
  {
    id: "act-5",
    senderName: "Elif Çelik",
    senderAvatar: null,
    actionText: "Pinterest pininizi panosuna kaydetti.",
    platform: "PINTEREST",
    time: "5 saat önce",
    targetPost: "Sosyal Medya Görsel Fikirleri",
    type: "SAVE"
  },
  {
    id: "act-6",
    senderName: "Murat Yıldız",
    senderAvatar: null,
    actionText: "YouTube videonuzu beğendi.",
    platform: "YOUTUBE",
    time: "1 gün önce",
    targetPost: "Next.js ile Sosyal Medya Uygulaması Yapımı",
    type: "LIKE"
  }
];

export function InboxClient({
  conversations: initial,
  initialActivities,
}: {
  conversations: Conversation[];
  initialActivities?: Activity[];
}) {
  const [conversations, setConversations] = useState(initial);
  const router = useRouter();
  const [activeId, setActiveId] = useState(initial[0]?.id || null);
  const [reply, setReply] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string, text: string } | null>(null);
  const [editMode, setEditMode] = useState<{ id: string, text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [mainTab, setMainTab] = useState<"messages" | "activities">("messages");
  const [filter, setFilter] = useState<"ALL" | "COMMENT" | "DIRECT_MESSAGE" | "UNREAD">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activities, setActivities] = useState<Activity[]>(initialActivities && initialActivities.length > 0 ? initialActivities : INITIAL_ACTIVITIES);
  const [activityFilter, setActivityFilter] = useState<"ALL" | "LIKE" | "FOLLOW" | "REPOST" | "SAVE">("ALL");

  const [hasSyncedOnLoad, setHasSyncedOnLoad] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type?: "danger" | "info";
    confirmText?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "danger",
    confirmText: "Tamam",
  });

  const showAlert = (title: string, description: string) => {
    setModalConfig({
      isOpen: true,
      title,
      description,
      type: "info",
      confirmText: "Anladım",
    });
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Filter by type
      if (filter === "COMMENT" && c.type !== "COMMENT") return false;
      if (filter === "DIRECT_MESSAGE" && c.type !== "DIRECT_MESSAGE") return false;
      if (filter === "UNREAD" && c.isRead) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.senderName.toLowerCase().includes(q);
        const matchesMsg = c.lastMessage?.toLowerCase().includes(q) || false;
        return matchesName || matchesMsg;
      }

      return true;
    });
  }, [conversations, filter, searchQuery]);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (activityFilter !== "ALL" && a.type !== activityFilter) return false;
      return true;
    });
  }, [activities, activityFilter]);

  const active = conversations.find((c) => c.id === activeId) || null;

  async function sendReply() {
    if (!active || !reply.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/inbox/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: active.id, message: reply, parentMessageId: replyingTo?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gönderilemedi");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === active.id
            ? {
                ...c,
                isRead: true,
                lastMessage: reply,
                messages: [
                  ...c.messages,
                  {
                    id: data.message.id,
                    senderType: "AGENT",
                    messageText: reply,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : c
        )
      );
      setReply("");
      setReplyingTo(null);
      router.refresh();
    } catch (e) {
      showAlert("Yorum Yanıtı İletilemedi", e instanceof Error ? e.message : "Yanıt gönderilirken bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  async function handleThankActivity(id: string, remoteId?: string, isLiked?: boolean) {
    // Optimistic UI
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, thanked: !a.thanked } : a))
    );
    if (!remoteId) return;
    try {
      await fetch("/api/inbox/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: id, liked: !isLiked })
      });
    } catch {
      // Revert on error
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? { ...a, thanked: !!isLiked } : a))
      );
    }
  }

  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  async function handleSync() {
    setSyncing(true);
    setSyncStatus(null);
    setDebugLogs([]);
    try {
      const res = await fetch("/api/inbox/sync", { method: "POST" });
      const data = await res.json();
      if (data.debugLogs) {
        setDebugLogs(data.debugLogs);
      }
      if (data.activities) {
        setActivities(data.activities);
      }
      if (res.ok && data.conversations) {
        setConversations(data.conversations);
        if (!activeId && data.conversations[0]?.id) {
          setActiveId(data.conversations[0].id);
        }
        const count = data.conversations.length;
        setSyncStatus(`Senkronizasyon tamamlandı: ${count} aktif konuşma / yorum bulundu.`);
      } else {
        setSyncStatus(`Senkronizasyon uyarısı: ${data.error || "Sunucu yanıt vermedi"}`);
      }
    } catch (err: any) {
      setSyncStatus(`Senkronizasyon hatası: ${err?.message || err}`);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (!hasSyncedOnLoad) {
      setHasSyncedOnLoad(true);
      handleSync();
    }
  }, [hasSyncedOnLoad]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  function requestDeleteConversation(id: string) {
    setModalConfig({
      isOpen: true,
      title: "Konuşmayı ve Yorumu Sil",
      description: "Bu konuşmayı ve varsa bağlı canlı sosyal medya yorumunu silmek istediğinize emin misiniz?",
      type: "danger",
      confirmText: "Evet, Sil",
      onConfirm: () => executeDeleteConversation(id),
    });
  }

  async function executeDeleteConversation(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/inbox/conversations/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const remaining = conversations.filter((c) => c.id !== id);
        setConversations(remaining);
        if (activeId === id) {
          setActiveId(remaining[0]?.id || null);
        }
      } else {
        showAlert("Silme İşlemi Başarısız", data.error || "Silme işlemi sırasında bir hata oluştu.");
      }
    } catch (err: any) {
      showAlert("Silme Hatası", err?.message || "Silme hatası oluştu.");
    } finally {
      setDeletingId(null);
    }
  }

  function requestDeleteMessage(id: string) {
    setModalConfig({
      isOpen: true,
      title: "Cevabı Sil",
      description: "Bu cevabı ve varsa platform üzerindeki yorum yanıtını silmek istediğinize emin misiniz?",
      type: "danger",
      confirmText: "Evet, Sil",
      onConfirm: () => executeDeleteMessage(id),
    });
  }

  async function executeDeleteMessage(id: string) {
    try {
      const res = await fetch(`/api/inbox/message/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? { ...c, messages: c.messages.filter((m) => m.id !== id) }
              : c
          )
        );
      } else {
        showAlert("Silme İşlemi Başarısız", data.error || "Silme işlemi sırasında bir hata oluştu.");
      }
    } catch (err: any) {
      showAlert("Silme Hatası", err?.message || "Silme hatası oluştu.");
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="font-display text-2xl font-medium tracking-tight text-ink-900">
          Gelen Kutusu & Aktivite
        </h1>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            isDisabled={syncing}
            onClick={handleSync}
            className="bg-white border border-ink-200 text-ink-700 text-xs font-medium"
          >
            {syncing ? "Senkronize ediliyor..." : "↻ Yenile & Senkronize Et"}
          </Button>
          <div className="flex items-center gap-1 rounded-xl bg-ink-100 p-1">
            <button
              type="button"
              onClick={() => setMainTab("messages")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                mainTab === "messages"
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              Mesajlar & Yorumlar
            </button>
            <button
              type="button"
              onClick={() => setMainTab("activities")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                mainTab === "activities"
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              Aktivite Akışı (Beğeni & Takip)
            </button>
          </div>
        </div>
      </div>

      {syncStatus && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-medium text-sky-800 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span>{syncStatus}</span>
            <button type="button" onClick={() => setSyncStatus(null)} className="font-bold hover:text-sky-900 ml-2">✕</button>
          </div>
        </div>
      )}

      <Card className="min-h-[580px] min-w-0 overflow-hidden border border-ink-200 bg-white shadow-sm">
        {mainTab === "messages" ? (
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            {/* Sol Liste Paneli */}
            <div className="min-w-0 border-b border-ink-100 lg:border-b-0 lg:border-r dark:border-ink-800">
              <div className="border-b border-ink-100 p-3 space-y-2 bg-[#fafbfc] dark:bg-ink-50 dark:border-ink-800">
                <Input
                  fullWidth
                  placeholder="İsim veya mesaj ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white"
                />
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      { id: "ALL", label: "Tümü" },
                      { id: "COMMENT", label: "Yorumlar" },
                      { id: "DIRECT_MESSAGE", label: "DM" },
                      { id: "UNREAD", label: "Okunmamış" },
                    ] as const
                  ).map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setFilter(btn.id)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        filter === btn.id
                          ? "bg-slate-700 text-white"
                          : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-h-[350px] overflow-y-auto overscroll-contain lg:max-h-[520px]">
                {filteredConversations.length === 0 && (
                  <p className="p-6 text-center text-xs text-ink-400">Aranan konuşma bulunamadı.</p>
                )}
                {filteredConversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveId(c.id);
                      // Mark as read locally
                      setConversations((prev) =>
                        prev.map((item) => (item.id === c.id ? { ...item, isRead: true } : item))
                      );
                    }}
                    className={`block w-full border-b border-ink-50 px-4 py-3.5 text-left transition hover:bg-ink-50/50 ${
                      activeId === c.id ? "bg-amber-500/10" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink-900">{c.senderName}</span>
                      {!c.isRead && <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-ink-400 font-medium">
                      <ProviderIcon provider={c.socialAccount.provider} size={14} className="rounded-full" />
                      <span>{c.socialAccount.accountName}</span>
                      <span>•</span>
                      <span>{c.type === "COMMENT" ? "Yorum" : "DM"}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-xs text-ink-600 font-normal">
                      {c.lastMessage}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Sağ Mesajlaşma Alanı */}
            <div className="flex min-h-[420px] min-w-0 flex-col lg:min-h-[580px]">
              {active ? (
                <>
                  <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 bg-[#fafbfc] dark:bg-ink-50 dark:border-ink-800">
                    <Avatar className="h-9 w-9 bg-ink-200">
                      {active.senderAvatar ? (
                        <Avatar.Image src={active.senderAvatar} alt="" />
                      ) : (
                        <Avatar.Fallback>{active.senderName[0]}</Avatar.Fallback>
                      )}
                    </Avatar>
                    <div>
                      <a
                        href={
                          active.socialAccount.provider === "YOUTUBE" ? `https://youtube.com/${active.senderName.startsWith('@') ? active.senderName : '@' + active.senderName}` :
                          active.socialAccount.provider === "INSTAGRAM" ? `https://instagram.com/${active.senderName.replace('@', '')}` :
                          active.socialAccount.provider === "TIKTOK" ? `https://tiktok.com/@${active.senderName.replace('@', '')}` :
                          active.socialAccount.provider === "X" ? `https://x.com/${active.senderName.replace('@', '')}` :
                          active.socialAccount.provider === "FACEBOOK" ? `https://facebook.com/${active.senderName}` : "#"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-ink-900 hover:text-slate-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {active.senderName}
                        <span className="text-[10px] font-normal text-slate-400">↗</span>
                      </a>
                      <div className="text-xs text-ink-400 flex items-center gap-1">
                        <ProviderIcon provider={active.socialAccount.provider} size={12} />
                        <span>{active.socialAccount.accountName}</span>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          const url =
                            active.socialAccount.provider === "YOUTUBE" ? `https://youtube.com/${active.senderName.startsWith('@') ? active.senderName : '@' + active.senderName}` :
                            active.socialAccount.provider === "INSTAGRAM" ? `https://instagram.com/${active.senderName.replace('@', '')}` :
                            active.socialAccount.provider === "TIKTOK" ? `https://tiktok.com/@${active.senderName.replace('@', '')}` :
                            active.socialAccount.provider === "X" ? `https://x.com/${active.senderName.replace('@', '')}` :
                            active.socialAccount.provider === "FACEBOOK" ? `https://facebook.com/${active.senderName}` : "#";
                          window.open(url, "_blank");
                        }}
                        className="bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 h-8"
                      >
                        Profili Gör & Takip Et 👤
                      </Button>
                      <Chip size="sm" variant="soft" className="bg-amber-400/20 text-amber-900 font-semibold border-none">
                        <Chip.Label>
                          {active.type === "COMMENT" ? "Yorum Yanıtı" : "Direkt Mesaj"}
                        </Chip.Label>
                      </Chip>
                      <Button
                        size="sm"
                        variant="outline"
                        isDisabled={deletingId === active.id}
                        onClick={() => requestDeleteConversation(active.id)}
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium h-8"
                      >
                        {deletingId === active.id ? "Siliniyor..." : "Sil"}
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto p-4 bg-[#fafbfc]/35 dark:bg-ink-50/35">
                    {active.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col group max-w-[70%] ${
                          m.senderType === "AGENT" ? "ml-auto items-end" : "items-start"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {m.senderType === "USER" && (
                            <button
                              onClick={() => setReplyingTo({ id: m.id, text: m.messageText })}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-ink-500 hover:text-amber-600 bg-white shadow-sm border border-ink-100 rounded-full px-2 py-1"
                            >
                              Yanıtla
                            </button>
                          )}
                          {m.senderType === "AGENT" && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button
                                onClick={() => { setEditMode({ id: m.id, text: m.messageText }); setReply(m.messageText); }}
                                className="text-[10px] text-ink-500 hover:text-blue-600 bg-white shadow-sm border border-ink-100 rounded-full px-2 py-1"
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => requestDeleteMessage(m.id)}
                                className="text-[10px] text-ink-500 hover:text-rose-600 bg-white shadow-sm border border-ink-100 rounded-full px-2 py-1"
                              >
                                Sil
                              </button>
                            </div>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              m.senderType === "AGENT"
                                ? "bg-slate-700 text-white rounded-tr-none"
                                : "bg-white border border-ink-100 text-ink-900 rounded-tl-none"
                            }`}
                          >
                            {m.messageText}
                          </div>
                        </div>
                        <span className="mt-1 text-[9px] text-ink-400 font-medium px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col border-t border-ink-100 bg-white">
                    {(replyingTo || editMode) && (
                      <div className="flex items-center justify-between px-4 py-2 bg-ink-50/50 text-xs text-ink-600 border-b border-ink-100">
                        <span className="truncate">
                          <span className="font-semibold">{editMode ? "Düzenleniyor:" : "Yanıtlanıyor:"}</span> {editMode ? editMode.text : replyingTo?.text}
                        </span>
                        <button onClick={() => { setReplyingTo(null); setEditMode(null); setReply(""); }} className="text-ink-400 hover:text-ink-900">
                          ✕
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2 p-3">
                      <Input
                        fullWidth
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder={
                          editMode ? "Mesajı düzenle..." :
                          active.type === "COMMENT"
                            ? "Yoruma cevap yazın..."
                            : "Direkt mesaj yazın..."
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (editMode) {
                              // Edit logic handled below
                            } else {
                              sendReply();
                            }
                          }
                        }}
                        className="bg-ink-50/50"
                      />
                      <Button
                        variant="secondary"
                        className="font-semibold px-5"
                        isDisabled={busy || !reply.trim()}
                        onPress={async () => {
                          if (editMode) {
                            setBusy(true);
                            try {
                              await fetch(`/api/inbox/message/${editMode.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ message: reply }),
                              });
                              setConversations((prev) => prev.map(c => c.id === active.id ? { ...c, messages: c.messages.map(m => m.id === editMode.id ? { ...m, messageText: reply } : m) } : c));
                              setEditMode(null);
                              setReply("");
                            } finally {
                              setBusy(false);
                            }
                          } else {
                            sendReply();
                          }
                        }}
                      >
                        {busy ? "İşleniyor..." : editMode ? "Kaydet" : "Gönder"}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-ink-400 p-8">
                  <span className="text-4xl mb-2">💬</span>
                  <p className="text-sm font-medium">Başlamak için sol taraftan bir konuşma seçin.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Aktivite Akışı Paneli */
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-1 border-b border-ink-100 pb-3">
              {(
                [
                  { id: "ALL", label: "Tüm Aktiviteler" },
                  { id: "LIKE", label: "Beğeniler" },
                  { id: "FOLLOW", label: "Yeni Takipçiler" },
                  { id: "REPOST", label: "Paylaşımlar & Repostlar" },
                  { id: "SAVE", label: "Kaydetmeler" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivityFilter(tab.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    activityFilter === tab.id
                      ? "bg-slate-700 text-white"
                      : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 max-h-[480px] overflow-y-auto pr-1">
              {filteredActivities.length === 0 && (
                <p className="p-8 text-center text-sm text-ink-400">Bu kategoriye ait aktivite bulunamadı.</p>
              )}
              {filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-ink-100 bg-[#fafbfc] dark:bg-ink-50 dark:border-ink-800 transition hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 bg-ink-200">
                        <Avatar.Fallback>{act.senderName[0]}</Avatar.Fallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm">
                        <ProviderIcon provider={act.platform} size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink-900">
                        {act.senderName}{" "}
                        <span className="font-normal text-ink-600">{act.actionText}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-400">
                        <span>{act.time}</span>
                        {act.targetPost && (
                          <>
                            <span>•</span>
                            <span className="italic text-ink-500 line-clamp-1 max-w-[200px]">
                              "{act.targetPost}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {!act.isSystem && (
                      <>
                        {(act.type === "LIKE" || act.type === "REPOST" || act.type === "SAVE") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={`font-semibold text-xs ${
                              act.thanked ? "border-emerald-500 text-emerald-600 bg-emerald-50" : ""
                            }`}
                            onPress={() => handleThankActivity(act.id, act.remoteId, act.thanked)}
                          >
                            {act.thanked ? "✓ Yorum Beğenildi" : "Yorumu Beğen"}
                          </Button>
                        )}
                        {act.type === "FOLLOW" && (
                          <Button
                            size="sm"
                            variant={act.thanked ? "outline" : "primary"}
                            className={`font-semibold text-xs ${
                              act.thanked ? "border-emerald-500 text-emerald-600 bg-emerald-50" : ""
                            }`}
                            onPress={() => handleThankActivity(act.id, act.remoteId, act.thanked)}
                          >
                            {act.thanked ? "✓ Takip Edildi" : "Geri Takip Et"}
                          </Button>
                        )}
                        <button
                          type="button"
                          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                          onClick={() => {
                            const url =
                              act.platform === "YOUTUBE" ? `https://youtube.com/${act.senderName.startsWith('@') ? act.senderName : '@' + act.senderName}` :
                              act.platform === "INSTAGRAM" ? `https://instagram.com/${act.senderName.replace('@', '')}` :
                              act.platform === "TIKTOK" ? `https://tiktok.com/@${act.senderName.replace('@', '')}` :
                              act.platform === "X" || act.platform === "TWITTER" ? `https://x.com/${act.senderName.replace('@', '')}` :
                              act.platform === "FACEBOOK" ? `https://facebook.com/${act.senderName}` : "#";
                            window.open(url, "_blank");
                          }}
                        >
                          Profili Gör
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Modern In-App Custom Modal (Replaces Browser Default Alert & Confirm Popups) */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                  modalConfig.type === "danger"
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50"
                    : "bg-sky-100 text-sky-600 dark:bg-sky-950/50"
                }`}
              >
                {modalConfig.type === "danger" ? "🗑️" : "ℹ️"}
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {modalConfig.title}
              </h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {modalConfig.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              {modalConfig.type === "danger" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  İptal
                </Button>
              )}
              <Button
                size="sm"
                variant={modalConfig.type === "danger" ? "danger" : "primary"}
                onClick={() => {
                  const cb = modalConfig.onConfirm;
                  setModalConfig((prev) => ({ ...prev, isOpen: false }));
                  if (cb) cb();
                }}
                className="font-semibold px-4"
              >
                {modalConfig.confirmText || "Tamam"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
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

export function InboxClient({ conversations: initial }: { conversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id || null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [mainTab, setMainTab] = useState<"messages" | "activities">("messages");
  const [filter, setFilter] = useState<"ALL" | "COMMENT" | "DIRECT_MESSAGE" | "UNREAD">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [activityFilter, setActivityFilter] = useState<"ALL" | "LIKE" | "FOLLOW" | "REPOST" | "SAVE">("ALL");

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
        body: JSON.stringify({ conversationId: active.id, message: reply }),
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
    } catch (e) {
      alert(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(false);
    }
  }

  function handleThankActivity(id: string) {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, thanked: !a.thanked } : a))
    );
  }

  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/inbox/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.conversations) {
        setConversations(data.conversations);
        if (!activeId && data.conversations[0]?.id) {
          setActiveId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error("[InboxClient] Sync failed:", err);
    } finally {
      setSyncing(false);
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

      <Card className="min-h-[580px] min-w-0 overflow-hidden border border-ink-200 bg-white shadow-sm">
        {mainTab === "messages" ? (
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            {/* Sol Liste Paneli */}
            <div className="min-w-0 border-b border-ink-100 lg:border-b-0 lg:border-r">
              <div className="border-b border-ink-100 p-3 space-y-2 bg-[#fafbfc]">
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
                  <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 bg-[#fafbfc]">
                    <Avatar className="h-9 w-9 bg-ink-200">
                      {active.senderAvatar ? (
                        <Avatar.Image src={active.senderAvatar} alt="" />
                      ) : (
                        <Avatar.Fallback>{active.senderName[0]}</Avatar.Fallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="text-sm font-semibold text-ink-900">{active.senderName}</div>
                      <div className="text-xs text-ink-400 flex items-center gap-1">
                        <ProviderIcon provider={active.socialAccount.provider} size={12} />
                        <span>{active.socialAccount.accountName}</span>
                      </div>
                    </div>
                    <Chip size="sm" variant="soft" className="ml-auto bg-amber-400/20 text-amber-900 font-semibold border-none">
                      <Chip.Label>
                        {active.type === "COMMENT" ? "Yorum Yanıtı" : "Direkt Mesaj"}
                      </Chip.Label>
                    </Chip>
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto p-4 bg-[#fafbfc]/35">
                    {active.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col max-w-[70%] ${
                          m.senderType === "AGENT" ? "ml-auto items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            m.senderType === "AGENT"
                              ? "bg-slate-700 text-white rounded-tr-none"
                              : "bg-white border border-ink-100 text-ink-900 rounded-tl-none"
                          }`}
                        >
                          {m.messageText}
                        </div>
                        <span className="mt-1 text-[9px] text-ink-400 font-medium px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 border-t border-ink-100 p-3 bg-white">
                    <Input
                      fullWidth
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder={
                        active.type === "COMMENT"
                          ? "Yoruma cevap yazın..."
                          : "Direkt mesaj yazın..."
                      }
                      onKeyDown={(e) => e.key === "Enter" && sendReply()}
                      className="bg-ink-50/50"
                    />
                    <Button
                      variant="secondary"
                      className="font-semibold px-5"
                      isDisabled={busy || !reply.trim()}
                      onPress={sendReply}
                    >
                      {busy ? "Gönderiliyor..." : "Gönder"}
                    </Button>
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-ink-100 bg-[#fafbfc] transition hover:shadow-sm"
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
                    {act.type === "LIKE" || act.type === "REPOST" || act.type === "SAVE" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className={`font-semibold text-xs ${
                          act.thanked ? "border-emerald-500 text-emerald-600 bg-emerald-50" : ""
                        }`}
                        onPress={() => handleThankActivity(act.id)}
                      >
                        {act.thanked ? "✓ Teşekkür Edildi" : "Teşekkür Et"}
                      </Button>
                    ) : null}
                    {act.type === "FOLLOW" ? (
                      <Button
                        size="sm"
                        variant={act.thanked ? "outline" : "primary"}
                        className={`font-semibold text-xs ${
                          act.thanked ? "border-emerald-500 text-emerald-600 bg-emerald-50" : ""
                        }`}
                        onPress={() => handleThankActivity(act.id)}
                      >
                        {act.thanked ? "✓ Takip Edildi" : "Geri Takip Et"}
                      </Button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                      onClick={() => alert(`${act.senderName} profili simüle ediliyor.`)}
                    >
                      Profili Gör
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

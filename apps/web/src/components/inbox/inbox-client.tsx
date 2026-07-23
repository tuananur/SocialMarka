"use client";

import { useState } from "react";
import { Avatar, Button, Card, Chip, Input } from "@heroui/react";

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

export function InboxClient({ conversations: initial }: { conversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id || null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="min-w-0 space-y-4">
      <h1 className="font-display text-2xl font-medium tracking-tight text-ink-900">
        Gelen Kutusu
      </h1>
      <Card className="min-h-[560px] min-w-0 overflow-hidden">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <div className="min-w-0 border-b border-separator lg:border-b-0 lg:border-r">
            <div className="border-b border-separator px-4 py-3 text-sm font-medium">
              Konuşmalar
            </div>
            <div className="max-h-[320px] overflow-y-auto overscroll-contain lg:max-h-[520px]">
              {conversations.length === 0 && (
                <p className="p-6 text-sm text-muted">Henüz mesaj yok.</p>
              )}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`block w-full border-b border-separator/50 px-4 py-3 text-left hover:bg-surface ${
                    activeId === c.id ? "bg-accent/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{c.senderName}</span>
                    {!c.isRead && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted">
                    {c.socialAccount.provider} · {c.type === "COMMENT" ? "Yorum" : "DM"}
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted">{c.lastMessage}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex min-h-[420px] min-w-0 flex-col lg:min-h-[560px]">
            {active ? (
              <>
                <div className="flex items-center gap-3 border-b border-separator px-4 py-3">
                  <Avatar size="sm">
                    {active.senderAvatar ? (
                      <Avatar.Image src={active.senderAvatar} alt="" />
                    ) : (
                      <Avatar.Fallback>{active.senderName[0]}</Avatar.Fallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-semibold">{active.senderName}</div>
                    <div className="text-xs text-muted">{active.socialAccount.accountName}</div>
                  </div>
                  <Chip size="sm" variant="soft" className="ml-auto">
                    <Chip.Label>
                      {active.type === "COMMENT" ? "Yorum" : "Direkt Mesaj"}
                    </Chip.Label>
                  </Chip>
                </div>
                <div className="flex-1 space-y-3 overflow-auto p-4">
                  {active.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        m.senderType === "AGENT"
                          ? "ml-auto bg-accent text-accent-foreground"
                          : "bg-surface"
                      }`}
                    >
                      {m.messageText}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 border-t border-separator p-3">
                  <Input
                    fullWidth
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Yanıt yazın..."
                    onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  />
                  <Button
                    variant="primary"
                    isDisabled={busy || !reply.trim()}
                    onPress={sendReply}
                  >
                    Gönder
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted">
                Bir konuşma seçin
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

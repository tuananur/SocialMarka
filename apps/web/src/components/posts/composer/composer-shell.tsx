"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input } from "@heroui/react";
import { PostPreview } from "../post-preview";
import { ComposerMediaPreview } from "../composer-media-preview";
import { PlatformTabs, FormatTabs } from "./platform-tabs";
import { PlatformFields } from "./platform-fields";
import { ComposerToolbar } from "./composer-toolbar";
import { AccountsPanel } from "./accounts-panel";
import { CommentsPanel } from "./comments-panel";
import type { ComposerState } from "./use-composer-state";
import type { ComposerAccount, ComposerGroup, MediaItem } from "./composer-types";

type RightTab = "accounts" | "comments" | "preview";

export function ComposerShell({
  canEdit,
  busy,
  alerts,
  onDismissAlert,
  onClose,
  onDelete,
  onSaveDraft,
  onShareNow,
  onSchedule,
  onUploadFiles,
  groups,
  accounts,
  groupQuery,
  setGroupQuery,
  accountQuery,
  setAccountQuery,
  accountFilter,
  setAccountFilter,
  filteredGroups,
  filteredAccounts,
  selectGroup,
  toggleAccount,
  selectAllAccounts,
  composer,
}: {
  canEdit: boolean;
  busy: boolean;
  alerts: { id: string; type: "success" | "danger" | "warning"; message: string }[];
  onDismissAlert: (id: string) => void;
  onClose: () => void;
  onDelete?: () => void;
  onSaveDraft: () => void;
  onShareNow: () => void;
  onSchedule: () => void;
  onUploadFiles: (files: File[]) => Promise<void>;
  groups: ComposerGroup[];
  accounts: ComposerAccount[];
  groupQuery: string;
  setGroupQuery: (v: string) => void;
  accountQuery: string;
  setAccountQuery: (v: string) => void;
  accountFilter: "group" | "client";
  setAccountFilter: (v: "group" | "client") => void;
  filteredGroups: ComposerGroup[];
  filteredAccounts: ComposerAccount[];
  selectGroup: (g: ComposerGroup) => void;
  toggleAccount: (id: string) => void;
  selectAllAccounts: () => void;
  composer: ComposerState;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rightTab, setRightTab] = useState<RightTab>("accounts");

  const TIME_RANGES = useMemo(() => [
    { id: "morning", label: "Sabah (09:00 - 12:00)", startHour: 9, endHour: 12 },
    { id: "noon", label: "Öğle (12:00 - 15:00)", startHour: 12, endHour: 15 },
    { id: "afternoon", label: "Öğleden Sonra (15:00 - 18:00)", startHour: 15, endHour: 18 },
    { id: "evening", label: "Akşam (18:00 - 21:00)", startHour: 18, endHour: 21 },
    { id: "night", label: "Gece (21:00 - 00:00)", startHour: 21, endHour: 24 },
    { id: "latenight", label: "Gece Yarısı (00:00 - 09:00)", startHour: 0, endHour: 9 }
  ], []);

  const getRangeForTime = useCallback((timeStr: string) => {
    if (!timeStr) return "morning";
    const hour = parseInt(timeStr.split(":")[0], 10);
    if (hour >= 9 && hour < 12) return "morning";
    if (hour >= 12 && hour < 15) return "noon";
    if (hour >= 15 && hour < 18) return "afternoon";
    if (hour >= 18 && hour < 21) return "evening";
    if (hour >= 21 && hour < 24) return "night";
    return "latenight";
  }, []);

  const getTimeSlotsForRange = useCallback((rangeId: string) => {
    const range = TIME_RANGES.find(r => r.id === rangeId);
    if (!range) return [];
    const slots: string[] = [];
    const startHour = range.startHour;
    const endHour = range.endHour;
    for (let hour = startHour; hour < endHour; hour++) {
      for (let min of [0, 15, 30, 45]) {
        const hStr = String(hour).padStart(2, "0");
        const mStr = String(min).padStart(2, "0");
        slots.push(`${hStr}:${mStr}`);
      }
    }
    if (endHour !== 24) {
      slots.push(`${String(endHour).padStart(2, "0")}:00`);
    } else {
      slots.push("23:59");
    }
    return slots;
  }, [TIME_RANGES]);

  const getTodayDateString = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    if (composer.scheduledAt) return composer.scheduledAt.split("T")[0];
    return getTodayDateString();
  });

  const [selectedRangeId, setSelectedRangeId] = useState(() => {
    if (composer.scheduledAt) {
      const t = composer.scheduledAt.split("T")[1] || "";
      return getRangeForTime(t);
    }
    return "morning";
  });

  const [selectedTime, setSelectedTime] = useState(() => {
    if (composer.scheduledAt) return composer.scheduledAt.split("T")[1] || "09:00";
    return "09:00";
  });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isScheduleMenuOpen, setIsScheduleMenuOpen] = useState(false);
  const [isSaveDraftMenuOpen, setIsSaveDraftMenuOpen] = useState(false);
  const [aiSuggestedRange, setAiSuggestedRange] = useState("1");

  const suggestedTimes = useMemo(() => {
    const list: { label: string; date: string; time: string }[] = [];
    const now = new Date();
    const daysToGen = parseInt(aiSuggestedRange, 10) || 1;
    const hours = [12, 15, 18, 20];
    const pad = (n: number) => String(n).padStart(2, "0");
    for (let i = 0; i <= daysToGen; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const dateLabel = d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
      for (const h of hours) {
        const slotDate = new Date(d);
        slotDate.setHours(h, 0, 0, 0);
        if (slotDate.getTime() > now.getTime()) {
          const timeStr = `${pad(h)}:00`;
          list.push({
            label: `${dateLabel} ${timeStr}`,
            date: dateStr,
            time: timeStr,
          });
        }
      }
    }
    return list.slice(0, 5);
  }, [aiSuggestedRange]);

  const setScheduledAt = composer.setScheduledAt;
  const scheduledAtVal = composer.scheduledAt;

  // Sync state from composer.scheduledAt
  useEffect(() => {
    if (scheduledAtVal) {
      const parts = scheduledAtVal.split("T");
      const d = parts[0] || "";
      const t = parts[1] || "";
      if (d !== selectedDate || t !== selectedTime) {
        setSelectedDate(d);
        setSelectedTime(t);
        setSelectedRangeId(getRangeForTime(t));
      }
    } else {
      const today = getTodayDateString();
      setSelectedDate(today);
      setSelectedTime("09:00");
      setSelectedRangeId("morning");
      setScheduledAt(`${today}T09:00`);
    }
  }, [scheduledAtVal, getRangeForTime, selectedDate, selectedTime, setScheduledAt]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setScheduledAt(`${newDate}T${selectedTime}`);
  };

  const handleRangeChange = (newRangeId: string) => {
    setSelectedRangeId(newRangeId);
    const slots = getTimeSlotsForRange(newRangeId);
    if (slots.length > 0) {
      setSelectedTime(slots[0]);
      setScheduledAt(`${selectedDate}T${slots[0]}`);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime);
    setScheduledAt(`${selectedDate}T${newTime}`);
  };

  const previewPlatform = useMemo(() => {
    if (composer.activePlatform !== "ORIGINAL") return composer.activePlatform;
    return (
      accounts.find((a) => composer.selectedAccountIds.includes(a.id))?.provider ||
      "LINKEDIN"
    );
  }, [composer.activePlatform, composer.selectedAccountIds, accounts]);

  const maxFiles = composer.activePlatform === "PINTEREST" ? 5 : 4;
  const shareDisabled = !canEdit || busy || !composer.actionGates.shareNow;
  const scheduleDisabled = !canEdit || busy || !composer.actionGates.schedule;
  const draftDisabled = !canEdit || busy || !composer.hasCaption;

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 z-[25] flex flex-col bg-[#f3f5f7] dark:bg-ink-50 md:left-[15.5rem]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200/80 bg-white px-4 py-0">
        <div className="flex items-center gap-0">
          <span className="relative px-4 py-3.5 text-sm font-semibold text-ink-900">
            Gönderi Oluştur
            <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-amber-400" />
          </span>
        </div>
        <div className="flex items-center gap-1">
          {composer.editingId && canEdit && onDelete ? (
            <button
              type="button"
              className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              onClick={onDelete}
            >
              Sil
            </button>
          ) : null}
          <button
            type="button"
            className="px-3 py-3 text-lg text-ink-400 hover:text-ink-800"
            onClick={onClose}
            aria-label="Kapat"
          >
            ×
          </button>
        </div>
      </div>

      {alerts && alerts.length > 0 ? (
        <div className="border-b border-ink-200/50 bg-ink-50/50 p-3 space-y-1.5">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`px-4 py-2 rounded-xl text-sm border flex justify-between items-center ${
                a.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : a.type === "danger"
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              <span>{a.message}</span>
              <button
                type="button"
                className="text-xs opacity-60 hover:opacity-100 font-bold ml-3"
                onClick={() => onDismissAlert(a.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-rows-[1fr] lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px]">
        <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain border-r border-ink-200/70 bg-white p-4 sm:p-5">
          <PlatformTabs
            active={composer.activePlatform}
            onChange={composer.setActivePlatform}
            disabled={!canEdit}
          />

          {composer.showFormatTabs ? (
            <FormatTabs value={composer.activeFormat} onChange={composer.setActiveFormat} />
          ) : null}

          <div className="relative mb-4">
            {composer.mediaItems.length > 0 ? (
              <div className="mb-2 space-y-2">
                {composer.mediaItems.map((m: MediaItem) => (
                  <ComposerMediaPreview
                    key={m.assetId}
                    url={m.url}
                    mimeHint={m.mimeType || undefined}
                    fileName={m.fileName || undefined}
                    onRemove={
                      canEdit
                        ? () =>
                            composer.setMediaItems((prev) =>
                              prev.filter((x) => x.assetId !== m.assetId),
                            )
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : null}
            <button
              type="button"
              disabled={!canEdit || busy || composer.mediaItems.length >= maxFiles}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 bg-[#fafbfc] dark:bg-ink-50 dark:border-ink-800 px-4 text-center transition hover:border-accent/50 hover:bg-brand-50/30 disabled:cursor-not-allowed disabled:opacity-60 ${
                composer.mediaItems.length ? "py-4" : "py-8"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const files = Array.from(e.dataTransfer.files || []).slice(
                  0,
                  maxFiles - composer.mediaItems.length,
                );
                if (files.length) void onUploadFiles(files);
              }}
              onClick={() => {
                if (!canEdit || busy) return;
                fileInputRef.current?.click();
              }}
            >
              {!composer.mediaItems.length ? (
                <>
                  <span className="text-3xl text-ink-300">⬆</span>
                  <span className="text-sm font-semibold text-ink-700">
                    {busy ? "Yükleniyor…" : "Dosyaları sürükleyin veya tıklayın"}
                  </span>
                  <span className="text-xs text-ink-400">
                    PNG, JPG, GIF, WEBP, MP4, MOV, WEBM
                    {composer.activePlatform === "PINTEREST" ? " · max 5" : ""}
                  </span>
                </>
              ) : (
                <span className="text-xs font-medium text-ink-500">
                  {busy
                    ? "Yükleniyor…"
                    : `Başka dosya ekle (${composer.mediaItems.length}/${maxFiles})`}
                </span>
              )}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple={composer.activePlatform === "PINTEREST"}
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []).slice(
                0,
                maxFiles - composer.mediaItems.length,
              );
              if (files.length) void onUploadFiles(files);
              e.target.value = "";
            }}
          />

          <PlatformFields
            activePlatform={composer.activePlatform}
            canEdit={canEdit}
            pinTitle={composer.pinTitle}
            setPinTitle={composer.setPinTitle}
            pinLink={composer.pinLink}
            setPinLink={composer.setPinLink}
            pinAlt={composer.pinAlt}
            setPinAlt={composer.setPinAlt}
            pinHashtags={composer.pinHashtags}
            setPinHashtags={composer.setPinHashtags}
            ytPrivacy={composer.ytPrivacy}
            setYtPrivacy={composer.setYtPrivacy}
            ytTags={composer.ytTags}
            setYtTags={composer.setYtTags}
            ytAdvanceOpen={composer.ytAdvanceOpen}
            setYtAdvanceOpen={composer.setYtAdvanceOpen}
          />

          <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
            <textarea
              value={composer.draftText}
              onChange={(e) => composer.setDraftText(e.target.value)}
              disabled={!canEdit}
              placeholder="Gönderi metnini yazın veya ✨ AI Caption ile oluşturun"
              className="min-h-[160px] w-full resize-none px-4 py-3 text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
            <ComposerToolbar
              canEdit={canEdit}
              charCount={composer.charCount}
              charLimit={composer.charLimit}
              showEmojis={composer.showEmojis}
              setShowEmojis={composer.setShowEmojis}
              showLocation={composer.showLocation}
              setShowLocation={composer.setShowLocation}
              showUtm={composer.showUtm}
              setShowUtm={composer.setShowUtm}
              locationLabel={composer.locationLabel}
              setLocationLabel={composer.setLocationLabel}
              utmUrl={composer.utmUrl}
              setUtmUrl={composer.setUtmUrl}
              utmSource={composer.utmSource}
              setUtmSource={composer.setUtmSource}
              utmMedium={composer.utmMedium}
              setUtmMedium={composer.setUtmMedium}
              utmCampaign={composer.utmCampaign}
              setUtmCampaign={composer.setUtmCampaign}
              onMediaClick={() => fileInputRef.current?.click()}
              onInsertHashtag={() => composer.insertIntoDraft(" #")}
              onInsertEmoji={(e) => composer.insertIntoDraft(e)}
              onAiCaption={composer.applyAiCaption}
              onApplyLocation={composer.applyLocation}
              onApplyUtm={composer.applyUtm}
            />
          </div>

          {composer.showFormatTabs &&
          (composer.activeFormat === "story" || composer.activeFormat === "reel") &&
          composer.mediaItems.length === 0 ? (
            <p className="mt-2 text-xs text-rose-600">
              {composer.activeFormat === "story" ? "Hikâye" : "Reel"} için medya zorunludur.
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4 dark:border-ink-800">
            <div>
              <p className="text-xs text-ink-400">
                Zamanlama ayarlarını görmek ve yapay zeka önerilerini incelemek için sağdaki butona tıklayın.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Draft split button group */}
              <div className="relative flex items-center bg-white dark:bg-ink-950 rounded-xl border border-ink-200 dark:border-ink-800 shadow-sm overflow-hidden">
                <Button
                  variant="light"
                  className="rounded-r-none font-semibold hover:bg-ink-50 dark:hover:bg-ink-900 border-none h-10"
                  isDisabled={draftDisabled || busy}
                  onPress={onSaveDraft}
                >
                  {busy ? "Kaydediliyor..." : "Taslak Kaydet"}
                </Button>
                <div className="h-6 w-[1px] bg-ink-200 dark:bg-ink-800" />
                <button
                  type="button"
                  disabled={draftDisabled || busy}
                  onClick={() => setIsSaveDraftMenuOpen(!isSaveDraftMenuOpen)}
                  className="px-2.5 h-10 flex items-center justify-center text-ink-500 hover:text-ink-800 dark:hover:text-white hover:bg-ink-50 dark:hover:bg-ink-900 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                {isSaveDraftMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSaveDraftMenuOpen(false)} />
                    <div className="absolute left-0 bottom-12 z-50 min-w-[150px] rounded-xl border border-ink-200 bg-white p-1 shadow-xl dark:bg-ink-950 dark:border-ink-800">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                        onClick={() => {
                          setIsSaveDraftMenuOpen(false);
                          onSaveDraft();
                        }}
                        disabled={busy}
                      >
                        📂 Taslak Olarak Kaydet
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Schedule split button group */}
              <div className="relative flex items-center bg-accent rounded-xl shadow-md shadow-accent/25 hover:opacity-95 transition-all overflow-hidden">
                <Button
                  variant="light"
                  className="rounded-r-none pr-3 font-semibold text-white border-none h-10 hover:bg-white/10"
                  isDisabled={scheduleDisabled || busy}
                  onPress={() => setIsScheduleModalOpen(true)}
                >
                  {busy ? "Zamanlanıyor..." : "📅 Zamanlama Ayarla"}
                </Button>
                <div className="h-6 w-[1px] bg-white/20" />
                <button
                  type="button"
                  disabled={scheduleDisabled || busy}
                  onClick={() => setIsScheduleMenuOpen(!isScheduleMenuOpen)}
                  className="px-2.5 h-10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                {isScheduleMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsScheduleMenuOpen(false)} />
                    <div className="absolute right-0 bottom-12 z-50 min-w-[160px] rounded-xl border border-ink-200 bg-white p-1 shadow-xl dark:bg-ink-950 dark:border-ink-800">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                        onClick={() => {
                          setIsScheduleMenuOpen(false);
                          onShareNow();
                        }}
                        disabled={shareDisabled || busy}
                      >
                        <span>🚀</span> {busy ? "Paylaşılıyor..." : "Hemen Paylaş"}
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                        onClick={() => {
                          setIsScheduleMenuOpen(false);
                          if (suggestedTimes.length > 0) {
                            handleDateChange(suggestedTimes[0].date);
                            handleTimeChange(suggestedTimes[0].time);
                            setTimeout(() => onSchedule(), 100);
                          } else {
                            onSchedule();
                          }
                        }}
                        disabled={scheduleDisabled}
                      >
                        <span>⏰</span> Sıradakine Paylaş
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                        onClick={() => {
                          setIsScheduleMenuOpen(false);
                          const qDate = new Date();
                          qDate.setHours(qDate.getHours() + 2);
                          const pad = (n: number) => String(n).padStart(2, "0");
                          const dStr = `${qDate.getFullYear()}-${pad(qDate.getMonth() + 1)}-${pad(qDate.getDate())}`;
                          const tStr = `${pad(qDate.getHours())}:${pad(qDate.getMinutes())}`;
                          handleDateChange(dStr);
                          handleTimeChange(tStr);
                          setTimeout(() => onSchedule(), 100);
                        }}
                        disabled={scheduleDisabled}
                      >
                        <span>📋</span> Kuyruğa Ekle
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                        onClick={() => {
                          setIsScheduleMenuOpen(false);
                          setIsScheduleModalOpen(true);
                        }}
                        disabled={scheduleDisabled}
                      >
                        <span>🔄</span> Tekrarla
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col bg-white">
          <div className="flex border-b border-ink-200">
            {(
              [
                { id: "accounts" as const, label: "Hesaplar" },
                { id: "comments" as const, label: "Yorumlar" },
                { id: "preview" as const, label: "Önizleme" },
              ]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setRightTab(t.id)}
                className={`relative flex-1 px-2 py-3 text-sm font-semibold ${
                  rightTab === t.id ? "text-ink-900" : "text-ink-400"
                }`}
              >
                {t.label}
                {rightTab === t.id ? (
                  <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-amber-400" />
                ) : null}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            {rightTab === "preview" ? (
              <PostPreview
                platform={previewPlatform}
                text={composer.draftText || composer.content}
                mediaUrl={composer.mediaPreview}
                mediaMime={composer.mediaMime}
                format={composer.activeFormat}
              />
            ) : null}
            {rightTab === "comments" ? (
              <CommentsPanel
                canEdit={canEdit}
                selectedProviders={composer.selectedAccounts.map((a) => a.provider)}
                firstComments={composer.firstComments}
                setFirstComments={composer.setFirstComments}
              />
            ) : null}
            {rightTab === "accounts" ? (
              <AccountsPanel
                canEdit={canEdit}
                groups={groups}
                accounts={accounts}
                filteredGroups={filteredGroups}
                filteredAccounts={filteredAccounts}
                accountFilter={accountFilter}
                setAccountFilter={setAccountFilter}
                groupQuery={groupQuery}
                setGroupQuery={setGroupQuery}
                accountQuery={accountQuery}
                setAccountQuery={setAccountQuery}
                selectedAccountIds={composer.selectedAccountIds}
                selectGroup={selectGroup}
                toggleAccount={toggleAccount}
                selectAllAccounts={selectAllAccounts}
              />
            ) : null}
          </div>
        </aside>
      </div>

      {/* Schedule Post Modal Dialog (Image 2) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
          <div
            className="absolute inset-0 bg-ink-950/45 backdrop-blur-[2px]"
            onClick={() => setIsScheduleModalOpen(false)}
          />
          <div className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-ink-200 bg-white p-6 shadow-2xl animate-mega-in dark:bg-ink-950 dark:border-ink-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ink-100 pb-3 dark:border-ink-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <h2 className="text-base font-semibold text-ink-900 dark:text-white">Zamanlama Ayarla</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-ink-800"
              >
                ×
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Left Side: Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1">Tarih</label>
                  <Input
                    type="date"
                    fullWidth
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1">Saat</label>
                  <Input
                    type="time"
                    fullWidth
                    value={selectedTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <button
                  type="button"
                  className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                  onClick={() => setIsScheduleModalOpen(false)}
                >
                  + Zamanlama Ekle
                </button>
              </div>
              
              {/* Right Side: Suggested Times */}
              <div className="border-l border-ink-100 pl-6 dark:border-ink-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-ink-500 dark:text-ink-400">✨ Önerilen Zamanlar</span>
                  <select
                    value={aiSuggestedRange}
                    onChange={(e) => setAiSuggestedRange(e.target.value)}
                    className="text-xs border border-ink-200 rounded px-1.5 py-0.5 bg-white dark:bg-ink-900 dark:border-ink-800"
                  >
                    <option value="1">1 Gün</option>
                    <option value="3">3 Gün</option>
                    <option value="7">7 Gün</option>
                  </select>
                </div>
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {suggestedTimes.map((item, idx) => (
                    <label key={idx} className="flex items-center gap-2.5 text-xs text-ink-700 dark:text-ink-300 cursor-pointer hover:text-accent">
                      <input
                        type="checkbox"
                        checked={selectedDate === item.date && selectedTime === item.time}
                        onChange={() => {
                          handleDateChange(item.date);
                          handleTimeChange(item.time);
                        }}
                        className="rounded border-ink-300 accent-accent"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                  {suggestedTimes.length === 0 && (
                    <p className="text-xs text-ink-400 italic">Uygun öneri bulunamadı.</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4 dark:border-ink-800">
              <Button
                variant="outline"
                onPress={() => setIsScheduleModalOpen(false)}
              >
                İptal
              </Button>
              <Button
                variant="primary"
                className="font-semibold shadow-md shadow-accent/25"
                isDisabled={scheduleDisabled}
                onPress={() => {
                  onSchedule();
                  setIsScheduleModalOpen(false);
                }}
              >
                Zamanla
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

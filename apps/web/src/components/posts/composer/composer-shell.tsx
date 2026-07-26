"use client";

import { useMemo, useRef, useState } from "react";
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
  message,
  onDismissMessage,
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
  message: string | null;
  onDismissMessage: () => void;
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
    <div className="fixed inset-x-0 bottom-0 top-14 z-[25] flex flex-col bg-[#f3f5f7] md:left-[15.5rem]">
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

      {message ? (
        <div className="border-b border-brand-100 bg-brand-50 px-4 py-2 text-sm text-ink-700">
          {message}
          <button type="button" className="ml-3 text-accent underline" onClick={onDismissMessage}>
            Kapat
          </button>
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
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 bg-[#fafbfc] px-4 text-center transition hover:border-accent/50 hover:bg-brand-50/30 disabled:cursor-not-allowed disabled:opacity-60 ${
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

          <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-ink-100 pt-4">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                Zamanlama
              </label>
              <Input
                type="datetime-local"
                fullWidth
                value={composer.scheduledAt}
                onChange={(e) => composer.setScheduledAt(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="font-semibold"
                isDisabled={draftDisabled}
                onPress={onSaveDraft}
              >
                Taslak Kaydet
              </Button>
              <Button
                variant="secondary"
                className="font-semibold"
                isDisabled={shareDisabled}
                onPress={onShareNow}
              >
                Hemen Paylaş
              </Button>
              <Button
                variant="primary"
                className="font-semibold shadow-md shadow-accent/25"
                isDisabled={scheduleDisabled}
                onPress={onSchedule}
              >
                Zamanla
              </Button>
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
    </div>
  );
}

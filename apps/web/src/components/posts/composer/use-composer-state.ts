"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AI_CAPTION_TEMPLATES,
  type ComposerAccount,
  type MediaItem,
  type PlatformId,
  type PostFormat,
  type YtPrivacy,
  buildPlatformContents,
  canPublishActions,
  charLimitFor,
  preflightValidate,
  stripComposerMarkers,
} from "./composer-types";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/post-display";
import type { ManagePost } from "@/lib/post-display";

export function useComposerState(accounts: ComposerAccount[]) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [platformContents, setPlatformContents] = useState<Record<string, string>>({});
  const [firstComments, setFirstComments] = useState<Record<string, string>>({});
  const [activePlatform, setActivePlatform] = useState<PlatformId>("ORIGINAL");
  const [postFormats, setPostFormats] = useState<
    Partial<Record<"FACEBOOK" | "INSTAGRAM", PostFormat>>
  >({ FACEBOOK: "post", INSTAGRAM: "post" });
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [pinTitle, setPinTitle] = useState("");
  const [pinLink, setPinLink] = useState("");
  const [pinAlt, setPinAlt] = useState(false);
  const [pinHashtags, setPinHashtags] = useState("");
  const [ytPrivacy, setYtPrivacy] = useState<YtPrivacy>("public");
  const [ytTags, setYtTags] = useState("");
  const [ytAdvanceOpen, setYtAdvanceOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showUtm, setShowUtm] = useState(false);
  const [utmUrl, setUtmUrl] = useState("");
  const [utmSource, setUtmSource] = useState("socialmarka");
  const [utmMedium, setUtmMedium] = useState("social");
  const [utmCampaign, setUtmCampaign] = useState("");

  const selectedAccounts = useMemo(
    () => accounts.filter((a) => selectedAccountIds.includes(a.id)),
    [accounts, selectedAccountIds],
  );

  const draftText =
    activePlatform === "ORIGINAL" ? content : platformContents[activePlatform] || content;
  const charCount = draftText.length;
  const charLimit = charLimitFor(activePlatform);
  const showFormatTabs =
    activePlatform === "INSTAGRAM" || activePlatform === "FACEBOOK";
  const activeFormat: PostFormat =
    activePlatform === "FACEBOOK" || activePlatform === "INSTAGRAM"
      ? postFormats[activePlatform] || "post"
      : "post";

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

  const setDraftText = useCallback(
    (value: string) => {
      if (activePlatform === "ORIGINAL") {
        setContent(value);
      } else {
        if (value === "") {
          setPlatformContents((prev) => {
            const copy = { ...prev };
            delete copy[activePlatform];
            return copy;
          });
        } else {
          setPlatformContents((prev) => ({ ...prev, [activePlatform]: value }));
        }
        if (!content.trim()) setContent(value);
      }
    },
    [activePlatform, content],
  );

  const setActiveFormat = useCallback(
    (fmt: PostFormat) => {
      if (activePlatform !== "FACEBOOK" && activePlatform !== "INSTAGRAM") return;
      setPostFormats((prev) => ({ ...prev, [activePlatform]: fmt }));
    },
    [activePlatform],
  );

  function clearMedia() {
    setMediaItems((prev) => {
      for (const m of prev) {
        if (m.url.startsWith("blob:")) URL.revokeObjectURL(m.url);
      }
      return [];
    });
  }

  function resetCompose() {
    setEditingId(null);
    setContent("");
    setPlatformContents({});
    setFirstComments({});
    setSelectedAccountIds([]);
    setScheduledAt("");
    clearMedia();
    setShowEmojis(false);
    setShowLocation(false);
    setShowUtm(false);
    setPinTitle("");
    setPinLink("");
    setPinAlt(false);
    setPinHashtags("");
    setYtTitle("");
    setYtPrivacy("public");
    setYtTags("");
    setYtAdvanceOpen(false);
    setLocationLabel("");
    setUtmUrl("");
    setUtmSource("socialmarka");
    setUtmMedium("social");
    setUtmCampaign("");
    setPostFormats({ FACEBOOK: "post", INSTAGRAM: "post" });
    setActivePlatform("ORIGINAL");
  }

  function loadFromPost(post: ManagePost & { targets: { platformContent?: string | null; socialAccount: ComposerAccount }[] }) {
    resetCompose();
    setEditingId(post.id);
    const originalClean = stripComposerMarkers(post.content);
    setContent(originalClean);
    const pc: Record<string, string> = {};
    const fc: Record<string, string> = {};
    const formats: Partial<Record<"FACEBOOK" | "INSTAGRAM", PostFormat>> = {
      FACEBOOK: "post",
      INSTAGRAM: "post",
    };
    for (const t of post.targets) {
      const provider = t.socialAccount.provider;
      const raw = t.platformContent || "";
      if (raw) {
        const commentMatch = raw.match(/\[İlk yorum\]:\s*([\s\S]+)$/i);
        if (commentMatch) fc[provider] = commentMatch[1].trim();
        const cleaned = stripComposerMarkers(raw);
        if (cleaned !== originalClean) {
          pc[provider] = cleaned;
        }
        const fmt = raw.match(/\[Format\]:\s*(POST|STORY|REEL)/i);
        if (fmt && (provider === "FACEBOOK" || provider === "INSTAGRAM")) {
          formats[provider] = fmt[1].toLowerCase() as PostFormat;
        }
        const privacy = raw.match(/\[Gizlilik\]:\s*(public|private|unlisted)/i);
        if (privacy && provider === "YOUTUBE") {
          setYtPrivacy(privacy[1].toLowerCase() as YtPrivacy);
        }
        const title = raw.match(/Başlık:\s*(.+)/i);
        if (title) {
          if (provider === "PINTEREST") setPinTitle(title[1].trim().slice(0, 100));
          if (provider === "YOUTUBE") setYtTitle(title[1].trim().slice(0, 100));
        }
        const link = raw.match(/Link:\s*(.+)/i);
        if (link && provider === "PINTEREST") setPinLink(link[1].trim());
        if (/Alt text:\s*açık/i.test(raw) && provider === "PINTEREST") setPinAlt(true);
        const hashtags = raw.match(/\[Hashtags\]:\s*(.+)/i);
        if (hashtags && provider === "PINTEREST") setPinHashtags(hashtags[1].trim());
      }
    }
    setPlatformContents(pc);
    setFirstComments(fc);
    setPostFormats(formats);
    setSelectedAccountIds(
      post.targets
        .map((t) => t.socialAccount.id)
        .filter((id): id is string => Boolean(id)),
    );
    setScheduledAt(toDatetimeLocalValue(post.scheduledAt));
    const media = post.media || [];
    const items: MediaItem[] = [];
    for (const m of media) {
      if (!m.id) continue;
      const url = m.thumbnailUrl || m.originalUrl;
      items.push({
        assetId: m.id,
        url: url || "",
        mimeType: m.mimeType || null,
        fileName: null,
      });
    }
    setMediaItems(items.filter((i) => i.assetId));
  }

  function insertIntoDraft(snippet: string) {
    const current =
      activePlatform === "ORIGINAL" ? content : platformContents[activePlatform] ?? "";
    setDraftText(current + snippet);
  }

  async function applyAiCaption() {
    try {
      const media = mediaItems[0];
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: media?.url || null,
          mediaMime: media?.mimeType || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.caption) {
        setDraftText(data.caption);
      } else {
        const pick = AI_CAPTION_TEMPLATES[Math.floor(Math.random() * AI_CAPTION_TEMPLATES.length)];
        setDraftText(pick);
      }
    } catch {
      const pick = AI_CAPTION_TEMPLATES[Math.floor(Math.random() * AI_CAPTION_TEMPLATES.length)];
      setDraftText(pick);
    }
  }

  function applyLocation() {
    const label = locationLabel.trim();
    if (!label) return;
    insertIntoDraft(`\n📍 ${label}`);
    setShowLocation(false);
  }

  function applyUtm() {
    const base = utmUrl.trim();
    if (!base) return;
    try {
      const u = new URL(base.startsWith("http") ? base : `https://${base}`);
      if (utmSource) u.searchParams.set("utm_source", utmSource);
      if (utmMedium) u.searchParams.set("utm_medium", utmMedium);
      if (utmCampaign) u.searchParams.set("utm_campaign", utmCampaign);
      insertIntoDraft(`\n${u.toString()}`);
      setShowUtm(false);
    } catch {
      insertIntoDraft(`\n${base}`);
      setShowUtm(false);
    }
  }

  function buildApiPayload(opts: { shareNow?: boolean; asDraft?: boolean }) {
    const providers = selectedAccounts.map((a) => a.provider);
    const platformContentsBuilt = buildPlatformContents({
      content: captionText || content,
      platformContents,
      postFormats,
      pinTitle,
      pinLink,
      pinAlt,
      pinHashtags,
      ytTitle,
      ytPrivacy,
      ytTags,
      selectedProviders: providers,
    });
    const firstCommentsClean: Record<string, string> = {};
    for (const [k, v] of Object.entries(firstComments)) {
      if (v?.trim()) firstCommentsClean[k] = v.trim();
    }
    return {
      id: editingId,
      content: (captionText || content).trim(),
      platformContents: platformContentsBuilt,
      firstComments: firstCommentsClean,
      postFormats,
      socialAccountIds: selectedAccountIds,
      scheduledAt:
        opts.asDraft || opts.shareNow ? null : fromDatetimeLocalValue(scheduledAt),
      shareNow: !!opts.shareNow,
      status: opts.asDraft ? "DRAFT" : undefined,
      mediaAssetIds: mediaItems.map((m) => m.assetId),
    };
  }

  const preflightBase = {
    content: captionText || content,
    platformContents,
    selectedAccounts,
    mediaItems,
    postFormats,
    pinTitle,
    ytTitle,
    scheduledAtIso: fromDatetimeLocalValue(scheduledAt),
  };

  const actionGates = canPublishActions(preflightBase);

  function validateForSave(opts: { shareNow?: boolean; asDraft?: boolean }) {
    return preflightValidate({
      ...preflightBase,
      asDraft: !!opts.asDraft,
      shareNow: !!opts.shareNow,
    });
  }

  return {
    editingId,
    content,
    platformContents,
    firstComments,
    setFirstComments,
    activePlatform,
    setActivePlatform,
    postFormats,
    activeFormat,
    setActiveFormat,
    selectedAccountIds,
    setSelectedAccountIds,
    selectedAccounts,
    scheduledAt,
    setScheduledAt,
    mediaItems,
    setMediaItems,
    clearMedia,
    pinTitle,
    setPinTitle,
    pinLink,
    setPinLink,
    pinAlt,
    setPinAlt,
    pinHashtags,
    setPinHashtags,
    ytTitle,
    setYtTitle,
    ytPrivacy,
    setYtPrivacy,
    ytTags,
    setYtTags,
    ytAdvanceOpen,
    setYtAdvanceOpen,
    locationLabel,
    setLocationLabel,
    showEmojis,
    setShowEmojis,
    showLocation,
    setShowLocation,
    showUtm,
    setShowUtm,
    utmUrl,
    setUtmUrl,
    utmSource,
    setUtmSource,
    utmMedium,
    setUtmMedium,
    utmCampaign,
    setUtmCampaign,
    draftText,
    setDraftText,
    charCount,
    charLimit,
    showFormatTabs,
    captionText,
    hasCaption: captionText.length > 0,
    resetCompose,
    loadFromPost,
    insertIntoDraft,
    applyAiCaption,
    applyLocation,
    applyUtm,
    buildApiPayload,
    validateForSave,
    actionGates,
    mediaPreview: mediaItems[0]?.url || null,
    mediaMime: mediaItems[0]?.mimeType || null,
    mediaAssetIds: mediaItems.map((m) => m.assetId),
  };
}

export type ComposerState = ReturnType<typeof useComposerState>;

export type PostFormat = "post" | "story" | "reel";
export type YtPrivacy = "public" | "private" | "unlisted";
export type PlatformId =
  | "ORIGINAL"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "LINKEDIN"
  | "YOUTUBE"
  | "X"
  | "TIKTOK"
  | "PINTEREST";

export const COMPOSER_PLATFORMS: { id: PlatformId; label: string }[] = [
  { id: "ORIGINAL", label: "Orijinal Taslak" },
  { id: "FACEBOOK", label: "Facebook" },
  { id: "INSTAGRAM", label: "Instagram" },
  { id: "LINKEDIN", label: "LinkedIn" },
  { id: "YOUTUBE", label: "YouTube" },
  { id: "X", label: "X" },
  { id: "TIKTOK", label: "TikTok" },
  { id: "PINTEREST", label: "Pinterest" },
];

export const QUICK_EMOJIS = [
  "😀",
  "🔥",
  "✨",
  "📢",
  "🚀",
  "💡",
  "✅",
  "❤️",
  "🎉",
  "📈",
  "🙌",
  "💼",
];

export const AI_CAPTION_TEMPLATES = [
  "Markanız için ilham verici bir içerik: Bugün hedef kitlenize değer katacak bir ipucu paylaşın. #SocialMarka",
  "Yeni bir gün, yeni fırsatlar! Takipçilerinize kısa bir içgörü sunun ve etkileşimi artırın. #İçerik #Büyüme",
  "Topluluğunuza sorun: Bu hafta en çok hangi konuda destek istiyorsunuz? Yorumlara yazın 👇",
  "Hızlı ipucu: Tutarlı paylaşım, güven oluşturur. Bugünkü gönderinizle bir adım daha yaklaşın.",
];

export type ComposerAccount = {
  id: string;
  accountName: string;
  provider: string;
  groups: { id: string; name: string }[];
};

export type ComposerGroup = {
  id: string;
  name: string;
  accounts: ComposerAccount[];
};

export type MediaItem = {
  assetId: string;
  url: string;
  mimeType: string | null;
  fileName: string | null;
};

export type PreflightInput = {
  content: string;
  platformContents: Record<string, string>;
  selectedAccounts: ComposerAccount[];
  mediaItems: MediaItem[];
  postFormats: Partial<Record<"FACEBOOK" | "INSTAGRAM", PostFormat>>;
  pinTitle: string;
  asDraft?: boolean;
  shareNow?: boolean;
  scheduledAtIso?: string | null;
};

export type PreflightIssue = { code: string; message: string };

export function charLimitFor(platform: PlatformId): number | null {
  if (platform === "X") return 280;
  if (platform === "PINTEREST") return 500;
  return null;
}

export function parseFormatMarker(text: string): PostFormat | null {
  const m = text.match(/\[Format\]:\s*(POST|STORY|REEL)/i);
  if (!m) return null;
  return m[1].toLowerCase() as PostFormat;
}

export function stripComposerMarkers(text: string): string {
  return text
    .replace(/\n*\s*\[Format\]:\s*(POST|STORY|REEL)\s*/gi, "")
    .replace(/\n*\s*\[Gizlilik\]:\s*(public|private|unlisted)\s*/gi, "")
    .replace(/\n*\s*\[İlk yorum\]:[\s\S]*$/i, "")
    .replace(/\n*\s*Başlık:\s*.+$/gim, "")
    .replace(/\n*\s*Link:\s*.+$/gim, "")
    .replace(/\n*\s*Alt text:\s*.+$/gim, "")
    .replace(/\n*\s*\[Etiketler\]:\s*.+$/gim, "")
    .replace(/\n*\s*\[Hashtags\]:\s*.+$/gim, "")
    .trim();
}

/** Build per-provider platformContent for API (no first-comment embedding). */
export function buildPlatformContents(opts: {
  content: string;
  platformContents: Record<string, string>;
  postFormats: Partial<Record<"FACEBOOK" | "INSTAGRAM", PostFormat>>;
  pinTitle: string;
  pinLink: string;
  pinAlt: boolean;
  pinHashtags?: string;
  ytPrivacy: YtPrivacy;
  ytTags: string;
  selectedProviders: string[];
}): Record<string, string> {
  const out: Record<string, string> = { ...opts.platformContents };
  const draft = opts.content.trim();

  for (const provider of opts.selectedProviders) {
    let base = (out[provider] || draft).trim();
    if (!base) base = draft;

    if (provider === "FACEBOOK" || provider === "INSTAGRAM") {
      const fmt = opts.postFormats[provider as "FACEBOOK" | "INSTAGRAM"] || "post";
      base = `${stripComposerMarkers(base)}\n\n[Format]: ${fmt.toUpperCase()}`.trim();
    }

    if (provider === "PINTEREST") {
      let desc = stripComposerMarkers(base);
      if (opts.pinHashtags?.trim()) {
        desc += `\n\n${opts.pinHashtags.trim()}`;
      }
      const bits = [desc];
      if (opts.pinTitle) bits.unshift(`Başlık: ${opts.pinTitle}`);
      if (opts.pinLink) bits.push(`Link: ${opts.pinLink}`);
      if (opts.pinAlt) bits.push("Alt text: açık");
      if (opts.pinHashtags?.trim()) bits.push(`[Hashtags]: ${opts.pinHashtags.trim()}`);
      base = bits.filter(Boolean).join("\n");
    }

    if (provider === "YOUTUBE") {
      base = `${stripComposerMarkers(base)}\n\n[Gizlilik]: ${opts.ytPrivacy}`;
      if (opts.ytTags.trim()) {
        base += `\n[Etiketler]: ${opts.ytTags.trim()}`;
      }
    }

    out[provider] = base;
  }

  return out;
}

export function preflightValidate(input: PreflightInput): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  const caption =
    input.content.trim() ||
    Object.values(input.platformContents).find((v) => v?.trim())?.trim() ||
    "";

  if (!input.asDraft && !caption) {
    issues.push({ code: "content", message: "Gönderi metni gerekli" });
  }

  if (!input.asDraft && input.selectedAccounts.length === 0) {
    issues.push({ code: "accounts", message: "En az bir hesap seçin" });
  }

  if (!input.asDraft && !input.shareNow && !input.scheduledAtIso) {
    issues.push({
      code: "schedule",
      message: "Zamanlama için tarih seçin veya Hemen Paylaş / Taslak kullanın",
    });
  }

  const hasMedia = input.mediaItems.length > 0;
  const hasVideo = input.mediaItems.some((m) => (m.mimeType || "").startsWith("video/"));

  for (const acc of input.selectedAccounts) {
    const provider = acc.provider;
    if (provider === "YOUTUBE" && !input.asDraft && !hasVideo) {
      issues.push({
        code: "youtube_video",
        message: "YouTube için video dosyası gerekli",
      });
    }
    if (provider === "PINTEREST" && !input.asDraft) {
      if (!input.pinTitle.trim()) {
        issues.push({ code: "pin_title", message: "Pinterest için başlık gerekli" });
      }
      if (!hasMedia) {
        issues.push({
          code: "pin_media",
          message: "Pinterest için görsel veya video gerekli",
        });
      }
    }
    if ((provider === "INSTAGRAM" || provider === "FACEBOOK") && !input.asDraft) {
      const fmt =
        input.postFormats[provider as "FACEBOOK" | "INSTAGRAM"] || "post";
      if ((fmt === "story" || fmt === "reel") && !hasMedia) {
        issues.push({
          code: `${provider}_format_media`,
          message: `${provider === "INSTAGRAM" ? "Instagram" : "Facebook"} ${fmt === "story" ? "Hikâye" : "Reel"} için medya gerekli`,
        });
      }
    }
    if (provider === "X") {
      const text = (input.platformContents.X || input.content || "").trim();
      if (text.length > 280) {
        issues.push({ code: "x_limit", message: "X metni 280 karakteri aşıyor" });
      }
    }
  }

  // de-dupe by message
  const seen = new Set<string>();
  return issues.filter((i) => {
    if (seen.has(i.message)) return false;
    seen.add(i.message);
    return true;
  });
}

export function canPublishActions(input: PreflightInput): {
  draft: boolean;
  shareNow: boolean;
  schedule: boolean;
  issues: PreflightIssue[];
} {
  const draftIssues = preflightValidate({ ...input, asDraft: true });
  const shareIssues = preflightValidate({ ...input, asDraft: false, shareNow: true });
  const scheduleIssues = preflightValidate({
    ...input,
    asDraft: false,
    shareNow: false,
  });
  return {
    draft: draftIssues.filter((i) => i.code === "content").length === 0 || !!input.content.trim() || Object.values(input.platformContents).some((v) => v?.trim()),
    shareNow: shareIssues.length === 0,
    schedule: scheduleIssues.length === 0,
    issues: shareIssues,
  };
}

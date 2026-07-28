export type PostMedia = {
  id?: string;
  thumbnailUrl: string | null;
  originalUrl: string;
  mimeType?: string | null;
};

export type ManagePostTarget = {
  id: string;
  status: string;
  errorMessage: string | null;
  platformContent?: string | null;
  socialAccount: { id?: string; provider: string; accountName: string };
};

export type ManagePost = {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  media?: PostMedia[];
  targets: ManagePostTarget[];
  isDeleted?: boolean;
};

/** Reject pending/placeholder URLs that break <img>/<video> */
export function isUsableMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.includes("/uploads/pending/")) return false;
  if (url.includes("placehold.co")) return false;
  return true;
}

export function postThumbnail(post: ManagePost): string | null {
  const m = post.media?.[0];
  if (!m) return null;
  const url = m.thumbnailUrl || m.originalUrl || null;
  return isUsableMediaUrl(url) ? url : null;
}

export function postIsVideo(post: ManagePost): boolean {
  const m = post.media?.[0];
  const mime = m?.mimeType || "";
  if (mime.startsWith("video/")) return true;
  const url = postThumbnail(post);
  return Boolean(url && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url));
}

export function postStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: "Taslak",
    SCHEDULED: "Zamanlandı",
    PENDING_REVIEW: "Onay Bekliyor",
    PUBLISHED: "Yayınlandı",
    PARTIAL_FAILED: "Kısmen başarısız",
    FAILED: "Hata",
  };
  return map[status] || status;
}

export function postStatusTone(status: string): string {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-50 text-emerald-700";
    case "SCHEDULED":
      return "bg-sky-50 text-sky-700";
    case "DRAFT":
      return "bg-ink-100 text-ink-600";
    case "FAILED":
    case "PARTIAL_FAILED":
      return "bg-rose-50 text-rose-700";
    case "PENDING_REVIEW":
      return "bg-amber-50 text-amber-800";
    default:
      return "bg-ink-100 text-ink-600";
  }
}

export function postPreviewPlatform(post: ManagePost) {
  return post.targets[0]?.socialAccount.provider || "LINKEDIN";
}

export function postPrimaryError(post: ManagePost): string | null {
  const fromTargets = post.targets
    .map((t) => t.errorMessage)
    .find((m) => Boolean(m?.trim()));
  return fromTargets?.trim() || null;
}

/** ISO → value for <input type="datetime-local"> in the user's local TZ */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local string → ISO (UTC) for API storage */
export function fromDatetimeLocalValue(local: string | null | undefined): string | null {
  if (!local?.trim()) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function listTabForStatus(status: string): string {
  if (status === "FAILED" || status === "PARTIAL_FAILED") return "FAILED";
  if (status === "DRAFT") return "DRAFT";
  if (status === "PUBLISHED") return "PUBLISHED";
  if (status === "PENDING_REVIEW") return "PENDING_REVIEW";
  return "SCHEDULED";
}

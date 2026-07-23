export type PostMedia = {
  thumbnailUrl: string | null;
  originalUrl: string;
};

export type ManagePostTarget = {
  id: string;
  status: string;
  errorMessage: string | null;
  socialAccount: { provider: string; accountName: string };
};

export type ManagePost = {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  media?: PostMedia[];
  targets: ManagePostTarget[];
};

export function postThumbnail(post: ManagePost): string | null {
  const m = post.media?.[0];
  if (!m) return null;
  return m.thumbnailUrl || m.originalUrl || null;
}

export function postStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: "Taslak",
    SCHEDULED: "Zamanlandı",
    PENDING_REVIEW: "Onay Bekliyor",
    PUBLISHED: "Teslim edilmiş",
    PARTIAL_FAILED: "Kısmen başarısız",
    FAILED: "Hata",
  };
  return map[status] || status;
}

export function postPreviewPlatform(post: ManagePost) {
  return post.targets[0]?.socialAccount.provider || "LINKEDIN";
}

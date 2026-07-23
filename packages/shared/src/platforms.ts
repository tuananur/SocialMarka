export type PlatformType =
  | "FACEBOOK"
  | "INSTAGRAM"
  | "LINKEDIN"
  | "YOUTUBE"
  | "X"
  | "TIKTOK"
  | "PINTEREST";

export const PLATFORM_LABELS: Record<PlatformType, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  YOUTUBE: "YouTube",
  X: "X",
  TIKTOK: "TikTok",
  PINTEREST: "Pinterest",
};

export const CONNECTABLE_PLATFORMS: {
  id: PlatformType | "GBP";
  name: string;
  description: string;
}[] = [
  { id: "FACEBOOK", name: "Facebook", description: "Sayfa ve gönderi yönetimi" },
  { id: "INSTAGRAM", name: "Instagram", description: "Feed, Reels ve hikâyeler" },
  { id: "LINKEDIN", name: "LinkedIn", description: "Şirket sayfası ve kişisel profil" },
  { id: "YOUTUBE", name: "YouTube", description: "Video ve Shorts yayınlama" },
  { id: "X", name: "X (Twitter)", description: "Tweet ve medya paylaşımı" },
  { id: "TIKTOK", name: "TikTok", description: "Kısa video yayınlama" },
  { id: "PINTEREST", name: "Pinterest", description: "Pin ve board yönetimi" },
  { id: "GBP", name: "Google Business Profile", description: "İşletme profili (yakında)" },
];

export interface PublishResult {
  success: boolean;
  remotePostId?: string;
  errorMessage?: string;
}

export type PublishMediaFile = {
  buffer: Buffer;
  mimeType: string;
  fileName?: string;
};

export interface PlatformAdapter {
  platform: PlatformType;
  publishPost(params: {
    accessToken: string;
    providerAccountId: string;
    content: string;
    mediaUrls?: string[];
    mediaFiles?: PublishMediaFile[];
  }): Promise<PublishResult>;
  sendInboxReply?(params: {
    accessToken: string;
    conversationRemoteId: string;
    message: string;
  }): Promise<{ success: boolean; errorMessage?: string }>;
  refreshToken?(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }>;
}

export * from "./crypto";
export * from "./platforms";
export * from "./adapters";
export * from "./youtube-publish";
export * from "./x-publish";
export * from "./tiktok-publish";
export * from "./instagram-publish";
export * from "./pinterest-publish";

export const QUEUE_NAMES = {
  PUBLISH: "publish",
  MEDIA: "media",
  ANALYTICS: "analytics",
  WEBHOOK: "webhook",
  TOKEN_REFRESH: "token-refresh",
  INBOX_REPLY: "inbox-reply",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface PublishJobData {
  postTargetId: string;
  postId: string;
}

export interface MediaJobData {
  mediaAssetId: string;
}

export interface WebhookJobData {
  webhookEventId: string;
}

export interface AnalyticsJobData {
  socialAccountId: string;
}

export interface TokenRefreshJobData {
  socialAccountId: string;
}

export interface InboxReplyJobData {
  conversationId: string;
  messageId: string;
}

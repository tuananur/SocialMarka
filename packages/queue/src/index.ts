import { Queue, Worker, type ConnectionOptions, type JobsOptions } from "bullmq";
import IORedis from "ioredis";
import {
  QUEUE_NAMES,
  type PublishJobData,
  type MediaJobData,
  type WebhookJobData,
  type AnalyticsJobData,
  type TokenRefreshJobData,
  type InboxReplyJobData,
} from "@socialmarka/shared";

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    connection = new IORedis(url, { maxRetriesPerRequest: null });
  }
  return connection;
}

export function getConnectionOptions(): ConnectionOptions {
  return getRedisConnection();
}

const queues = new Map<string, Queue>();

function getQueue(name: string): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, { connection: getConnectionOptions() });
    queues.set(name, q);
  }
  return q;
}

export function getPublishQueue() {
  return getQueue(QUEUE_NAMES.PUBLISH);
}

export function getMediaQueue() {
  return getQueue(QUEUE_NAMES.MEDIA);
}

export function getAnalyticsQueue() {
  return getQueue(QUEUE_NAMES.ANALYTICS);
}

export function getWebhookQueue() {
  return getQueue(QUEUE_NAMES.WEBHOOK);
}

export function getTokenRefreshQueue() {
  return getQueue(QUEUE_NAMES.TOKEN_REFRESH);
}

export function getInboxReplyQueue() {
  return getQueue(QUEUE_NAMES.INBOX_REPLY);
}

export async function enqueuePublish(
  data: PublishJobData,
  opts?: JobsOptions
) {
  const queue = getPublishQueue();
  return queue.add("publish-target", data, {
    removeOnComplete: 100,
    removeOnFail: 200,
    ...opts,
  });
}

export async function cancelJob(queueName: string, jobId: string) {
  const queue = getQueue(queueName);
  const job = await queue.getJob(jobId);
  if (job) {
    await job.remove();
    return true;
  }
  return false;
}

export async function enqueueMedia(data: MediaJobData) {
  return getMediaQueue().add("process-media", data, {
    removeOnComplete: 50,
    removeOnFail: 100,
  });
}

export async function enqueueWebhook(data: WebhookJobData) {
  return getWebhookQueue().add("process-webhook", data, {
    removeOnComplete: 100,
    removeOnFail: 200,
  });
}

export async function enqueueAnalytics(data: AnalyticsJobData) {
  return getAnalyticsQueue().add("fetch-analytics", data, {
    removeOnComplete: 50,
    removeOnFail: 50,
  });
}

export async function enqueueTokenRefresh(data: TokenRefreshJobData) {
  return getTokenRefreshQueue().add("refresh-token", data, {
    removeOnComplete: 50,
    removeOnFail: 50,
  });
}

export async function enqueueInboxReply(data: InboxReplyJobData) {
  return getInboxReplyQueue().add("send-reply", data, {
    removeOnComplete: 100,
    removeOnFail: 100,
  });
}

export async function getQueueStats() {
  const names = Object.values(QUEUE_NAMES);
  const stats = [];
  for (const name of names) {
    const q = getQueue(name);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      q.getWaitingCount(),
      q.getActiveCount(),
      q.getCompletedCount(),
      q.getFailedCount(),
      q.getDelayedCount(),
    ]);
    stats.push({ name, waiting, active, completed, failed, delayed });
  }
  return stats;
}

export { Worker, Queue, QUEUE_NAMES };
export type {
  PublishJobData,
  MediaJobData,
  WebhookJobData,
  AnalyticsJobData,
  TokenRefreshJobData,
  InboxReplyJobData,
};

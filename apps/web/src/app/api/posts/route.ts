import { NextResponse } from "next/server";
import { prisma, PostStatus, TargetStatus } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { enqueuePublish, cancelJob, QUEUE_NAMES } from "@socialmarka/queue";

export async function GET() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });

  const posts = await prisma.post.findMany({
    where: { workspaceId: ctx.workspaceId },
    include: {
      targets: { include: { socialAccount: true } },
      media: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const content = String(body.content || "").trim();
  const socialAccountIds: string[] = body.socialAccountIds || [];
  const platformContents: Record<string, string> = body.platformContents || {};
  const shareNow = !!body.shareNow;
  const asDraft = body.status === "DRAFT" || (!body.scheduledAt && !shareNow);
  const mediaAssetIds: string[] = Array.isArray(body.mediaAssetIds)
    ? body.mediaAssetIds.map(String).filter(Boolean)
    : [];

  if (!content) {
    return NextResponse.json({ error: "İçerik gerekli" }, { status: 400 });
  }

  const scheduledAt =
    shareNow || asDraft ? null : body.scheduledAt ? new Date(body.scheduledAt) : null;

  let status: PostStatus = PostStatus.DRAFT;
  if (shareNow) status = PostStatus.SCHEDULED;
  else if (scheduledAt) status = PostStatus.SCHEDULED;
  else if (body.status === "PENDING_REVIEW") status = PostStatus.PENDING_REVIEW;

  if (socialAccountIds.length === 0 && (shareNow || scheduledAt)) {
    return NextResponse.json({ error: "En az bir hesap seçin" }, { status: 400 });
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { id: { in: socialAccountIds }, workspaceId: ctx.workspaceId },
  });

  const post = await prisma.post.create({
    data: {
      content,
      status,
      scheduledAt: shareNow ? new Date() : scheduledAt,
      workspaceId: ctx.workspaceId,
      targets: {
        create: accounts.map((a) => ({
          socialAccountId: a.id,
          platformContent: platformContents[a.provider] || null,
          status: TargetStatus.PENDING,
        })),
      },
    },
    include: { targets: true },
  });

  await prisma.auditLog.create({
    data: {
      action: "POST_CREATED",
      details: { postId: post.id, shareNow },
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });

  if (shareNow || scheduledAt) {
    await scheduleTargets(
      post.id,
      post.targets.map((t) => t.id),
      shareNow ? 0 : delayMs(scheduledAt!)
    );
  }

  await linkMediaAssets(post.id, mediaAssetIds);

  return NextResponse.json({ post });
}

export async function PATCH(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const existing = await prisma.post.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
    include: { targets: true },
  });
  if (!existing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  if (existing.bullJobId) {
    try {
      await cancelJob(QUEUE_NAMES.PUBLISH, existing.bullJobId);
    } catch {
      /* ignore */
    }
  }

  const content = String(body.content || existing.content);
  const socialAccountIds: string[] =
    body.socialAccountIds || existing.targets.map((t) => t.socialAccountId);
  const platformContents: Record<string, string> = body.platformContents || {};
  const shareNow = !!body.shareNow;
  const asDraft = body.status === "DRAFT";
  const mediaAssetIds: string[] = Array.isArray(body.mediaAssetIds)
    ? body.mediaAssetIds.map(String).filter(Boolean)
    : [];

  const scheduledAt =
    shareNow || asDraft
      ? null
      : body.scheduledAt
        ? new Date(body.scheduledAt)
        : existing.scheduledAt;

  let status: PostStatus = PostStatus.DRAFT;
  if (shareNow || scheduledAt) status = PostStatus.SCHEDULED;
  if (asDraft) status = PostStatus.DRAFT;

  if (socialAccountIds.length === 0 && (shareNow || scheduledAt)) {
    return NextResponse.json({ error: "En az bir hesap seçin" }, { status: 400 });
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { id: { in: socialAccountIds }, workspaceId: ctx.workspaceId },
  });

  await prisma.postTarget.deleteMany({ where: { postId: id } });

  const post = await prisma.post.update({
    where: { id },
    data: {
      content,
      status,
      scheduledAt: shareNow ? new Date() : scheduledAt,
      bullJobId: null,
      targets: {
        create: accounts.map((a) => ({
          socialAccountId: a.id,
          platformContent: platformContents[a.provider] || null,
          status: TargetStatus.PENDING,
        })),
      },
    },
    include: { targets: true },
  });

  await prisma.auditLog.create({
    data: {
      action: "POST_UPDATED",
      details: { postId: post.id },
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });

  if (shareNow || scheduledAt) {
    await scheduleTargets(
      post.id,
      post.targets.map((t) => t.id),
      shareNow ? 0 : delayMs(scheduledAt!)
    );
  }

  if (mediaAssetIds.length) {
    await linkMediaAssets(post.id, mediaAssetIds);
  }

  return NextResponse.json({ post });
}

function delayMs(date: Date) {
  return Math.max(0, date.getTime() - Date.now());
}

async function scheduleTargets(postId: string, targetIds: string[], delay: number) {
  let firstJobId: string | undefined;
  const preferInline =
    delay === 0 &&
    (process.env.INLINE_PUBLISH === "true" ||
      process.env.VERCEL === "1" ||
      !process.env.REDIS_URL?.trim());

  for (const targetId of targetIds) {
    if (preferInline) {
      const { publishPostTargetInline } = await import("@/lib/run-publish");
      await publishPostTargetInline({ postId, postTargetId: targetId });
      continue;
    }
    try {
      const job = await enqueuePublish(
        { postId, postTargetId: targetId },
        { delay, jobId: `publish-${targetId}-${Date.now()}` },
      );
      if (!firstJobId) firstJobId = job.id;
    } catch {
      if (delay === 0) {
        const { publishPostTargetInline } = await import("@/lib/run-publish");
        await publishPostTargetInline({ postId, postTargetId: targetId });
      }
    }
  }
  if (firstJobId) {
    await prisma.post.update({
      where: { id: postId },
      data: { bullJobId: firstJobId },
    });
  }
}

async function linkMediaAssets(postId: string, mediaAssetIds: string[]) {
  if (!mediaAssetIds.length) return;
  await prisma.mediaAsset.updateMany({
    where: {
      id: { in: mediaAssetIds },
      OR: [{ postId: null }, { postId }],
    },
    data: { postId },
  });
}

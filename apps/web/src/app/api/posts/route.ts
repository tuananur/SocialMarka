import { NextResponse } from "next/server";
import { prisma, PostStatus, TargetStatus } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { enqueuePublish, cancelJob, QUEUE_NAMES } from "@socialmarka/queue";

function mergeFirstComments(
  platformContents: Record<string, string>,
  firstComments: Record<string, string> | undefined,
  fallbackContent: string,
  providers: string[],
): Record<string, string> {
  const out = { ...platformContents };
  for (const provider of providers) {
    let base = (out[provider] || fallbackContent || "").trim();
    const comment = firstComments?.[provider]?.trim();
    if (comment) {
      // strip old embedded comment then append
      base = base.replace(/\n*\s*\[İlk yorum\]:\s*[\s\S]*$/i, "").trim();
      base = `${base}\n\n[İlk yorum]: ${comment}`.trim();
    }
    if (base) out[provider] = base;
  }
  return out;
}

function collectResults(
  targets: {
    id: string;
    status: string;
    errorMessage: string | null;
    socialAccount: { id: string; provider: string; accountName: string };
  }[],
) {
  return targets.map((t) => ({
    targetId: t.id,
    accountId: t.socialAccount.id,
    provider: t.socialAccount.provider,
    accountName: t.socialAccount.accountName,
    success: t.status === "PUBLISHED",
    status: t.status,
    error: t.errorMessage,
  }));
}

export async function GET() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });

  // Auto-process due scheduled posts for this workspace
  try {
    const now = new Date();
    const duePosts = await prisma.post.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        status: PostStatus.SCHEDULED,
        scheduledAt: { lte: now },
      },
      include: { targets: true },
    });

    if (duePosts.length > 0) {
      const { publishPostTargetInline, refreshPostStatus } = await import("@/lib/run-publish");
      for (const post of duePosts) {
        const pendingTargets = post.targets.filter((t) => t.status === TargetStatus.PENDING);
        if (pendingTargets.length === 0) {
          await refreshPostStatus(post.id);
          continue;
        }
        for (const target of pendingTargets) {
          try {
            await publishPostTargetInline({ postId: post.id, postTargetId: target.id });
          } catch (e) {
            console.error("Auto publish error for target:", target.id, e);
          }
        }
      }
    }
  } catch (e) {
    console.error("[GET /api/posts] Due posts check error:", e);
  }

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
  let platformContents: Record<string, string> = body.platformContents || {};
  const firstComments: Record<string, string> = body.firstComments || {};
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

  // Server-side preflight for publish
  if (shareNow || scheduledAt) {
    const media = mediaAssetIds.length
      ? await prisma.mediaAsset.findMany({ where: { id: { in: mediaAssetIds } } })
      : [];
    const hasVideo = media.some((m) => (m.mimeType || "").startsWith("video/"));
    const hasMedia = media.length > 0;
    for (const a of accounts) {
      if (a.provider === "YOUTUBE" && !hasVideo) {
        return NextResponse.json(
          { error: "YouTube için video dosyası gerekli" },
          { status: 400 },
        );
      }
      if (a.provider === "PINTEREST") {
        const pinContent = platformContents.PINTEREST || content;
        if (!/Başlık:\s*.+/i.test(pinContent)) {
          return NextResponse.json(
            { error: "Pinterest için başlık gerekli" },
            { status: 400 },
          );
        }
        if (!hasMedia) {
          return NextResponse.json(
            { error: "Pinterest için görsel veya video gerekli" },
            { status: 400 },
          );
        }
      }
      const pc = platformContents[a.provider] || "";
      if (
        (a.provider === "INSTAGRAM" || a.provider === "FACEBOOK") &&
        /\[Format\]:\s*(STORY|REEL)/i.test(pc) &&
        !hasMedia
      ) {
        return NextResponse.json(
          { error: `${a.provider} Story/Reel için medya gerekli` },
          { status: 400 },
        );
      }
    }
  }

  platformContents = mergeFirstComments(
    platformContents,
    firstComments,
    content,
    accounts.map((a) => a.provider),
  );

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

  await linkMediaAssets(post.id, mediaAssetIds);

  if (shareNow || scheduledAt) {
    await scheduleTargets(
      post.id,
      post.targets.map((t) => t.id),
      shareNow ? 0 : delayMs(scheduledAt!),
    );
  }

  const fresh = await prisma.post.findUnique({
    where: { id: post.id },
    include: {
      targets: { include: { socialAccount: true } },
      media: true,
    },
  });

  const results = fresh ? collectResults(fresh.targets) : [];
  return NextResponse.json({
    post: fresh || post,
    results,
    summary: {
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success && r.status === "FAILED").length,
      pending: results.filter((r) => r.status === "PENDING").length,
    },
  });
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
  let platformContents: Record<string, string> = body.platformContents || {};
  const firstComments: Record<string, string> = body.firstComments || {};
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

  platformContents = mergeFirstComments(
    platformContents,
    firstComments,
    content,
    accounts.map((a) => a.provider),
  );

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

  await linkMediaAssets(post.id, mediaAssetIds);

  if (shareNow || scheduledAt) {
    await scheduleTargets(
      post.id,
      post.targets.map((t) => t.id),
      shareNow ? 0 : delayMs(scheduledAt!),
    );
  }

  const fresh = await prisma.post.findUnique({
    where: { id: post.id },
    include: {
      targets: { include: { socialAccount: true } },
      media: true,
    },
  });

  const results = fresh ? collectResults(fresh.targets) : [];
  return NextResponse.json({
    post: fresh || post,
    results,
    summary: {
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success && r.status === "FAILED").length,
      pending: results.filter((r) => r.status === "PENDING").length,
    },
  });
}

function delayMs(date: Date) {
  return Math.max(0, date.getTime() - Date.now());
}

async function scheduleTargets(postId: string, targetIds: string[], delay: number) {
  let firstJobId: string | undefined;
  const canInlineNow =
    delay === 0 &&
    process.env.INLINE_PUBLISH !== "false" &&
    (process.env.INLINE_PUBLISH === "true" ||
      process.env.VERCEL === "1" ||
      !process.env.REDIS_URL?.trim());

  for (const targetId of targetIds) {
    if (canInlineNow) {
      const { publishPostTargetInline } = await import("@/lib/run-publish");
      await publishPostTargetInline({ postId, postTargetId: targetId });
      continue;
    }
    if (delay > 0 && !process.env.REDIS_URL?.trim()) {
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
  await prisma.mediaAsset.updateMany({
    where: {
      postId,
      ...(mediaAssetIds.length ? { id: { notIn: mediaAssetIds } } : {}),
    },
    data: { postId: null },
  });
  if (!mediaAssetIds.length) return;
  await prisma.mediaAsset.updateMany({
    where: {
      id: { in: mediaAssetIds },
      OR: [{ postId: null }, { postId }],
    },
    data: { postId },
  });
}

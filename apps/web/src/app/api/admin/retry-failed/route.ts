import { NextResponse } from "next/server";
import { prisma, TargetStatus, PostStatus, Role } from "@socialmarka/db";
import { getWorkspaceContext, canAccessAdmin, canEditContent } from "@/lib/rbac";
import { publishPostTargetInline } from "@/lib/run-publish";

export const maxDuration = 60;

/** Retry FAILED (and optionally PENDING) targets with live inline publish */
export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canAccessAdmin(ctx.role) && !canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  let scope = "workspace";
  let includePending = true;
  try {
    const body = await req.json();
    if (body?.scope === "all" && ctx.role === Role.SYSTEM_ADMIN) {
      scope = "all";
    }
    if (body?.includePending === false) includePending = false;
  } catch {
    /* empty body */
  }

  const statuses = includePending
    ? [TargetStatus.FAILED, TargetStatus.PENDING]
    : [TargetStatus.FAILED];

  const targets = await prisma.postTarget.findMany({
    where: {
      status: { in: statuses },
      ...(scope === "workspace" ? { post: { workspaceId: ctx.workspaceId } } : {}),
    },
    include: { socialAccount: { select: { provider: true, accountName: true } } },
    take: 50,
    orderBy: { updatedAt: "desc" },
  });

  const results = [];
  for (const t of targets) {
    await prisma.postTarget.update({
      where: { id: t.id },
      data: { status: TargetStatus.PENDING, errorMessage: null },
    });
    const r = await publishPostTargetInline({
      postId: t.postId,
      postTargetId: t.id,
    });
    results.push({
      provider: t.socialAccount.provider,
      account: t.socialAccount.accountName,
      success: !!r.success,
      error: "error" in r ? r.error : r.errorMessage,
      remotePostId: "remotePostId" in r ? r.remotePostId : undefined,
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "RETRY_FAILED",
      details: { count: targets.length, scope, results },
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
    },
  });

  return NextResponse.json({
    ok: true,
    message: `${targets.length} hedef yeniden yayınlandı`,
    results,
  });
}

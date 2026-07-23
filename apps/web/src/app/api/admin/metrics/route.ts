import { NextResponse } from "next/server";
import { prisma } from "@socialmarka/db";
import { getWorkspaceContext, canAccessAdmin } from "@/lib/rbac";
import { getQueueStats } from "@socialmarka/queue";

/** Canlı metrikler + kuyruk + platform kırılımı (yenile) */
export async function GET() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canAccessAdmin(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const [
    totalUsers,
    totalWorkspaces,
    totalSocialAccounts,
    totalPublishedPosts,
    totalQueuedPosts,
    totalFailedPosts,
    platformBreakdown,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.socialAccount.count({ where: { status: "CONNECTED" } }),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.post.count({ where: { status: "SCHEDULED" } }),
    prisma.post.count({ where: { status: { in: ["FAILED", "PARTIAL_FAILED"] } } }),
    prisma.socialAccount.groupBy({
      by: ["provider"],
      where: { status: "CONNECTED" },
      _count: true,
    }),
  ]);

  let queueStats: Awaited<ReturnType<typeof getQueueStats>> = [];
  try {
    queueStats = await getQueueStats();
  } catch {
    queueStats = [];
  }

  // Saatte bir SystemMetricSnapshot yaz (şişmesin)
  const oneHourAgo = new Date(Date.now() - 60 * 60_000);
  const recent = await prisma.systemMetricSnapshot.findFirst({
    where: { capturedAt: { gte: oneHourAgo } },
    orderBy: { capturedAt: "desc" },
  });
  if (!recent) {
    await prisma.systemMetricSnapshot.create({
      data: {
        totalUsers,
        totalWorkspaces,
        totalSocialAccounts,
        totalPublishedPosts,
        totalQueuedPosts,
        totalFailedPosts,
      },
    });
  }

  return NextResponse.json({
    metrics: {
      totalUsers,
      totalWorkspaces,
      totalSocialAccounts,
      totalPublishedPosts,
      totalQueuedPosts,
      totalFailedPosts,
    },
    platformBreakdown: platformBreakdown.map((p) => ({
      provider: p.provider,
      count: p._count,
    })),
    queueStats,
  });
}

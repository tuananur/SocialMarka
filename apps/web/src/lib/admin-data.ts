import { prisma } from "@socialmarka/db";
import { getQueueStats } from "@socialmarka/queue";
import type { Role } from "@socialmarka/db";

export async function loadAdminData(workspaceId: string, role: Role | string) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const isSystemAdmin = role === "SYSTEM_ADMIN";

  const [
    totalUsers,
    totalWorkspaces,
    totalSocialAccounts,
    totalPublishedPosts,
    totalQueuedPosts,
    totalFailedPosts,
    workspaces,
    members,
    auditLogs,
    platformBreakdown,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.socialAccount.count({ where: { status: "CONNECTED" } }),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.post.count({ where: { status: "SCHEDULED" } }),
    prisma.post.count({ where: { status: { in: ["FAILED", "PARTIAL_FAILED"] } } }),
    prisma.workspace.findMany({
      where: isSystemAdmin ? undefined : { id: workspaceId },
      include: {
        _count: { select: { members: true, accounts: true, posts: true } },
        posts: {
          where: { status: "PUBLISHED", updatedAt: { gte: monthStart } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { role: "asc" },
    }),
    prisma.auditLog.findMany({
      where: isSystemAdmin ? undefined : { workspaceId },
      include: {
        user: { select: { name: true, email: true } },
        workspace: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
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

  const oneHourAgo = new Date(Date.now() - 60 * 60_000);
  const recentSnap = await prisma.systemMetricSnapshot.findFirst({
    where: { capturedAt: { gte: oneHourAgo } },
    select: { id: true },
  });
  if (!recentSnap) {
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

  return {
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
    workspaces: workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      isActive: w.isActive,
      members: w._count.members,
      accounts: w._count.accounts,
      postsThisMonth: w.posts.length,
      totalPosts: w._count.posts,
    })),
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      userId: m.userId,
      user: m.user,
    })),
    auditLogs: JSON.parse(JSON.stringify(auditLogs)) as Array<{
      id: string;
      action: string;
      createdAt: string;
      user: { name: string | null; email: string };
      workspace: { name: string };
      details: unknown;
    }>,
    queueStats,
    isSystemAdmin,
  };
}

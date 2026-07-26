import { requireWorkspace } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function OverviewDashboardPage() {
  const { workspaceId, session } = await requireWorkspace();
  const now = new Date();
  const startOf30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60_000);

  // 1. Post count grouped by status
  const postCounts = await prisma.post.groupBy({
    by: ["status"],
    where: { workspaceId, isDeleted: false },
    _count: true,
  });

  const statusMap = Object.fromEntries(
    postCounts.map((p) => [p.status, p._count])
  ) as Record<string, number>;

  // 2. Delivered in last 30 days
  const deliveredLast30DaysCount = await prisma.post.count({
    where: {
      workspaceId,
      status: "PUBLISHED",
      updatedAt: { gte: startOf30DaysAgo },
      isDeleted: false,
    },
  });

  const summary = {
    queuedCount: statusMap.SCHEDULED || 0,
    deliveredCount: deliveredLast30DaysCount,
    unscheduledCount: (statusMap.DRAFT || 0) + (statusMap.PENDING_REVIEW || 0),
    failedCount: (statusMap.FAILED || 0) + (statusMap.PARTIAL_FAILED || 0),
  };

  // 3. Get all active accounts in the workspace
  const dbAccounts = await prisma.socialAccount.findMany({
    where: { workspaceId },
    select: {
      id: true,
      accountName: true,
      provider: true,
      profilePicUrl: true,
      postTargets: {
        where: { status: "FAILED" },
        select: { id: true },
      },
    },
    orderBy: { accountName: "asc" },
  });

  // For each account, get its scheduled posts and the next scheduled date
  const accountsWithStats = await Promise.all(
    dbAccounts.map(async (acc) => {
      const plannedCount = await prisma.post.count({
        where: {
          workspaceId,
          status: "SCHEDULED",
          targets: { some: { socialAccountId: acc.id } },
          isDeleted: false,
        },
      });

      const nextPost = await prisma.post.findFirst({
        where: {
          workspaceId,
          status: "SCHEDULED",
          scheduledAt: { gte: now },
          targets: { some: { socialAccountId: acc.id } },
          isDeleted: false,
        },
        orderBy: { scheduledAt: "asc" },
        select: { scheduledAt: true },
      });

      return {
        id: acc.id,
        accountName: acc.accountName,
        provider: acc.provider,
        profilePicUrl: acc.profilePicUrl,
        errorsCount: acc.postTargets.length,
        plannedCount,
        plannedUntil: nextPost?.scheduledAt ? nextPost.scheduledAt.toISOString() : null,
      };
    })
  );

  // 4. Get all groups in the workspace
  const dbGroups = await prisma.accountGroup.findMany({
    where: { workspaceId },
    include: {
      accounts: {
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const groupsWithStats = await Promise.all(
    dbGroups.map(async (g) => {
      const accountIds = g.accounts.map((a) => a.id);

      const plannedCount = await prisma.post.count({
        where: {
          workspaceId,
          status: "SCHEDULED",
          targets: { some: { socialAccountId: { in: accountIds } } },
          isDeleted: false,
        },
      });

      // Count how many accounts have 0 planned posts
      let idleCount = 0;
      for (const accId of accountIds) {
        const plannedForAcc = await prisma.post.count({
          where: {
            workspaceId,
            status: "SCHEDULED",
            targets: { some: { socialAccountId: accId } },
            isDeleted: false,
          },
        });
        if (plannedForAcc === 0) idleCount++;
      }

      const nextPost = await prisma.post.findFirst({
        where: {
          workspaceId,
          status: "SCHEDULED",
          scheduledAt: { gte: now },
          targets: { some: { socialAccountId: { in: accountIds } } },
          isDeleted: false,
        },
        orderBy: { scheduledAt: "asc" },
        select: { scheduledAt: true },
      });

      return {
        id: g.id,
        name: g.name,
        plannedCount,
        idleCount,
        plannedUntil: nextPost?.scheduledAt ? nextPost.scheduledAt.toISOString() : null,
      };
    })
  );

  // 5. Inboxes (unread messages count by account)
  const inboxesWithStats = await Promise.all(
    dbAccounts.map(async (acc) => {
      const unreadCount = await prisma.inboxConversation.count({
        where: {
          workspaceId,
          socialAccountId: acc.id,
          isRead: false,
        },
      });
      return {
        id: acc.id,
        accountName: acc.accountName,
        provider: acc.provider,
        profilePicUrl: acc.profilePicUrl,
        unreadCount,
      };
    })
  );

  // 6. Chart data: group published posts by date for the last 30 days
  const publishedPosts = await prisma.post.findMany({
    where: {
      workspaceId,
      status: "PUBLISHED",
      updatedAt: { gte: startOf30DaysAgo },
      isDeleted: false,
    },
    select: {
      updatedAt: true,
    },
  });

  const dateMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60_000);
    const dateStr = d.toLocaleDateString("tr-TR", { month: "short", day: "numeric" });
    dateMap[dateStr] = 0;
  }

  publishedPosts.forEach((p) => {
    const dateStr = new Date(p.updatedAt).toLocaleDateString("tr-TR", { month: "short", day: "numeric" });
    if (dateMap[dateStr] !== undefined) {
      dateMap[dateStr]++;
    }
  });

  const chartData = Object.entries(dateMap).map(([date, count]) => ({
    date,
    count,
  }));

  const userName = session.user?.name || "Kullanıcı";

  return (
    <DashboardClient
      userName={userName}
      summary={summary}
      chartData={chartData}
      accounts={accountsWithStats}
      groups={groupsWithStats}
      inboxes={inboxesWithStats}
    />
  );
}

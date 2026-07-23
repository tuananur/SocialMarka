import dynamic from "next/dynamic";
import { requireWorkspace } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";
import { toClientJson } from "@/lib/serialize";
import { PanelSkeleton } from "@/components/dashboard/panel-skeleton";

const AnalyticsDashboard = dynamic(
  () =>
    import("@/components/analytics/analytics-dashboard").then(
      (m) => m.AnalyticsDashboard
    ),
  { loading: () => <PanelSkeleton /> }
);

export default async function AnalyticsPage() {
  const { workspaceId } = await requireWorkspace();

  const [accounts, posts] = await Promise.all([
    prisma.socialAccount.findMany({
      where: { workspaceId },
      select: {
        id: true,
        accountName: true,
        provider: true,
        status: true,
        analyticsSnapshots: {
          orderBy: { capturedAt: "desc" },
          take: 60,
          select: {
            followers: true,
            following: true,
            impressions: true,
            reach: true,
            likes: true,
            comments: true,
            postsCount: true,
            capturedAt: true,
          },
        },
      },
      orderBy: { accountName: "asc" },
    }),
    prisma.post.findMany({
      where: { workspaceId },
      select: {
        id: true,
        scheduledAt: true,
        status: true,
        createdAt: true,
        targets: {
          select: {
            socialAccountId: true,
            socialAccount: { select: { provider: true } },
          },
        },
      },
      take: 500,
    }),
  ]);

  const accountOptions = accounts.map((a) => ({
    id: a.id,
    accountName: a.accountName,
    provider: a.provider,
    status: a.status,
  }));

  const snapshots = accounts.flatMap((a) =>
    a.analyticsSnapshots.map((s) => ({
      ...s,
      accountId: a.id,
      accountName: a.accountName,
      provider: a.provider,
    }))
  );

  return (
    <AnalyticsDashboard
      accounts={toClientJson(accountOptions)}
      posts={toClientJson(posts)}
      snapshots={toClientJson(snapshots)}
    />
  );
}

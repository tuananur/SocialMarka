import dynamic from "next/dynamic";
import { Suspense } from "react";
import { requireWorkspace, canEditContent } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";
import { toClientJson } from "@/lib/serialize";
import { PanelSkeleton } from "@/components/dashboard/panel-skeleton";

const PostsWorkspace = dynamic(
  () =>
    import("@/components/posts/posts-workspace").then((m) => m.PostsWorkspace),
  { loading: () => <PanelSkeleton /> }
);

const accountSelect = {
  id: true,
  accountName: true,
  provider: true,
  groups: { select: { id: true, name: true } },
} as const;

export default async function PostsPage() {
  const { workspaceId, role } = await requireWorkspace();

  const [posts, groups, accounts] = await Promise.all([
    prisma.post.findMany({
      where: { workspaceId },
      select: {
        id: true,
        content: true,
        status: true,
        scheduledAt: true,
        media: {
          select: { id: true, thumbnailUrl: true, originalUrl: true, mimeType: true },
          take: 1,
        },
        targets: {
          select: {
            id: true,
            platformContent: true,
            status: true,
            errorMessage: true,
            socialAccount: { select: accountSelect },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.accountGroup.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        accounts: { select: accountSelect },
      },
      orderBy: { name: "asc" },
    }),
    prisma.socialAccount.findMany({
      where: { workspaceId, status: { not: "DISCONNECTED" } },
      select: accountSelect,
      orderBy: { accountName: "asc" },
    }),
  ]);

  return (
    <Suspense fallback={<PanelSkeleton />}>
      <PostsWorkspace
        canEdit={canEditContent(role)}
        initialPosts={toClientJson(posts)}
        groups={toClientJson(groups)}
        accounts={toClientJson(accounts)}
      />
    </Suspense>
  );
}

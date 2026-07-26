import dynamic from "next/dynamic";
import { requireWorkspace, canEditContent } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";
import { toClientJson } from "@/lib/serialize";
import { PanelSkeleton } from "@/components/dashboard/panel-skeleton";

const CalendarView = dynamic(
  () => import("@/components/calendar/calendar-view").then((m) => m.CalendarView),
  { loading: () => <PanelSkeleton /> },
);

export default async function CalendarPage() {
  const { workspaceId, role } = await requireWorkspace();

  // Window around now so upcoming posts aren't dropped by take+oldest-first
  const from = new Date();
  from.setMonth(from.getMonth() - 2);
  const to = new Date();
  to.setMonth(to.getMonth() + 6);

  const posts = await prisma.post.findMany({
    where: {
      workspaceId,
      scheduledAt: { not: null, gte: from, lte: to },
    },
    select: {
      id: true,
      content: true,
      status: true,
      scheduledAt: true,
      media: {
        select: { id: true, thumbnailUrl: true, originalUrl: true, mimeType: true },
        take: 1,
        orderBy: { createdAt: "asc" },
      },
      targets: {
        select: {
          id: true,
          status: true,
          errorMessage: true,
          socialAccount: {
            select: { id: true, accountName: true, provider: true },
          },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 500,
  });

  return <CalendarView posts={toClientJson(posts)} canEdit={canEditContent(role)} />;
}

import dynamic from "next/dynamic";
import { requireWorkspace, canEditContent } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";
import { toClientJson } from "@/lib/serialize";
import { PanelSkeleton } from "@/components/dashboard/panel-skeleton";

const CalendarView = dynamic(
  () => import("@/components/calendar/calendar-view").then((m) => m.CalendarView),
  { loading: () => <PanelSkeleton /> }
);

export default async function CalendarPage() {
  const { workspaceId, role } = await requireWorkspace();
  const posts = await prisma.post.findMany({
    where: {
      workspaceId,
      OR: [
        { scheduledAt: { not: null } },
        { status: { in: ["PUBLISHED", "FAILED", "PARTIAL_FAILED", "SCHEDULED"] } },
      ],
    },
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
          status: true,
          errorMessage: true,
          socialAccount: {
            select: { accountName: true, provider: true },
          },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 200,
  });

  return <CalendarView posts={toClientJson(posts)} canEdit={canEditContent(role)} />;
}

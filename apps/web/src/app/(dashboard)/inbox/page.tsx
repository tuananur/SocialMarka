import dynamic from "next/dynamic";
import { requireWorkspace } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";
import { toClientJson } from "@/lib/serialize";
import { PanelSkeleton } from "@/components/dashboard/panel-skeleton";
import { getLiveActivities } from "@/lib/inbox-activities";

const InboxClient = dynamic(
  () => import("@/components/inbox/inbox-client").then((m) => m.InboxClient),
  { loading: () => <PanelSkeleton /> }
);

export default async function InboxPage() {
  const { workspaceId } = await requireWorkspace();

  // Demo verileri temizle
  try {
    await prisma.inboxConversation.deleteMany({
      where: {
        workspaceId,
        senderName: { in: ["Melis Yılmaz", "Ahmet Kaya", "Selin Çelik", "Caner Öztürk"] },
      },
    });
  } catch {
    /* ignore */
  }

  const conversations = await prisma.inboxConversation.findMany({
    where: { workspaceId },
    select: {
      id: true,
      senderName: true,
      senderAvatar: true,
      lastMessage: true,
      lastMessageAt: true,
      isRead: true,
      type: true,
      socialAccount: {
        select: { accountName: true, provider: true, profilePicUrl: true },
      },
      messages: {
        select: {
          id: true,
          senderType: true,
          messageText: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });

  const activities = await getLiveActivities(workspaceId);

  return (
    <InboxClient
      conversations={toClientJson(conversations)}
      initialActivities={toClientJson(activities)}
    />
  );
}

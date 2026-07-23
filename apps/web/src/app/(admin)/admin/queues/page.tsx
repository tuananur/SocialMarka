import { requireWorkspace, canAccessAdmin } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { loadAdminData } from "@/lib/admin-data";
import { AdminPanel } from "@/components/admin/admin-panel";

export default async function AdminQueuesPage() {
  const { workspaceId, role, userId } = await requireWorkspace();
  if (!canAccessAdmin(role)) redirect("/dashboard");
  const data = await loadAdminData(workspaceId, role);
  return (
    <AdminPanel
      section="queues"
      metrics={data.metrics}
      platformBreakdown={data.platformBreakdown}
      workspaces={data.workspaces}
      queueStats={data.queueStats}
      auditLogs={data.auditLogs}
      members={data.members}
      currentUserId={userId}
      isSystemAdmin={data.isSystemAdmin}
    />
  );
}

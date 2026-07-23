import { requireWorkspace, canAccessAdmin } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { loadAdminData } from "@/lib/admin-data";
import { AdminPanel, type AdminSection } from "@/components/admin/admin-panel";

async function AdminSectionPage({ section }: { section: AdminSection }) {
  const { workspaceId, role, userId } = await requireWorkspace();
  if (!canAccessAdmin(role)) redirect("/dashboard");

  const data = await loadAdminData(workspaceId, role);

  return (
    <AdminPanel
      section={section}
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

export default function AdminMetricsPage() {
  return <AdminSectionPage section="metrics" />;
}

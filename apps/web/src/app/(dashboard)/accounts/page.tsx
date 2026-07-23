import { Suspense } from "react";
import { requireWorkspace, canManageAccounts } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";
import { toClientJson } from "@/lib/serialize";
import { AccountsTable } from "@/components/accounts/accounts-table";
import { PanelSkeleton } from "@/components/dashboard/panel-skeleton";
import { getAccountLimit } from "@/lib/oauth-connect";

export default async function AccountsPage() {
  const { workspaceId, role } = await requireWorkspace();

  // Eski demo_ önekli kayıtları temizle; yeni bağlantılar gerçek “Bağlı” görünür
  await prisma.socialAccount.deleteMany({
    where: {
      workspaceId,
      providerAccountId: { startsWith: "demo_" },
    },
  });

  const [accounts, memberCount] = await Promise.all([
    prisma.socialAccount.findMany({
      where: { workspaceId, status: { not: "DISCONNECTED" } },
      select: {
        id: true,
        accountName: true,
        provider: true,
        providerAccountId: true,
        status: true,
        lastConnectedBy: true,
        profilePicUrl: true,
        createdAt: true,
        groups: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
  ]);

  return (
    <Suspense fallback={<PanelSkeleton />}>
      <AccountsTable
        accounts={toClientJson(accounts)}
        memberCount={memberCount}
        canManage={canManageAccounts(role)}
        accountLimit={getAccountLimit()}
      />
    </Suspense>
  );
}

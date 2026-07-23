import { Suspense } from "react";
import { requireWorkspace, canManageAccounts } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { PlatformOAuthSim } from "@/components/accounts/platform-oauth-sim";
import { PlatformType, prisma } from "@socialmarka/db";

const VALID = new Set(Object.values(PlatformType).map((p) => p.toLowerCase()));

export default async function PlatformOAuthPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { session, role, workspaceId } = await requireWorkspace();
  if (!canManageAccounts(role)) redirect("/accounts");

  const { provider } = await params;
  if (!VALID.has(provider.toLowerCase())) redirect("/accounts/create");

  const groups = await prisma.accountGroup.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <Suspense fallback={<div className="p-8 text-sm text-ink-500">Yükleniyor…</div>}>
      <PlatformOAuthSim
        provider={provider}
        userName={session.user.name || session.user.email}
        existingGroups={groups}
      />
    </Suspense>
  );
}

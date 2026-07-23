import { Suspense } from "react";
import { requireWorkspace, canManageAccounts } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { prisma } from "@socialmarka/db";
import {
  ConnectPlatformCards,
  CreateAccountHeader,
} from "@/components/accounts/connect-cards";
import { getAccountLimit } from "@/lib/oauth-connect";

export default async function CreateAccountPage() {
  const { role, workspaceId } = await requireWorkspace();
  if (!canManageAccounts(role)) {
    redirect("/accounts");
  }

  const accountLimit = getAccountLimit();

  const [accountCount, connected] = await Promise.all([
    prisma.socialAccount.count({
      where: { workspaceId, status: { not: "DISCONNECTED" } },
    }),
    prisma.socialAccount.findMany({
      where: { workspaceId, status: { not: "DISCONNECTED" } },
      select: { provider: true },
      distinct: ["provider"],
    }),
  ]);

  return (
    <div className="space-y-6">
      <CreateAccountHeader
        accountCount={accountCount}
        accountLimit={accountLimit}
      />
      <Suspense fallback={<div className="text-sm text-ink-400">Loading…</div>}>
        <ConnectPlatformCards
          connectedProviders={connected.map((c) => c.provider)}
          atLimit={accountCount >= accountLimit}
        />
      </Suspense>
    </div>
  );
}

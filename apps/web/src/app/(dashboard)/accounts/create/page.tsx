import { Suspense } from "react";
import { requireWorkspace, canManageAccounts } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { prisma } from "@socialmarka/db";
import {
  ConnectPlatformCards,
  CreateAccountHeader,
} from "@/components/accounts/connect-cards";
import { getAccountLimit } from "@/lib/oauth-connect";
import { getConfiguredProviders } from "@/lib/social-oauth";

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

  const readyProviders = getConfiguredProviders();

  return (
    <div className="space-y-6">
      <CreateAccountHeader
        accountCount={accountCount}
        accountLimit={accountLimit}
      />
      <Suspense fallback={<div className="text-sm text-ink-400">Yükleniyor…</div>}>
        <ConnectPlatformCards
          connectedProviders={connected.map((c) => c.provider)}
          readyProviders={readyProviders}
          atLimit={accountCount >= accountLimit}
        />
      </Suspense>
    </div>
  );
}

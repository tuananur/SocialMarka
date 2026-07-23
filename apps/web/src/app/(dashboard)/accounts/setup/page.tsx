import { Suspense } from "react";
import { requireWorkspace, canManageAccounts } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getConfiguredProviders } from "@/lib/social-oauth";
import { PlatformSetupForm } from "@/components/accounts/platform-setup-form";
import { PlatformType } from "@socialmarka/db";

export default async function AccountSetupPage() {
  const { role } = await requireWorkspace();
  if (!canManageAccounts(role)) redirect("/accounts");

  const ready: Record<string, boolean> = {};
  for (const p of Object.values(PlatformType)) {
    ready[p] = false;
  }
  for (const p of getConfiguredProviders()) {
    ready[p] = true;
  }
  // Instagram Meta app ile aynı
  if (ready.FACEBOOK) ready.INSTAGRAM = true;

  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  return (
    <Suspense fallback={<div className="p-8 text-sm text-ink-500">Yükleniyor…</div>}>
      <PlatformSetupForm initialReady={ready} appOrigin={appOrigin} />
    </Suspense>
  );
}

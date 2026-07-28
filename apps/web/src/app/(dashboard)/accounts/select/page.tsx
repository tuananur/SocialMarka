import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/rbac";
import { SelectAccountsClient } from "./select-client";
import { prisma } from "@socialmarka/db";

export default async function AccountsSelectPage(props: {
  searchParams: Promise<{ provider?: string }>;
}) {
  const { provider } = await props.searchParams;
  await requireWorkspace();

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get("sm_temp_import_meta")?.value;

  if (!rawCookie) {
    redirect("/accounts");
  }

  let data: any = null;
  try {
    const jsonStr = Buffer.from(rawCookie, "base64").toString("utf-8");
    data = JSON.parse(jsonStr);
  } catch (err) {
    redirect("/accounts");
  }

  if (!data || !data.workspaceId) {
    redirect("/accounts");
  }

  const dbProvider = provider?.toUpperCase() === "INSTAGRAM" ? "INSTAGRAM" : "FACEBOOK";

  // Query DISCONNECTED accounts for this provider in the workspace
  const disconnectedAccounts = await prisma.socialAccount.findMany({
    where: {
      workspaceId: data.workspaceId,
      provider: dbProvider,
      status: "DISCONNECTED",
    },
    select: {
      providerAccountId: true,
      accountName: true,
      profilePicUrl: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (disconnectedAccounts.length === 0) {
    redirect("/accounts");
  }

  const list = disconnectedAccounts.map((acc) => ({
    providerAccountId: acc.providerAccountId,
    accountName: acc.accountName,
    profilePicUrl: acc.profilePicUrl || undefined,
  }));

  return (
    <SelectAccountsClient
      list={list}
      provider={provider || "FACEBOOK"}
    />
  );
}

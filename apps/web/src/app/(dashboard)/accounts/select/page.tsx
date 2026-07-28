import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/rbac";
import { SelectAccountsClient } from "./select-client";

export default async function AccountsSelectPage(props: {
  searchParams: Promise<{ provider?: string }>;
}) {
  const { provider } = await props.searchParams;
  await requireWorkspace();

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get("sm_temp_import_pages")?.value;

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

  if (!data || !data.list || data.list.length === 0) {
    redirect("/accounts");
  }

  return (
    <SelectAccountsClient
      list={data.list}
      provider={provider || "FACEBOOK"}
    />
  );
}

import { NextResponse } from "next/server";
import { getWorkspaceContext, canManageAccounts } from "@/lib/rbac";
import { getAppOrigin } from "@/lib/social-oauth";

/** Eski form POST → yeni OAuth akışına yönlendir */
export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (!canManageAccounts(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "";
  let provider = "";
  let connectType = "page";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    provider = String(body.provider || "");
    connectType = String(body.type || "page");
  } else {
    const form = await req.formData();
    provider = String(form.get("provider") || "");
    connectType = String(form.get("type") || "page");
  }

  const origin = getAppOrigin(req);
  const target = new URL(
    `/api/accounts/oauth/${provider.toLowerCase()}?type=${encodeURIComponent(connectType)}`,
    origin
  );
  return NextResponse.redirect(target);
}

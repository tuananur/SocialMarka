import { NextResponse } from "next/server";
import { PlatformType } from "@socialmarka/db";
import { getWorkspaceContext, canManageAccounts } from "@/lib/rbac";
import { savePlatformCreds, getPlatformCreds } from "@/lib/platform-credentials";

const VALID = new Set(Object.values(PlatformType));

export async function GET() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canManageAccounts(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const ready: Record<string, boolean> = {};
  for (const p of Object.values(PlatformType)) {
    ready[p] = !!getPlatformCreds(p);
  }
  return NextResponse.json({ ready });
}

export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canManageAccounts(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const provider = String(body.provider || "").toUpperCase();
  const clientId = String(body.clientId || "").trim();
  const clientSecret = String(body.clientSecret || "").trim();

  if (!VALID.has(provider as PlatformType)) {
    return NextResponse.json({ error: "Geçersiz platform" }, { status: 400 });
  }
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Client ID ve Secret gerekli" }, { status: 400 });
  }
  if (clientId.includes("@") || clientId.includes(" ")) {
    return NextResponse.json(
      {
        error:
          "Client ID e-posta değildir. LinkedIn Developer → Auth sekmesindeki Client ID’yi yapıştırın.",
      },
      { status: 400 }
    );
  }

  savePlatformCreds(provider as PlatformType, { clientId, clientSecret });
  return NextResponse.json({ ok: true, provider });
}

import { NextResponse } from "next/server";
import { normalizeCredValue } from "@/lib/platform-credentials";

export const dynamic = "force-dynamic";

export async function GET() {
  const tiktokKey = normalizeCredValue(process.env.TIKTOK_CLIENT_KEY);
  return NextResponse.json({
    ok: true,
    service: "socialmarka-api",
    time: new Date().toISOString(),
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL?.trim()),
      AUTH_SECRET: Boolean(
        process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim(),
      ),
      NEXTAUTH_URL: Boolean(process.env.NEXTAUTH_URL?.trim()),
      NEXT_PUBLIC_APP_URL: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
      TIKTOK_CLIENT_KEY: Boolean(tiktokKey),
      // Safe fingerprint only — never the full key
      tiktokKeyPrefix: tiktokKey ? tiktokKey.slice(0, 4) : null,
      tiktokKeyLen: tiktokKey ? tiktokKey.length : 0,
      tiktokIsSandbox: tiktokKey.startsWith("sbaw"),
    },
  });
}

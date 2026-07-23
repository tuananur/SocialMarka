import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
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
      TIKTOK_CLIENT_KEY: Boolean(process.env.TIKTOK_CLIENT_KEY?.trim()),
    },
  });
}

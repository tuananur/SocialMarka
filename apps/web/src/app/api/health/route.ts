import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "socialmarka-api",
    time: new Date().toISOString(),
  });
}

import { NextResponse } from "next/server";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";

export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  let url = String(body.url || "").trim();
  const postId = body.postId ? String(body.postId) : null;

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "Geçerli bir HTTP/HTTPS bağlantısı girin." }, { status: 400 });
  }

  // Parse Google Drive share links
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (url.includes("drive.google.com") && driveMatch) {
    const fileId = driveMatch[1];
    url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
  }

  // Parse Dropbox links
  if (url.includes("dropbox.com")) {
    url = url.replace("?dl=0", "?dl=1").replace("www.dropbox.com", "dl.dropboxusercontent.com");
  }

  // Parse Box links
  if (url.includes("app.box.com/s/")) {
    url = url.replace("app.box.com/s/", "app.box.com/shared/static/");
  }

  // Infer mime type
  let mimeType = "image/jpeg";
  if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(url)) {
    mimeType = "video/mp4";
  } else if (/\.(png|gif|webp|svg)(\?|$)/i.test(url)) {
    const ext = url.match(/\.(png|gif|webp|svg)/i)?.[1].toLowerCase();
    mimeType = `image/${ext}`;
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      originalUrl: url,
      mimeType,
      postId,
      status: "READY",
    },
  });

  return NextResponse.json({
    assetId: asset.id,
    publicUrl: url,
    mimeType,
  });
}

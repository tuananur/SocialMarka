import { NextResponse } from "next/server";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const assetId = String((body as { assetId?: string }).assetId || "");
  const publicUrl = String((body as { publicUrl?: string }).publicUrl || "");
  const mimeType = String(
    (body as { mimeType?: string }).mimeType || "application/octet-stream",
  );

  if (!assetId || !publicUrl) {
    return NextResponse.json({ error: "assetId ve publicUrl gerekli" }, { status: 400 });
  }

  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset) return NextResponse.json({ error: "Medya kaydı bulunamadı" }, { status: 404 });

  const isMedia = mimeType.startsWith("image/") || mimeType.startsWith("video/");
  const updated = await prisma.mediaAsset.update({
    where: { id: assetId },
    data: {
      originalUrl: publicUrl,
      thumbnailUrl: isMedia ? publicUrl : asset.thumbnailUrl,
      mimeType,
      status: "READY",
    },
  });

  return NextResponse.json({
    assetId: updated.id,
    publicUrl: updated.originalUrl,
    mimeType: updated.mimeType,
  });
}

import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const assetId = String(formData.get("assetId") || "");
  if (!(file instanceof File) || !assetId) {
    return NextResponse.json({ error: "Dosya ve assetId gerekli" }, { status: 400 });
  }

  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset) return NextResponse.json({ error: "Medya kaydı bulunamadı" }, { status: 404 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
  const fileName = `${randomUUID()}-${safeName}`;
  const mimeType = file.type || asset.mimeType || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());
  const isImage = mimeType.startsWith("image/");
  const isVideo = mimeType.startsWith("video/");

  let publicUrl: string;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(`uploads/${ctx.workspaceId}/${fileName}`, buffer, {
        access: "public",
        contentType: mimeType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      publicUrl = blob.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "blob hatası";
      return NextResponse.json({ error: `Blob yükleme başarısız: ${msg}` }, { status: 500 });
    }
  } else {
    const relDir = path.posix.join("uploads", ctx.workspaceId);
    const relPath = path.posix.join(relDir, fileName);
    const publicRoots = [
      path.join(process.cwd(), "public"),
      path.join(process.cwd(), "apps", "web", "public"),
    ];
    let written = false;
    let lastErr: unknown;
    for (const publicRoot of publicRoots) {
      try {
        const absDir = path.join(publicRoot, relDir);
        const absFile = path.join(publicRoot, relPath);
        await mkdir(absDir, { recursive: true });
        await writeFile(absFile, buffer);
        written = true;
        publicUrl = `/${relPath.replace(/\\/g, "/")}`;
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    // Vercel has no durable disk — keep small images/videos as data URLs so calendar still works
    if (!written) {
      const maxInline = 3.5 * 1024 * 1024;
      if (buffer.length <= maxInline && (isImage || isVideo)) {
        publicUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
      } else {
        const msg = lastErr instanceof Error ? lastErr.message : "disk yazma hatası";
        return NextResponse.json(
          {
            error: `Dosya kaydedilemedi (${msg}). Vercel Blob store ekleyin veya 3.5MB altı dosya kullanın.`,
          },
          { status: 500 },
        );
      }
    }
  }

  await prisma.mediaAsset.update({
    where: { id: assetId },
    data: {
      originalUrl: publicUrl,
      // Calendar uses thumbnailUrl || originalUrl; for video keep original as thumb source
      thumbnailUrl: isImage || isVideo ? publicUrl : asset.thumbnailUrl,
      mimeType,
      status: "READY",
    },
  });

  return NextResponse.json({ publicUrl, assetId, mimeType });
}

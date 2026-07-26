import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = ["image/*", "video/*", "application/octet-stream"];

export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN tanımlı değil" },
      { status: 503 },
    );
  }

  const body = (await req.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request: req,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        let assetId = "";
        try {
          assetId = String(JSON.parse(clientPayload || "{}").assetId || "");
        } catch {
          assetId = "";
        }
        if (!assetId) throw new Error("assetId gerekli");

        const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
        if (!asset) throw new Error("Medya kaydı bulunamadı");

        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            assetId,
            workspaceId: ctx.workspaceId,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const payload = JSON.parse(tokenPayload || "{}") as { assetId?: string };
          if (!payload.assetId) return;
          const mimeType = blob.contentType || "application/octet-stream";
          const isMedia = mimeType.startsWith("image/") || mimeType.startsWith("video/");
          await prisma.mediaAsset.update({
            where: { id: payload.assetId },
            data: {
              originalUrl: blob.url,
              thumbnailUrl: isMedia ? blob.url : undefined,
              mimeType,
              status: "READY",
            },
          });
        } catch {
          // Client finalize route is the reliable fallback
        }
      },
    });

    return NextResponse.json(json);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Blob yükleme hatası";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

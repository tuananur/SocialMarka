import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";
import { enqueueMedia } from "@socialmarka/queue";
import { randomUUID } from "crypto";

function getR2Client() {
  const endpoint =
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : "");
  if (!endpoint || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const body = await req.json();
  const fileName = String(body.fileName || "file");
  const mimeType = String(body.mimeType || "application/octet-stream");
  const postId = body.postId ? String(body.postId) : null;

  if (postId) {
    const post = await prisma.post.findFirst({
      where: { id: postId, workspaceId: ctx.workspaceId },
    });
    if (!post) return NextResponse.json({ error: "Gönderi bulunamadı" }, { status: 404 });
  }

  const key = `uploads/${ctx.workspaceId}/${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const client = getR2Client();

  let uploadUrl: string | null = null;
  let publicUrl: string;

  if (client && process.env.R2_BUCKET_NAME) {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
    });
    uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });
    publicUrl = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`
      : uploadUrl.split("?")[0];
  } else {
    // Client will POST bytes to /api/uploads/local (disk or Vercel Blob)
    publicUrl = `/uploads/pending/${randomUUID()}`;
    uploadUrl = null;
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      originalUrl: publicUrl,
      mimeType,
      postId,
      status: "PENDING",
    },
  });

  // Only enqueue media worker when R2 upload will happen; local path marks READY itself.
  // Never block upload on Redis being down.
  if (uploadUrl) {
    void enqueueMedia({ mediaAssetId: asset.id }).catch(() => undefined);
  }

  return NextResponse.json({
    assetId: asset.id,
    uploadUrl,
    publicUrl,
    stub: !uploadUrl,
  });
}

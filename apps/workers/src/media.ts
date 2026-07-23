import { Worker, getConnectionOptions, QUEUE_NAMES, type MediaJobData } from "@socialmarka/queue";
import { prisma } from "@socialmarka/db";
import { spawn } from "child_process";
import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

console.log("[worker-media] başlatılıyor...");

async function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", ["-y", ...args], { stdio: "ignore" });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}`));
    });
  });
}

const worker = new Worker<MediaJobData>(
  QUEUE_NAMES.MEDIA,
  async (job) => {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: job.data.mediaAssetId },
    });
    if (!asset) return;

    const variants: Record<string, string> = {};
    const isVideo = asset.mimeType.startsWith("video/");
    const isImage = asset.mimeType.startsWith("image/");

    try {
      const dir = join(tmpdir(), "socialmarka-media", asset.id);
      await mkdir(dir, { recursive: true });

      const response = await fetch(asset.originalUrl);
      if (!response.ok) {
        throw new Error(`Medya indirilemedi: ${response.status}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const ext = isVideo ? "mp4" : isImage ? "jpg" : "bin";
      const inputPath = join(dir, `input.${ext}`);
      await writeFile(inputPath, buffer);

      if (isVideo) {
        const thumbPath = join(dir, "thumb.jpg");
        const variantPath = join(dir, "variant.mp4");
        try {
          await runFfmpeg([
            "-i",
            inputPath,
            "-ss",
            "00:00:01",
            "-vframes",
            "1",
            thumbPath,
          ]);
          await runFfmpeg([
            "-i",
            inputPath,
            "-vf",
            "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "28",
            variantPath,
          ]);
          variants.verticalMp4 = asset.originalUrl;
          variants.thumbnail = asset.originalUrl;
        } catch {
          variants.thumbnail = asset.originalUrl;
          variants.note = "ffmpeg unavailable — original used";
        }
      } else if (isImage) {
        variants.jpeg = asset.originalUrl;
        variants.webp = asset.originalUrl;
        variants.thumbnail = asset.originalUrl;
      }

      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: {
          variants,
          thumbnailUrl: variants.thumbnail || asset.originalUrl,
          status: "READY",
        },
      });

      try {
        await unlink(inputPath);
      } catch {
        /* ignore */
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Medya işleme hatası";
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: {
          status: "FAILED",
          variants: { error: message },
          thumbnailUrl: asset.originalUrl,
        },
      });
      throw e;
    }
  },
  { connection: getConnectionOptions(), concurrency: 2 }
);

worker.on("completed", (job) => console.log(`[worker-media] tamamlandı ${job.id}`));
worker.on("failed", (job, err) =>
  console.error(`[worker-media] başarısız ${job?.id}`, err.message)
);

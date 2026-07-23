import { access, readFile } from "fs/promises";
import path from "path";
import {
  Worker,
  getConnectionOptions,
  QUEUE_NAMES,
  type PublishJobData,
} from "@socialmarka/queue";
import { prisma, PostStatus, TargetStatus } from "@socialmarka/db";
import {
  decryptToken,
  encryptToken,
  getPlatformAdapter,
  type PublishMediaFile,
} from "@socialmarka/shared";

console.log("[worker-publish] başlatılıyor...");

const worker = new Worker<PublishJobData>(
  QUEUE_NAMES.PUBLISH,
  async (job) => {
    const { postTargetId, postId } = job.data;
    console.log(`[worker-publish] job ${job.id} target=${postTargetId}`);

    const target = await prisma.postTarget.findUnique({
      where: { id: postTargetId },
      include: {
        post: { include: { media: true } },
        socialAccount: true,
      },
    });

    if (!target) {
      throw new Error(`PostTarget bulunamadı: ${postTargetId}`);
    }

    const account = target.socialAccount;
    let accessToken = "stub-token";
    if (account.encryptedAccessToken) {
      try {
        accessToken = decryptToken(account.encryptedAccessToken);
      } catch {
        await prisma.postTarget.update({
          where: { id: postTargetId },
          data: {
            status: TargetStatus.FAILED,
            errorMessage: "Token çözülemedi. Yeniden yetkilendirme gerekli.",
          },
        });
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { status: "REQUIRES_REAUTH" },
        });
        await refreshPostStatus(postId);
        return;
      }
    }

    // Kısa ömürlü OAuth tokenları yayın öncesi yenile
    if (
      (account.provider === "YOUTUBE" || account.provider === "X") &&
      account.encryptedRefreshToken &&
      !accessToken.startsWith("sm_access_")
    ) {
      try {
        const refreshToken = decryptToken(account.encryptedRefreshToken);
        const tokenAdapter = getPlatformAdapter(account.provider);
        if (!tokenAdapter.refreshToken) throw new Error("Token yenileme yok");
        const refreshed = await tokenAdapter.refreshToken(refreshToken);
        accessToken = refreshed.accessToken;
        let encAccess = refreshed.accessToken;
        let encRefresh = refreshed.refreshToken;
        try {
          encAccess = encryptToken(refreshed.accessToken);
          if (refreshed.refreshToken) {
            encRefresh = encryptToken(refreshed.refreshToken);
          }
        } catch {
          /* düz metin sakla — ENCRYPTION_KEY yoksa */
        }
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: {
            encryptedAccessToken: encAccess,
            tokenExpiresAt:
              refreshed.expiresAt || new Date(Date.now() + 3600_000),
            ...(encRefresh
              ? { encryptedRefreshToken: encRefresh }
              : {}),
            status: "CONNECTED",
          },
        });
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : `${account.provider} token yenilenemedi`;
        console.error("[worker-publish] token refresh failed", msg);
        await prisma.postTarget.update({
          where: { id: postTargetId },
          data: {
            status: TargetStatus.FAILED,
            errorMessage: `${msg}. Hesabı yeniden bağlayın.`,
          },
        });
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { status: "REQUIRES_REAUTH" },
        });
        await refreshPostStatus(postId);
        return;
      }
    }

    const adapter = getPlatformAdapter(account.provider);
    const content = target.platformContent || target.post.content;
    const mediaUrls = target.post.media.map((m) => m.originalUrl);
    const mediaFiles: PublishMediaFile[] = [];

    for (const m of target.post.media) {
      const loaded = await loadMediaFile(m.originalUrl, m.mimeType);
      if (loaded) mediaFiles.push(loaded);
      else {
        console.warn(
          `[worker-publish] medya okunamadı: ${m.originalUrl}`
        );
      }
    }

    if (
      (account.provider === "YOUTUBE" || account.provider === "TIKTOK") &&
      mediaFiles.length === 0
    ) {
      await prisma.postTarget.update({
        where: { id: postTargetId },
        data: {
          status: TargetStatus.FAILED,
          errorMessage:
            `${account.provider} için video dosyası bulunamadı. Medyayı yeniden yükleyip paylaşın.`,
        },
      });
      await refreshPostStatus(postId);
      return;
    }

    const result = await adapter.publishPost({
      accessToken,
      providerAccountId: account.providerAccountId,
      content,
      mediaUrls,
      mediaFiles,
    });

    if (result.success) {
      await prisma.postTarget.update({
        where: { id: postTargetId },
        data: {
          status: TargetStatus.PUBLISHED,
          publishedAt: new Date(),
          remotePostId: result.remotePostId,
          errorMessage: null,
        },
      });
      console.log(
        `[worker-publish] yayınlandı remoteId=${result.remotePostId}`
      );
    } else {
      await prisma.postTarget.update({
        where: { id: postTargetId },
        data: {
          status: TargetStatus.FAILED,
          errorMessage: result.errorMessage || "Yayınlama başarısız",
        },
      });
      if (
        result.errorMessage?.includes("canlı bağlı değil") ||
        result.errorMessage?.includes("yeniden bağlayın") ||
        result.errorMessage?.includes("yeniden yetkilendir") ||
        result.errorMessage?.includes("invalid_grant") ||
        result.errorMessage?.includes("Invalid Credentials")
      ) {
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { status: "REQUIRES_REAUTH" },
        });
      }
      console.error(`[worker-publish] hata: ${result.errorMessage}`);
    }

    await refreshPostStatus(postId);
  },
  { connection: getConnectionOptions(), concurrency: 2 }
);

async function loadMediaFile(
  originalUrl: string,
  mimeType: string
): Promise<PublishMediaFile | null> {
  if (!originalUrl) return null;

  if (originalUrl.startsWith("data:")) {
    const m = originalUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return null;
    return {
      buffer: Buffer.from(m[2], "base64"),
      mimeType: m[1] || mimeType,
      fileName: "media",
    };
  }

  if (/^https?:\/\//i.test(originalUrl)) {
    try {
      const res = await fetch(originalUrl);
      if (!res.ok) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      return {
        buffer,
        mimeType: res.headers.get("content-type") || mimeType,
        fileName: path.basename(new URL(originalUrl).pathname) || "media",
      };
    } catch {
      return null;
    }
  }

  const rel = originalUrl.replace(/^\/+/, "").replace(/\\/g, "/");
  const candidates = [
    path.join(process.cwd(), "public", rel),
    path.join(process.cwd(), "../web/public", rel),
    path.join(process.cwd(), "../../apps/web/public", rel),
    path.join(process.cwd(), "apps/web/public", rel),
    path.resolve(__dirname, "../../../web/public", rel),
    path.resolve(__dirname, "../../../../apps/web/public", rel),
  ];

  for (const abs of candidates) {
    try {
      await access(abs);
      const buffer = await readFile(abs);
      return {
        buffer,
        mimeType,
        fileName: path.basename(abs),
      };
    } catch {
      /* try next */
    }
  }

  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  try {
    const res = await fetch(`${base}/${rel}`);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return {
      buffer,
      mimeType: res.headers.get("content-type") || mimeType,
      fileName: path.basename(rel) || "media",
    };
  } catch {
    return null;
  }
}

async function refreshPostStatus(postId: string) {
  const targets = await prisma.postTarget.findMany({ where: { postId } });
  const published = targets.filter((t) => t.status === TargetStatus.PUBLISHED)
    .length;
  const failed = targets.filter((t) => t.status === TargetStatus.FAILED).length;
  const pending = targets.filter((t) => t.status === TargetStatus.PENDING)
    .length;

  let status: PostStatus = PostStatus.SCHEDULED;
  if (pending === 0 && failed === 0 && published > 0)
    status = PostStatus.PUBLISHED;
  else if (pending === 0 && failed > 0 && published > 0)
    status = PostStatus.PARTIAL_FAILED;
  else if (pending === 0 && failed > 0 && published === 0)
    status = PostStatus.FAILED;

  await prisma.post.update({ where: { id: postId }, data: { status } });
}

worker.on("failed", (job, err) => {
  console.error(`[worker-publish] başarısız job=${job?.id}`, err.message);
});

worker.on("completed", (job) => {
  console.log(`[worker-publish] tamamlandı job=${job.id}`);
});

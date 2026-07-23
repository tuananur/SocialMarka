import path from "path";
import { access, readFile } from "fs/promises";
import { prisma, PostStatus, TargetStatus } from "@socialmarka/db";
import {
  decryptToken,
  encryptToken,
  getPlatformAdapter,
  type PublishMediaFile,
} from "@socialmarka/shared";

/**
 * Publish one post target immediately (used on Vercel when Redis/worker is unavailable).
 */
export async function publishPostTargetInline(opts: {
  postTargetId: string;
  postId: string;
}) {
  const { postTargetId, postId } = opts;

  const target = await prisma.postTarget.findUnique({
    where: { id: postTargetId },
    include: {
      post: { include: { media: true } },
      socialAccount: true,
    },
  });

  if (!target) throw new Error(`PostTarget bulunamadı: ${postTargetId}`);

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
      return { success: false as const, error: "Token çözülemedi" };
    }
  }

  if (
    (account.provider === "YOUTUBE" || account.provider === "X") &&
    account.encryptedRefreshToken &&
    !accessToken.startsWith("sm_access_")
  ) {
    try {
      const refreshToken = decryptToken(account.encryptedRefreshToken);
      const tokenAdapter = getPlatformAdapter(account.provider);
      if (tokenAdapter.refreshToken) {
        const refreshed = await tokenAdapter.refreshToken(refreshToken);
        accessToken = refreshed.accessToken;
        let encAccess = refreshed.accessToken;
        let encRefresh = refreshed.refreshToken;
        try {
          encAccess = encryptToken(refreshed.accessToken);
          if (refreshed.refreshToken) encRefresh = encryptToken(refreshed.refreshToken);
        } catch {
          /* keep plain */
        }
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: {
            encryptedAccessToken: encAccess,
            tokenExpiresAt: refreshed.expiresAt || new Date(Date.now() + 3600_000),
            ...(encRefresh ? { encryptedRefreshToken: encRefresh } : {}),
            status: "CONNECTED",
          },
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Token yenilenemedi";
      await prisma.postTarget.update({
        where: { id: postTargetId },
        data: {
          status: TargetStatus.FAILED,
          errorMessage: `${msg}. Hesabı yeniden bağlayın.`,
        },
      });
      await refreshPostStatus(postId);
      return { success: false as const, error: msg };
    }
  }

  const adapter = getPlatformAdapter(account.provider);
  const content = target.platformContent || target.post.content;
  const mediaUrls = target.post.media.map((m) => m.originalUrl);
  const mediaFiles: PublishMediaFile[] = [];

  for (const m of target.post.media) {
    const loaded = await loadMediaFile(m.originalUrl, m.mimeType);
    if (loaded) mediaFiles.push(loaded);
  }

  if (
    (account.provider === "YOUTUBE" || account.provider === "TIKTOK") &&
    mediaFiles.length === 0 &&
    !mediaUrls.some((u) => /^https?:\/\//i.test(u) || u.startsWith("data:"))
  ) {
    await prisma.postTarget.update({
      where: { id: postTargetId },
      data: {
        status: TargetStatus.FAILED,
        errorMessage: `${account.provider} için video medyası gerekli.`,
      },
    });
    await refreshPostStatus(postId);
    return { success: false as const, error: "Medya yok" };
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
  } else {
    await prisma.postTarget.update({
      where: { id: postTargetId },
      data: {
        status: TargetStatus.FAILED,
        errorMessage: result.errorMessage || "Yayınlama başarısız",
      },
    });
  }

  await refreshPostStatus(postId);
  return result;
}

async function loadMediaFile(
  originalUrl: string,
  mimeType: string,
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
      return {
        buffer: Buffer.from(await res.arrayBuffer()),
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
    path.join(process.cwd(), "apps", "web", "public", rel),
  ];
  for (const abs of candidates) {
    try {
      await access(abs);
      const buffer = await readFile(abs);
      return { buffer, mimeType, fileName: path.basename(abs) };
    } catch {
      /* next */
    }
  }
  return null;
}

async function refreshPostStatus(postId: string) {
  const targets = await prisma.postTarget.findMany({ where: { postId } });
  const published = targets.filter((t) => t.status === TargetStatus.PUBLISHED).length;
  const failed = targets.filter((t) => t.status === TargetStatus.FAILED).length;
  const pending = targets.filter((t) => t.status === TargetStatus.PENDING).length;

  let status: PostStatus = PostStatus.SCHEDULED;
  if (pending === 0 && failed === 0 && published > 0) status = PostStatus.PUBLISHED;
  else if (pending === 0 && failed > 0 && published > 0) status = PostStatus.PARTIAL_FAILED;
  else if (pending === 0 && failed > 0 && published === 0) status = PostStatus.FAILED;

  await prisma.post.update({ where: { id: postId }, data: { status } });
}

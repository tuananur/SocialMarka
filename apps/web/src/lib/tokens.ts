import { prisma } from "@socialmarka/db";
import { getPlatformAdapter, decryptToken, encryptToken, resolveAccessToken } from "@socialmarka/shared";

export async function getFreshAccessToken(accountId: string): Promise<string> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId }
  });

  if (!account) {
    throw new Error("Hesap bulunamadı");
  }

  let accessToken = resolveAccessToken(account.encryptedAccessToken);

  // If token is expired or close to expiring (within 60 seconds), refresh it
  const expiresAt = account.tokenExpiresAt;
  const isExpired = expiresAt ? new Date(expiresAt).getTime() < Date.now() + 60000 : true;

  if (
    isExpired &&
    account.encryptedRefreshToken &&
    !accessToken.startsWith("sm_access_")
  ) {
    try {
      const refreshToken = resolveAccessToken(account.encryptedRefreshToken);
      const adapter = getPlatformAdapter(account.provider);
      if (adapter.refreshToken) {
        const refreshed = await adapter.refreshToken(refreshToken);
        accessToken = refreshed.accessToken;
        
        let encAccess = refreshed.accessToken;
        let encRefresh = refreshed.refreshToken;
        try {
          encAccess = encryptToken(refreshed.accessToken);
          if (refreshed.refreshToken) encRefresh = encryptToken(refreshed.refreshToken);
        } catch {
          /* keep plain if enc fails */
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
    } catch (e: any) {
      console.error("[getFreshAccessToken] Failed to refresh token:", e);
      throw new Error("Oturum süresi dolmuş. Lütfen hesabı yeniden bağlayın.");
    }
  }

  return accessToken;
}

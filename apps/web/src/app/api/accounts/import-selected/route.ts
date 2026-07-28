import { cookies } from "next/headers";
import { prisma, AccountStatus } from "@socialmarka/db";
import { requireWorkspace } from "@/lib/rbac";
import { encryptToken } from "@socialmarka/shared";

export async function POST(req: Request) {
  try {
    const { workspaceId, session } = await requireWorkspace();
    if (!workspaceId) {
      return Response.json({ error: "Oturum gerekli" }, { status: 401 });
    }

    const { selectedIds } = (await req.json()) as { selectedIds: string[] };
    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return Response.json({ error: "Hiçbir hesap seçilmedi" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const rawCookie = cookieStore.get("sm_temp_import_pages")?.value;
    if (!rawCookie) {
      return Response.json({ error: "Bağlantı oturumu bulunamadı veya süresi doldu." }, { status: 400 });
    }

    let data: any = null;
    try {
      const jsonStr = Buffer.from(rawCookie, "base64").toString("utf-8");
      data = JSON.parse(jsonStr);
    } catch {
      return Response.json({ error: "Geçersiz veri formatı." }, { status: 400 });
    }

    if (!data || !data.list || data.list.length === 0) {
      return Response.json({ error: "Listeniz boş." }, { status: 400 });
    }

    const toImport = data.list.filter((x: any) => selectedIds.includes(x.providerAccountId));
    if (toImport.length === 0) {
      return Response.json({ error: "Seçilen hesaplar listede bulunamadı." }, { status: 400 });
    }

    // Determine provider: if connectType is business, it's INSTAGRAM, otherwise FACEBOOK
    const provider = data.connectType === "business" ? "INSTAGRAM" : "FACEBOOK";

    let firstAccountName = "";

    for (const item of toImport) {
      const existing = await prisma.socialAccount.findFirst({
        where: {
          workspaceId: data.workspaceId,
          provider,
          providerAccountId: item.providerAccountId,
        },
      });

      let encryptedAccessToken: string | null = null;
      let encryptedRefreshToken: string | null = null;
      try {
        encryptedAccessToken = encryptToken(item.accessToken);
        if (item.refreshToken) encryptedRefreshToken = encryptToken(item.refreshToken);
      } catch {
        encryptedAccessToken = item.accessToken;
        encryptedRefreshToken = item.refreshToken || null;
      }

      const expiresAt = item.expiresIn
        ? new Date(Date.now() + item.expiresIn * 1000)
        : new Date(Date.now() + 90 * 24 * 3600_000);

      let accountId: string;

      if (existing) {
        const updated = await prisma.socialAccount.update({
          where: { id: existing.id },
          data: {
            accountName: item.accountName.slice(0, 120),
            profilePicUrl: item.profilePicUrl || existing.profilePicUrl,
            status: AccountStatus.CONNECTED,
            lastConnectedBy: session.user.name || session.user.email || "Kullanıcı",
            encryptedAccessToken,
            encryptedRefreshToken,
            tokenExpiresAt: expiresAt,
            ...(data.connectGroupId ? { groups: { connect: [{ id: data.connectGroupId }] } } : {}),
          },
        });
        accountId = updated.id;
      } else {
        const created = await prisma.socialAccount.create({
          data: {
            provider,
            providerAccountId: item.providerAccountId,
            accountName: item.accountName.slice(0, 120),
            profilePicUrl: item.profilePicUrl || null,
            status: AccountStatus.CONNECTED,
            lastConnectedBy: session.user.name || session.user.email || "Kullanıcı",
            encryptedAccessToken,
            encryptedRefreshToken,
            tokenExpiresAt: expiresAt,
            workspaceId: data.workspaceId,
            ...(data.connectGroupId ? { groups: { connect: [{ id: data.connectGroupId }] } } : {}),
          },
        });
        accountId = created.id;
      }

      if (!firstAccountName) {
        firstAccountName = item.accountName;
      }

      await prisma.auditLog.create({
        data: {
          action: "ACCOUNT_CONNECTED",
          details: {
            provider,
            connectType: data.connectType,
            via: data.isPlatformApp ? "oauth" : "connect",
            accountName: item.accountName,
            accountId,
            groupId: data.connectGroupId,
          },
          userId: data.userId,
          workspaceId: data.workspaceId,
        },
      });
    }

    // Clear temp cookie
    cookieStore.delete("sm_temp_import_pages");

    return Response.json({ ok: true, firstAccountName });
  } catch (err: any) {
    console.error("[IMPORT SELECTED ERROR]:", err);
    return Response.json({ 
      error: `Hata oluştu: ${err?.message || "Bilinmeyen hata"}` 
    }, { status: 500 });
  }
}

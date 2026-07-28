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
    const rawCookie = cookieStore.get("sm_temp_import_meta")?.value;
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

    if (!data || !data.workspaceId) {
      return Response.json({ error: "Eksik oturum verisi." }, { status: 400 });
    }

    // Determine provider: if connectType is business, it's INSTAGRAM, otherwise FACEBOOK
    const provider = data.connectType === "business" ? "INSTAGRAM" : "FACEBOOK";

    // Query the selected disconnected accounts from the DB
    const toImport = await prisma.socialAccount.findMany({
      where: {
        workspaceId: data.workspaceId,
        provider,
        providerAccountId: { in: selectedIds },
        status: "DISCONNECTED",
      },
    });

    if (toImport.length === 0) {
      return Response.json({ error: "Seçilen hesaplar veritabanında bulunamadı veya zaten bağlı." }, { status: 400 });
    }

    let firstAccountName = "";

    for (const item of toImport) {
      const updated = await prisma.socialAccount.update({
        where: { id: item.id },
        data: {
          status: AccountStatus.CONNECTED,
          lastConnectedBy: session.user.name || session.user.email || "Kullanıcı",
          ...(data.connectGroupId ? { groups: { connect: [{ id: data.connectGroupId }] } } : {}),
        },
      });

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
            accountId: item.id,
            groupId: data.connectGroupId,
          },
          userId: data.userId,
          workspaceId: data.workspaceId,
        },
      });
    }

    // Clean up unselected disconnected accounts of this provider to prevent cluttering
    await prisma.socialAccount.deleteMany({
      where: {
        workspaceId: data.workspaceId,
        provider,
        status: "DISCONNECTED",
        providerAccountId: { notIn: selectedIds },
      },
    });

    // Clear temp cookie
    cookieStore.delete("sm_temp_import_meta");

    return Response.json({ ok: true, firstAccountName });
  } catch (err: any) {
    console.error("[IMPORT SELECTED ERROR]:", err);
    return Response.json({ 
      error: `Hata oluştu: ${err?.message || "Bilinmeyen hata"}` 
    }, { status: 500 });
  }
}

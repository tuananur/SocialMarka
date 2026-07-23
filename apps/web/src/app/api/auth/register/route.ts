import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma, Role } from "@socialmarka/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Geçerli e-posta ve en az 6 karakter şifre gerekli." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        passwordHash,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: `${user.name || "Yeni"} Çalışma Alanı`,
        members: {
          create: { userId: user.id, role: Role.ADMIN },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "WORKSPACE_CREATED",
        details: { workspaceId: workspace.id, via: "email_register" },
        userId: user.id,
        workspaceId: workspace.id,
      },
    });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "";
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code?: string }).code || "")
        : "";
    const dbDown =
      message.includes("Can't reach database") ||
      message.includes("ECONNREFUSED") ||
      message.includes("P1001") ||
      code === "P1001" ||
      code === "P1017";
    const noTables =
      code === "P2021" ||
      message.includes("does not exist") ||
      message.includes("Unique constraint");
    const missingEnv = !process.env.DATABASE_URL?.trim();
    return NextResponse.json(
      {
        error: missingEnv
          ? "DATABASE_URL eksik. Vercel Environment Variables’a Neon Postgres URL ekleyin."
          : dbDown
            ? "Veritabanına bağlanılamıyor. Vercel’deki DATABASE_URL’i kontrol edin (localhost olamaz)."
            : noTables
              ? "Veritabanı tabloları yok. Neon’da prisma db push çalıştırın."
              : "Kayıt sırasında bir hata oluştu.",
        ...(process.env.NODE_ENV !== "production"
          ? { debug: message, code }
          : { code: code || undefined }),
      },
      { status: 500 }
    );
  }
}

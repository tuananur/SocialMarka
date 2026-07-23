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
    const dbDown =
      message.includes("Can't reach database") ||
      message.includes("ECONNREFUSED") ||
      message.includes("P1001");
    return NextResponse.json(
      {
        error: dbDown
          ? "Veritabanına bağlanılamıyor. Postgres’in çalıştığından emin olun (docker compose up -d postgres)."
          : "Kayıt sırasında bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}

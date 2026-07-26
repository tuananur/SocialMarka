import { NextResponse } from "next/server";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const { name, currentPassword, newPassword } = body;

    // 1. Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    const updateData: { name?: string; passwordHash?: string } = {};

    // Update name if changed
    if (name && name !== user.name) {
      updateData.name = name;
    }

    // Update password if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Şifrenizi değiştirmek için mevcut şifrenizi girmeniz gerekir." },
          { status: 400 }
        );
      }

      if (!user.passwordHash) {
        return NextResponse.json(
          { error: "Bu hesap şifreli girişe sahip değil (Google Auth kullanılıyor olabilir)." },
          { status: 400 }
        );
      }

      // Verify current password
      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordCorrect) {
        return NextResponse.json(
          { error: "Mevcut şifreniz yanlış." },
          { status: 400 }
        );
      }

      // Hash new password
      const hashed = await bcrypt.hash(newPassword, 10);
      updateData.passwordHash = hashed;
    }

    // Save changes if there's anything to update
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true, message: "Profiliniz başarıyla güncellendi." });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Sistem hatası oluştu." }, { status: 500 });
  }
}

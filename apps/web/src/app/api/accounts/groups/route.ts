import { NextResponse } from "next/server";
import { prisma } from "@socialmarka/db";
import { getWorkspaceContext, canEditContent } from "@/lib/rbac";

export async function GET(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });

  const groups = await prisma.accountGroup.findMany({
    where: { workspaceId: ctx.workspaceId },
    include: { accounts: { select: { id: true, accountName: true, provider: true } } },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ groups });
}

export async function POST(req: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!canEditContent(ctx.role)) return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  const accountIds = body.accountIds;

  if (!name) return NextResponse.json({ error: "Grup adı boş olamaz" }, { status: 400 });
  if (!Array.isArray(accountIds)) return NextResponse.json({ error: "Geçersiz hesap listesi" }, { status: 400 });

  const group = await prisma.accountGroup.create({
    data: {
      workspaceId: ctx.workspaceId,
      name,
      accounts: {
        connect: accountIds.map((id: string) => ({ id }))
      }
    },
    include: { accounts: true }
  });

  return NextResponse.json({ success: true, group });
}

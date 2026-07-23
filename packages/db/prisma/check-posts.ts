import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      targets: {
        include: {
          socialAccount: { select: { accountName: true, provider: true } },
        },
      },
      media: { select: { id: true, mimeType: true, originalUrl: true } },
    },
  });

  for (const p of posts) {
    console.log("---");
    console.log("id:", p.id);
    console.log("status:", p.status);
    console.log("content:", JSON.stringify(p.content).slice(0, 120));
    console.log("scheduledAt:", p.scheduledAt);
    console.log("updatedAt:", p.updatedAt.toISOString());
    console.log(
      "media:",
      p.media.length,
      p.media.map((m) => m.mimeType).join(",")
    );
    for (const t of p.targets) {
      console.log(
        "  target:",
        t.socialAccount.provider,
        t.socialAccount.accountName,
        "|",
        t.status,
        "|",
        t.errorMessage || t.remotePostId || "-"
      );
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

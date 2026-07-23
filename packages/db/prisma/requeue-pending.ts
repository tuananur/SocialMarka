import { PrismaClient } from "@prisma/client";
import { enqueuePublish } from "@socialmarka/queue";

const prisma = new PrismaClient();

async function main() {
  const pending = await prisma.postTarget.findMany({
    where: { status: "PENDING" },
    include: {
      post: { include: { media: true } },
      socialAccount: { select: { provider: true, accountName: true } },
    },
    orderBy: { id: "asc" },
  });

  console.log("PENDING targets:", pending.length);
  for (const t of pending) {
    console.log(
      t.id,
      t.socialAccount.provider,
      t.post.status,
      "media:",
      t.post.media.map((m) => `${m.mimeType} ${m.originalUrl}`).join("; ")
    );
    const job = await enqueuePublish(
      { postTargetId: t.id, postId: t.postId },
      { delay: 0 }
    );
    console.log("  enqueued job", job.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    // allow redis to flush enqueue
    setTimeout(() => process.exit(0), 500);
  });

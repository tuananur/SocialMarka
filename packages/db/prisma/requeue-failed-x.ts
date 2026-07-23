import { PrismaClient, TargetStatus, PostStatus } from "@prisma/client";
import { enqueuePublish } from "@socialmarka/queue";

const prisma = new PrismaClient();

async function main() {
  const failed = await prisma.postTarget.findMany({
    where: {
      status: TargetStatus.FAILED,
      socialAccount: { provider: "X" },
    },
    orderBy: { id: "desc" },
    take: 5,
  });

  console.log("FAILED X targets:", failed.length);
  for (const t of failed) {
    await prisma.postTarget.update({
      where: { id: t.id },
      data: { status: TargetStatus.PENDING, errorMessage: null },
    });
    await prisma.post.update({
      where: { id: t.postId },
      data: { status: PostStatus.SCHEDULED },
    });
    const job = await enqueuePublish(
      { postTargetId: t.id, postId: t.postId },
      { delay: 0 }
    );
    console.log("requeued", t.id, "job", job.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    setTimeout(() => process.exit(0), 800);
  });

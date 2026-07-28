import { NextResponse } from "next/server";
import { prisma, PostStatus, TargetStatus } from "@socialmarka/db";
import { publishPostTargetInline } from "@/lib/run-publish";

export const maxDuration = 120; // 2 minutes max duration for serverless execution

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    const cronKey = process.env.CRON_SECRET || "socialmarka-cron-default-key";

    // Basic protection so arbitrary users cannot trigger it repeatedly
    if (key !== cronKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all scheduled posts whose time has passed
    const now = new Date();
    const scheduledPosts = await prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: { lte: now },
      },
      include: {
        targets: true,
      },
    });

    const results = [];

    for (const post of scheduledPosts) {
      const pendingTargets = post.targets.filter((t) => t.status === TargetStatus.PENDING);
      
      const postResults = [];
      for (const target of pendingTargets) {
        try {
          const res = await publishPostTargetInline({
            postId: post.id,
            postTargetId: target.id,
          });
          postResults.push({
            targetId: target.id,
            success: !res || (res.success !== false),
            error: res && "error" in res ? res.error : null,
          });
        } catch (err: any) {
          postResults.push({
            targetId: target.id,
            success: false,
            error: err?.message || err,
          });
        }
      }

      results.push({
        postId: post.id,
        targetsCount: pendingTargets.length,
        results: postResults,
      });
    }

    return NextResponse.json({
      ok: true,
      processedPosts: scheduledPosts.length,
      results,
    });
  } catch (err: any) {
    console.error("[CRON TRIGGER ERROR]:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

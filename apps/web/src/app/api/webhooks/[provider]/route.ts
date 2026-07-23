import { NextResponse } from "next/server";
import { prisma, PlatformType } from "@socialmarka/db";
import { enqueueWebhook } from "@socialmarka/queue";

const PROVIDERS: Record<string, PlatformType> = {
  facebook: PlatformType.FACEBOOK,
  instagram: PlatformType.INSTAGRAM,
  linkedin: PlatformType.LINKEDIN,
  youtube: PlatformType.YOUTUBE,
  x: PlatformType.X,
  twitter: PlatformType.X,
  tiktok: PlatformType.TIKTOK,
  pinterest: PlatformType.PINTEREST,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === (process.env.META_WEBHOOK_VERIFY_TOKEN || "socialmarka-verify")
  ) {
    return new NextResponse(challenge || "", { status: 200 });
  }

  return NextResponse.json({
    ok: true,
    provider,
    message: "Webhook endpoint hazır",
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerKey } = await params;
  const platform = PROVIDERS[providerKey.toLowerCase()];
  if (!platform) {
    return NextResponse.json({ error: "Bilinmeyen sağlayıcı" }, { status: 400 });
  }

  const payload = await req.json().catch(() => ({}));
  const signature = req.headers.get("x-hub-signature-256");
  const signatureValid = !process.env.META_WEBHOOK_SECRET || !!signature;

  const eventId =
    (payload as { id?: string }).id ||
    (payload as { entry?: { id?: string }[] }).entry?.[0]?.id ||
    `${Date.now()}`;

  try {
    const event = await prisma.webhookEvent.create({
      data: {
        provider: platform,
        eventId: String(eventId),
        payload,
        signatureValid,
        status: "PENDING",
      },
    });

    await enqueueWebhook({ webhookEventId: event.id });
    return NextResponse.json({ ok: true, id: event.id });
  } catch {
    return NextResponse.json({ ok: true, duplicate: true });
  }
}

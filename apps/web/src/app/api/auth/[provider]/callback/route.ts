import { handleOAuthCallback } from "@/lib/oauth-connect";

type Params = { params: Promise<{ provider: string }> };

/**
 * SocialPilot: GET /api/auth/{provider}/callback?code=&state=
 * Token exchange → AES-256-GCM → SocialAccount → /accounts?status=success
 */
export async function GET(req: Request, { params }: Params) {
  const { provider } = await params;
  return handleOAuthCallback(req, provider);
}

import { handleOAuthConnect } from "@/lib/oauth-connect";

type Params = { params: Promise<{ provider: string }> };

/**
 * SocialPilot: GET /api/auth/{provider}/connect
 * State (CSRF) → provider consent → callback
 */
export async function GET(req: Request, { params }: Params) {
  const { provider } = await params;
  return handleOAuthConnect(req, provider);
}

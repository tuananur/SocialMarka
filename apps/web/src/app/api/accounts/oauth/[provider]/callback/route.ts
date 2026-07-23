import { handleOAuthCallback } from "@/lib/oauth-connect";

type Params = { params: Promise<{ provider: string }> };

/**
 * Legacy callback — Google/LinkedIn konsolunda kayıtlı URI:
 * /api/accounts/oauth/{provider}/callback
 */
export async function GET(req: Request, { params }: Params) {
  const { provider } = await params;
  return handleOAuthCallback(req, provider);
}

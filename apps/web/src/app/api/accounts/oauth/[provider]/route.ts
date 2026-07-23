import { handleOAuthConnect } from "@/lib/oauth-connect";

type Params = { params: Promise<{ provider: string }> };

/** Legacy alias → /api/auth/{provider}/connect */
export async function GET(req: Request, { params }: Params) {
  const { provider } = await params;
  return handleOAuthConnect(req, provider);
}

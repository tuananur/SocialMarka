import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const accounts = await p.socialAccount.findMany({
    where: { status: { not: "DISCONNECTED" } },
    select: {
      accountName: true,
      provider: true,
      providerAccountId: true,
      status: true,
      encryptedAccessToken: true,
    },
    orderBy: { createdAt: "desc" },
  });

  for (const a of accounts) {
    const tok = a.encryptedAccessToken || "";
    const local =
      tok.startsWith("sm_access_") ||
      a.providerAccountId.startsWith("local_") ||
      a.providerAccountId.startsWith("seed_");
    // encrypted tokens contain ":" separators; plaintext sm_access does not look encrypted
    const looksEncrypted = tok.includes(":") && tok.length > 40;
    const kind = local
      ? "YEREL"
      : looksEncrypted || !tok.startsWith("sm_")
        ? "GERCEK OAUTH"
        : "BILINMIYOR";
    console.log(`${a.provider} | ${a.accountName} | ${a.status} | ${kind}`);
  }
  if (!accounts.length) console.log("Hic bagli hesap yok.");
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());

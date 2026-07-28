require("dotenv").config({ path: "c:/Users/Casper/Desktop/socailmarka/.env" });
const { PrismaClient } = require("c:/Users/Casper/Desktop/socailmarka/node_modules/@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_z6TouiV9LBHG@ep-soft-union-alyt40nb-pooler.c-3.eu-central-1.aws.neon.tech/socialmarka?sslmode=require"
    }
  }
});

function getKey() {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

function looksEncryptedToken(payload) {
  const parts = payload.split(":");
  if (parts.length !== 3) return false;
  return parts.every((p) => /^[0-9a-f]+$/i.test(p) && p.length >= 16);
}

function decryptToken(payload) {
  if (!payload || !payload.trim()) return "";
  if (!looksEncryptedToken(payload)) return payload;
  const key = getKey();
  const [ivHex, tagHex, dataHex] = payload.split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

async function main() {
  const accounts = await prisma.socialAccount.findMany({});
  console.log("All accounts in DB:", accounts.map(a => ({
    id: a.id,
    name: a.accountName,
    provider: a.provider,
    status: a.status,
    hasToken: !!a.encryptedAccessToken,
    workspaceId: a.workspaceId
  })));
  if (accounts.length === 0) {
    console.error("No accounts found at all");
    return;
  }
  const account = accounts.find(a => a.provider === "FACEBOOK");
  if (!account) return;

  console.log("Account found:", {
    id: account.id,
    name: account.accountName,
    provider: account.provider,
  });
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });
  console.log("Recent Audit Logs:", JSON.stringify(logs, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

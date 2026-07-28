const { PrismaClient } = require("c:/Users/Casper/Desktop/socailmarka/node_modules/@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_z6TouiV9LBHG@ep-soft-union-alyt40nb-pooler.c-3.eu-central-1.aws.neon.tech/socialmarka?sslmode=require"
    }
  }
});

function decryptToken(encrypted) {
  if (!encrypted) return "";
  if (encrypted.startsWith("sm_access_") || encrypted.startsWith("stub-") || encrypted.startsWith("demo-")) {
    return encrypted;
  }
  try {
    const key = Buffer.from("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "utf8");
    const [ivHex, ciphertextHex] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    return encrypted;
  }
}

async function main() {
  const account = await prisma.socialAccount.findFirst({
    where: {
      provider: "FACEBOOK",
      accountName: "Atilla Kesicioğlu"
    }
  });

  if (!account) {
    console.error("Account not found");
    return;
  }

  const token = decryptToken(account.encryptedAccessToken);
  console.log("Decrypted Token length:", token.length);

  console.log("\n=== ME PROFILE ===");
  const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token}`);
  console.log(await meRes.json());

  console.log("\n=== ME PERMISSIONS ===");
  const permRes = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${token}`);
  const perms = await permRes.json();
  console.log(perms);

  console.log("\n=== ME ACCOUNTS (PAGES) ===");
  const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${token}`);
  const pages = await pagesRes.json();
  console.log(JSON.stringify(pages, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

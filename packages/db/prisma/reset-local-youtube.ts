import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const deleted = await p.socialAccount.deleteMany({
    where: {
      OR: [
        { provider: "YOUTUBE" },
        { providerAccountId: { startsWith: "local_" } },
      ],
    },
  });
  console.log("Silinen hesap:", deleted.count);

  const hasYtId = Boolean(process.env.YOUTUBE_CLIENT_ID?.trim());
  const hasYtSecret = Boolean(process.env.YOUTUBE_CLIENT_SECRET?.trim());
  console.log("YOUTUBE_CLIENT_ID tanımlı:", hasYtId);
  console.log("YOUTUBE_CLIENT_SECRET tanımlı:", hasYtSecret);

  if (hasYtId && hasYtSecret) {
    console.log("OK: Gercek YouTube OAuth icin anahtarlar hazir.");
  } else {
    console.log("EKSIK: .env YouTube anahtarlarini kontrol et.");
  }
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());

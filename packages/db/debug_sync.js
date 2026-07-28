const { PrismaClient } = require("c:/Users/Casper/Desktop/socailmarka/node_modules/@prisma/client");
const { resolveAccessToken } = require("c:/Users/Casper/Desktop/socailmarka/packages/shared/dist/index.js");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_z6TouiV9LBHG@ep-soft-union-alyt40nb-pooler.c-3.eu-central-1.aws.neon.tech/socialmarka?sslmode=require"
    }
  }
});

async function main() {
  const account = await prisma.socialAccount.findFirst({
    where: {
      provider: "INSTAGRAM",
      accountName: "w.tuana.nur.x"
    }
  });

  if (!account) {
    console.log("Account w.tuana.nur.x not found in DB!");
    return;
  }

  const token = resolveAccessToken(account.encryptedAccessToken);
  console.log("Resolved access token length:", token.length);

  const url = `https://graph.facebook.com/v19.0/${account.providerAccountId}/media?fields=id,caption,comments{id,text,username,timestamp,from}&access_token=${encodeURIComponent(token)}`;
  console.log("Fetching URL:", url);

  const res = await fetch(url);
  const data = await res.json();

  console.log("Graph API Response Status:", res.status);
  console.log("Response Data:", JSON.stringify(data, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

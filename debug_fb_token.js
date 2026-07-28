
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { decryptToken } = require('./packages/shared/dist/crypto.js');
const prisma = new PrismaClient();

async function main() {
  const account = await prisma.socialAccount.findFirst({
    where: { provider: 'FACEBOOK', status: 'CONNECTED' },
    orderBy: { createdAt: 'desc' }
  });
  if (!account || !account.encryptedAccessToken) {
    console.log('No connected Facebook account found in DB');
    return;
  }
  console.log('Found account:', account.accountName);
  const token = decryptToken(account.encryptedAccessToken);
  console.log('Decrypted token length:', token.length);

  // Query /me/accounts
  const res1 = await fetch('https://graph.facebook.com/v19.0/me/accounts?limit=100&access_token=' + encodeURIComponent(token));
  const json1 = await res1.json();
  console.log('/me/accounts response:', JSON.stringify(json1, null, 2));

  // Query Beyin Atölyesi directly
  const res2 = await fetch('https://graph.facebook.com/v19.0/677128712399382?fields=id,name,picture,instagram_business_account&access_token=' + encodeURIComponent(token));
  const json2 = await res2.json();
  console.log('Direct Beyin Atölyesi response:', JSON.stringify(json2, null, 2));
}

main().catch(console.error).finally(() => prisma.\\\());


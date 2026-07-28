require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function getKey() {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

function looksEncryptedToken(payload) {
  const parts = payload.split(':');
  if (parts.length !== 3) return false;
  return parts.every((p) => /^[0-9a-f]+$/i.test(p) && p.length >= 16);
}

function decryptToken(payload) {
  if (!payload || !payload.trim()) return '';
  if (!looksEncryptedToken(payload)) return payload;
  const key = getKey();
  const [ivHex, tagHex, dataHex] = payload.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

async function main() {
  const account = await prisma.socialAccount.findFirst({
    where: { provider: 'YOUTUBE', accountName: 'Tuana nur Yalçın' },
    orderBy: { createdAt: 'desc' }
  });
  if (!account || !account.encryptedAccessToken) {
    console.log('No YouTube account found');
    return;
  }
  console.log('Found YouTube account:', account.accountName);
  const token = decryptToken(account.encryptedAccessToken);
  console.log('Access token length:', token.length);

  const res = await fetch('https://oauth2.googleapis.com/tokeninfo?access_token=' + encodeURIComponent(token));
  const json = await res.json();
  console.log('Token Info:', JSON.stringify(json, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

/** Encrypted payloads are `ivHex:tagHex:dataHex` (all hex). */
export function looksEncryptedToken(payload: string): boolean {
  const parts = payload.split(":");
  if (parts.length !== 3) return false;
  return parts.every((p) => /^[0-9a-f]+$/i.test(p) && p.length >= 16);
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

/**
 * Decrypt AES payload, or return plaintext if the value was stored unencrypted
 * (common when TOKEN_ENCRYPTION_KEY was missing at connect time).
 */
export function decryptToken(payload: string): string {
  if (!payload?.trim()) {
    throw new Error("Empty token");
  }
  if (!looksEncryptedToken(payload)) {
    return payload;
  }
  const key = getKey();
  const [ivHex, tagHex, dataHex] = payload.split(":");
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

/** Soft resolve for publish paths — never throw on plaintext; clear error if AES fails. */
export function resolveAccessToken(stored: string | null | undefined): string {
  if (!stored?.trim()) {
    throw new Error("Access token yok. Hesabı yeniden bağlayın.");
  }
  try {
    return decryptToken(stored);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Token çözülemedi";
    if (msg.includes("TOKEN_ENCRYPTION_KEY")) {
      throw new Error(
        "Sunucuda TOKEN_ENCRYPTION_KEY eksik. Env ayarını kontrol edin veya hesabı yeniden bağlayın.",
      );
    }
    throw new Error("Token çözülemedi. Hesabı yeniden bağlayın.");
  }
}

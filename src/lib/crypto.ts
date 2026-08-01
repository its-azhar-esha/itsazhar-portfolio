/**
 * AES-256-GCM secret encryption (server-only).
 *
 * Used by the Integration Center to store API keys encrypted at rest.
 * Only ciphertext ever reaches the database; the key never does.
 *
 * Key material (highest priority first):
 *   1. SECRET_ENCRYPTION_KEY env var (base64 / arbitrary string, SHA-256
 *      derived to 32 bytes) — recommended for production.
 *   2. Fallback: SHA-256 of SUPABASE_SERVICE_ROLE_KEY + Supabase URL.
 *      Stable for the life of the project, requires zero extra config,
 *      and never leaves the server.
 *
 * IMPORTANT: never import this module (directly or transitively) into a
 * client component bundle — it must only run on the server.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const KEY_ENV = process.env.SECRET_ENCRYPTION_KEY?.trim() ?? "";
const FALLBACK_SEED = `${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}:${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}`;

function getKey(): Buffer {
  const seed = KEY_ENV || FALLBACK_SEED;
  if (!seed) {
    throw new Error("[crypto] No key material configured (SECRET_ENCRYPTION_KEY or service role key).");
  }
  return createHash("sha256").update(seed, "utf8").digest();
}

/** Encrypt a string, returning `v1:<iv|authTag|ciphertext>` base64. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${Buffer.concat([iv, tag, ciphertext]).toString("base64")}`;
}

/** Decrypt a `v1:` payload. Returns null for malformed/unreadable input. */
export function decryptSecret(payload: string): string | null {
  try {
    if (!payload.startsWith("v1:")) return null;
    const raw = Buffer.from(payload.slice(3), "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch (err) {
    console.error("[crypto] decrypt failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

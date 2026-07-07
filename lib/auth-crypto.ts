import { createHash, createHmac, timingSafeEqual } from "crypto"

/**
 * Secret used to HMAC-sign auth payloads (session cookie, invite links). Set
 * AUTH_SESSION_SECRET in the environment; without it we derive a secret from
 * DATABASE_URL (which contains the DB password) so signatures stay unforgeable
 * even before the var is set.
 */
function getAuthSecret(): string {
  const explicit = process.env.AUTH_SESSION_SECRET?.trim()
  if (explicit) return explicit

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("AUTH_SESSION_SECRET or DATABASE_URL must be set to sign auth payloads")
  }
  return createHash("sha256").update(`rootline-admin-session|${databaseUrl}`).digest("hex")
}

export function signAuthPayload(payload: string): string {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url")
}

export function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

/**
 * Fingerprint of the user's password hash, mixed into the session signature so
 * changing or clearing the password revokes every active session.
 */
export function passwordFingerprint(passwordHash: string | null): string {
  return createHash("sha256").update(passwordHash ?? "no-password").digest("base64url")
}

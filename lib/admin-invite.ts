import { safeEqualStrings, signAuthPayload } from "@/lib/auth-crypto"

export const ADMIN_INVITE_TTL_SECONDS = 60 * 60 * 72 // 3 days

/**
 * One-time-style invite token gating the /auth password-setup flow. Token:
 * `<expiresEpochSeconds>.<hmac(email|expires)>`, generated with
 * `npm run admin-invite -- <email>` and carried in the invite link.
 */
export function createAdminInviteToken(
  email: string,
  ttlSeconds: number = ADMIN_INVITE_TTL_SECONDS
): string {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds
  return `${expires}.${signAuthPayload(`invite|${email.toLowerCase()}|${expires}`)}`
}

export function verifyAdminInviteToken(email: string, token: string): boolean {
  const [expiresRaw, signature] = token.split(".")
  const expires = Number(expiresRaw)
  if (!expiresRaw || !signature || !Number.isFinite(expires) || expires * 1000 < Date.now()) {
    return false
  }

  const expected = signAuthPayload(`invite|${email.toLowerCase()}|${expiresRaw}`)
  return safeEqualStrings(signature, expected)
}

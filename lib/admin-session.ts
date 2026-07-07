import { cookies } from "next/headers"

import { passwordFingerprint, safeEqualStrings, signAuthPayload } from "@/lib/auth-crypto"
import { prisma } from "@/lib/prisma"

export const ADMIN_SESSION_COOKIE = "admin_session"
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/**
 * Cookie value: `v1.<userId>.<expiresEpochSeconds>.<hmac>`. The signature also
 * covers the user's password fingerprint, so resetting the password (e.g. with
 * `npm run reset-admin-password`) revokes every active session for that user.
 */
export function createAdminSessionCookieValue(userId: string, passwordHash: string | null): string {
  const expires = Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE
  const payload = `${userId}.${expires}`
  return `v1.${payload}.${signAuthPayload(`${payload}.${passwordFingerprint(passwordHash)}`)}`
}

function parseSessionCookie(value: string): { userId: string; payload: string; signature: string } | null {
  const parts = value.split(".")
  if (parts.length !== 4 || parts[0] !== "v1") return null

  const [, userId, expiresRaw, signature] = parts
  const expires = Number(expiresRaw)
  if (!userId || !signature || !Number.isFinite(expires) || expires * 1000 < Date.now()) return null

  return { userId, payload: `${userId}.${expiresRaw}`, signature }
}

export async function getAdminSessionUser() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!raw) return null

  const parsed = parseSessionCookie(raw)
  if (!parsed) return null

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      passwordHash: true,
    },
  })
  if (!user) return null

  const expected = signAuthPayload(`${parsed.payload}.${passwordFingerprint(user.passwordHash)}`)
  if (!safeEqualStrings(parsed.signature, expected)) return null

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
  }
}

/** Auth guard for admin-only server actions: active admin session or null. */
export async function requireAdminUser() {
  const user = await getAdminSessionUser()
  return user?.isActive ? user : null
}

import bcrypt from "bcryptjs"

import { createAdminInviteToken } from "@/lib/admin-invite"
import { prisma } from "@/lib/prisma"

/** Panel login user (User model) — separate from field Employee records. */
export async function upsertPanelUserForEmployee(params: {
  email: string
  firstName: string
  lastName: string
  /** Set password (min 8). Omit to leave unchanged. Pass null to clear for /auth setup. */
  password?: string | null
}) {
  const email = params.email.trim().toLowerCase()

  let passwordHash: string | null | undefined
  if (params.password === null) {
    passwordHash = null
  } else if (typeof params.password === "string" && params.password.length > 0) {
    if (params.password.length < 8) {
      throw new Error("PASSWORD_TOO_SHORT")
    }
    passwordHash = await bcrypt.hash(params.password, 12)
  }

  const base = {
    firstName: params.firstName,
    lastName: params.lastName,
    isActive: true,
  }

  if (passwordHash !== undefined) {
    return prisma.user.upsert({
      where: { email },
      create: { email, ...base, passwordHash },
      update: { ...base, passwordHash },
    })
  }

  return prisma.user.upsert({
    where: { email },
    create: { email, ...base, passwordHash: null },
    update: base,
  })
}

/**
 * Signed first-login link for the /auth password-setup flow. The invite token
 * is required since password setup is gated (see lib/admin-invite); a plain
 * ?mode=setup link no longer works.
 */
export function panelSetupUrl(email: string, siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") {
  const normalized = email.trim().toLowerCase()
  const invite = createAdminInviteToken(normalized)
  const query = `mode=setup&email=${encodeURIComponent(normalized)}&invite=${encodeURIComponent(invite)}`
  return `${siteUrl.replace(/\/$/, "")}/auth?${query}`
}

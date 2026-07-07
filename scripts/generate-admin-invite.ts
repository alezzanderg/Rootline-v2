import "dotenv/config"

/**
 * Generate a signed invite link so a user without password can set one
 * through the /auth setup flow.
 *
 * Usage:
 *   npm run admin-invite -- teammate@rootlinenj.com
 *
 * The link is signed with AUTH_SESSION_SECRET (or the DATABASE_URL fallback),
 * so the environment that serves /auth must use the same secret as this shell.
 */
import { ADMIN_INVITE_TTL_SECONDS, createAdminInviteToken } from "../lib/admin-invite"
import { prisma } from "../lib/prisma"

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()

  if (!email) {
    console.error("Usage: npm run admin-invite -- <email>")
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`No user found with email: ${email}`)
    console.log(`Create it first:\n  npm run reset-admin-password -- ${email} TempPassword123`)
    process.exit(1)
  }

  if (user.passwordHash) {
    console.log(`Note: ${email} already has a password. The invite only works after clearing it:`)
    console.log(`  npm run reset-admin-password -- ${email}\n`)
  }

  const token = createAdminInviteToken(email)
  const query = `mode=setup&email=${encodeURIComponent(email)}&invite=${encodeURIComponent(token)}`

  console.log(`Invite link for ${email} (valid ${ADMIN_INVITE_TTL_SECONDS / 3600}h):\n`)
  console.log(`  Production: https://auth.rootlinenj.com/auth?${query}`)
  console.log(`  Local dev:  http://localhost:3000/auth?${query}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

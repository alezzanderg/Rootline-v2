import "dotenv/config"

/**
 * Reset an admin user's password locally.
 *
 * Usage:
 *   npm run reset-admin-password -- admin@rootline.com NewPassword123
 *   npm run reset-admin-password -- admin@rootline.com   (clears password → use /auth setup flow)
 */
import bcrypt from "bcryptjs"

import { prisma } from "../lib/prisma"

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()
  const newPassword = process.argv[3]

  if (!email) {
    console.error("Usage: npm run reset-admin-password -- <email> [new-password]")
    process.exit(1)
  }

  let user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    if (!newPassword) {
      console.error(`No user found with email: ${email}`)
      console.log("\nExisting users:")
      const users = await prisma.user.findMany({
        select: { email: true, firstName: true, lastName: true },
        orderBy: { email: "asc" },
      })
      if (users.length === 0) {
        console.log("  (none)")
      } else {
        for (const u of users) {
          console.log(`  - ${u.email}${u.firstName ? ` (${u.firstName})` : ""}`)
        }
      }
      console.log(
        `\nTo create this admin and set a password:\n  npm run reset-admin-password -- ${email} YourNewPassword123`
      )
      process.exit(1)
    }

    if (newPassword.length < 8) {
      console.error("Password must be at least 8 characters.")
      process.exit(1)
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    user = await prisma.user.create({
      data: { email, passwordHash, isActive: true },
    })
    console.log(`Admin user created: ${email}`)
    console.log("Sign in at: http://localhost:3000/auth")
    return
  }

  if (!newPassword) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: null },
    })
    console.log(`Password cleared for ${email}`)
    console.log(`Open: http://localhost:3000/auth?mode=setup&email=${encodeURIComponent(email)}`)
    console.log("Set a new password (min. 8 characters) on that page.")
    return
  }

  if (newPassword.length < 8) {
    console.error("Password must be at least 8 characters.")
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })

  console.log(`Password updated for ${email}`)
  console.log("Sign in at: http://localhost:3000/auth")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

"use server"

import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { verifyAdminInviteToken } from "@/lib/admin-invite"
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionCookieValue,
} from "@/lib/admin-session"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { prisma } from "@/lib/prisma"

/** Compared against when the email does not exist, so both paths cost one bcrypt round. */
const DUMMY_PASSWORD_HASH = "$2b$12$pgJFPTOQwEXgWSlKHwIkXeGsRrhA6gR7ku1VxQqjWxQEyxNIz8oxm"

const RATE_WINDOW_MS = 5 * 60_000

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")
  const mode = String(formData.get("mode") ?? "signin")
  const invite = String(formData.get("invite") ?? "").trim()

  if (!email || !password) {
    redirect("/auth?error=missing")
  }

  const clientIp = await getClientIp()
  if (
    !checkRateLimit(`signin:ip:${clientIp}`, 10, RATE_WINDOW_MS) ||
    !checkRateLimit(`signin:email:${email}`, 5, RATE_WINDOW_MS)
  ) {
    redirect(`/auth?error=rate&email=${encodeURIComponent(email)}`)
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH)
      redirect(`/auth?error=invalid&email=${encodeURIComponent(email)}`)
    }

    let sessionPasswordHash = user.passwordHash

    if (!user.passwordHash) {
      // Password setup requires an invite link (npm run admin-invite -- <email>).
      if (!invite || !verifyAdminInviteToken(email, invite)) {
        redirect(`/auth?error=invite&email=${encodeURIComponent(email)}`)
      }

      const setupParams = `email=${encodeURIComponent(email)}&invite=${encodeURIComponent(invite)}`

      if (mode !== "setup") {
        redirect(`/auth?mode=setup&${setupParams}`)
      }

      if (password.length < 8) {
        redirect(`/auth?mode=setup&error=short&${setupParams}`)
      }

      if (password !== confirmPassword) {
        redirect(`/auth?mode=setup&error=mismatch&${setupParams}`)
      }

      const passwordHash = await bcrypt.hash(password, 12)
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      })
      sessionPasswordHash = passwordHash
    } else {
      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        redirect(`/auth?error=invalid&email=${encodeURIComponent(email)}`)
      }
    }

    const cookieStore = await cookies()
    cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSessionCookieValue(user.id, sessionPasswordHash), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    })

    redirect("/dashboard")
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      const digest = String((error as { digest?: string }).digest ?? "")
      if (digest.startsWith("NEXT_REDIRECT")) {
        throw error
      }
    }

    console.error("[auth] sign-in failed:", error)

    const code =
      error instanceof Error && error.message.includes("DATABASE_URL")
        ? "config"
        : "server"

    redirect(`/auth?error=${code}&email=${encodeURIComponent(email)}`)
  }
}

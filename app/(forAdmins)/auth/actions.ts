"use server"

import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")
  const mode = String(formData.get("mode") ?? "signin")

  if (!email || !password) {
    redirect("/auth?error=missing")
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      redirect(`/auth?error=invalid&email=${encodeURIComponent(email)}`)
    }

    if (!user.passwordHash) {
      if (mode !== "setup") {
        redirect(`/auth?mode=setup&email=${encodeURIComponent(email)}`)
      }

      if (password.length < 8) {
        redirect(`/auth?mode=setup&error=short&email=${encodeURIComponent(email)}`)
      }

      if (password !== confirmPassword) {
        redirect(`/auth?mode=setup&error=mismatch&email=${encodeURIComponent(email)}`)
      }

      const passwordHash = await bcrypt.hash(password, 12)
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      })
    } else {
      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        redirect(`/auth?error=invalid&email=${encodeURIComponent(email)}`)
      }
    }

    const cookieStore = await cookies()
    cookieStore.set("admin_session", user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
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

import bcrypt from "bcryptjs"
import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"

type AuthPageProps = {
  searchParams?: Promise<{
    error?: string
    mode?: string
    email?: string
  }>
}

export default async function AdminSignInPage({ searchParams }: AuthPageProps) {
  const params = (await searchParams) ?? {}
  const error = params.error
  const mode = params.mode === "setup" ? "setup" : "signin"
  const prefilledEmail = params.email ?? ""

  async function signInAction(formData: FormData) {
    "use server"

    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase()
    const password = String(formData.get("password") ?? "")
    const confirmPassword = String(formData.get("confirmPassword") ?? "")

    if (!email || !password) {
      redirect("/auth?error=missing")
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      redirect(`/auth?error=invalid&email=${encodeURIComponent(email)}`)
    }

    if (!user.passwordHash) {
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

    redirect("/auth/dashboard")
  }

  return (
    <section className="mx-auto w-full max-w-md text-foreground">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-accent">
        Admin Access
      </p>
      <h1 className="font-[family-name:var(--font-display-family)] text-3xl font-semibold">
        {mode === "setup" ? "Create Password" : "Sign In"}
      </h1>
      <p className="mt-3 text-sm text-foreground/70">
        {mode === "setup"
          ? "First login detected. Set your admin password to continue."
          : "Use your admin credentials to continue to the dashboard."}
      </p>

      {error ? (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error === "missing" && "Please fill all required fields."}
          {error === "invalid" && "Invalid email or password."}
          {error === "short" && "Password must be at least 8 characters."}
          {error === "mismatch" && "Password confirmation does not match."}
        </p>
      ) : null}

      <form action={signInAction} className="mt-8 space-y-5 rounded-xl border border-foreground/10 bg-background p-6">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="admin@rootline.com"
            defaultValue={prefilledEmail}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-accent"
          />
        </div>

        {mode === "setup" ? (
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </div>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
        >
          {mode === "setup" ? "Create Password & Sign In" : "Sign In"}
        </button>
      </form>

      <p className="mt-4 text-sm text-foreground/65">
        Need website access?{" "}
        <Link href="/" className="font-medium text-accent hover:underline">
          Back to site
        </Link>
      </p>
    </section>
  )
}

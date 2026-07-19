"use server"

import { revalidatePath } from "next/cache"

import { requireAdminUser } from "@/lib/admin-session"
import { prisma } from "@/lib/prisma"
import { setTaxRatePercent } from "@/lib/app-settings"
import bcrypt from "bcryptjs"

function parseRate(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null
  const n = Number(v.trim())
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

export async function updateTaxRateAction(formData: FormData) {
  const user = await requireAdminUser()
  if (!user) return { error: "Sesión no válida." }

  const rate = parseRate(formData.get("taxRatePercent"))
  if (rate === null) return { error: "Tax rate inválido." }

  await setTaxRatePercent(rate)
  revalidatePath("/dashboard/configuracion")
  revalidatePath("/dashboard/estimados")
  return { ok: true }
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireAdminUser()
  if (!user) return { error: "Sesión no válida." }

  const firstName = typeof formData.get("firstName") === "string" ? (formData.get("firstName") as string).trim() : ""
  const lastName = typeof formData.get("lastName") === "string" ? (formData.get("lastName") as string).trim() : ""
  const email = typeof formData.get("email") === "string" ? (formData.get("email") as string).trim() : ""

  if (!firstName || !lastName || !email) {
    return { error: "Nombre, apellido y email son obligatorios." }
  }

  const emailTaken = await prisma.user.findFirst({
    where: { email, NOT: { id: user.id } },
  })
  if (emailTaken) {
    return { error: "Ese email ya está en uso." }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { firstName, lastName, email },
  })

  revalidatePath("/dashboard/configuracion")
  return { ok: true }
}

export async function updatePasswordAction(formData: FormData) {
  const user = await requireAdminUser()
  if (!user) return { error: "Sesión no válida." }

  const current = typeof formData.get("currentPassword") === "string" ? (formData.get("currentPassword") as string) : ""
  const next = typeof formData.get("newPassword") === "string" ? (formData.get("newPassword") as string) : ""

  if (!current || !next || next.length < 8) {
    return { error: "La contraseña actual es requerida y la nueva debe tener al menos 8 caracteres." }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  })
  if (!dbUser?.passwordHash || !(await bcrypt.compare(current, dbUser.passwordHash))) {
    return { error: "Contraseña actual incorrecta." }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 12) },
  })

  revalidatePath("/dashboard/configuracion")
  return { ok: true }
}

"use server"

import { revalidatePath } from "next/cache"

import { getAdminSessionUser, requireAdminUser } from "@/lib/admin-session"
import { type EmailTemplateLocale } from "@/lib/email-templates"
import { renderEmailSignatureHtml } from "@/lib/email-signature"
import { prisma } from "@/lib/prisma"

export type SignatureActionResult =
  | { ok: true; id?: string; previewHtml?: string }
  | { ok: false; error: string }

function parseStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : ""
}

function parseOptStr(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null
  const s = v.trim()
  return s || null
}

function parseLocale(v: FormDataEntryValue | null): EmailTemplateLocale {
  return parseStr(v) === "ES" ? "ES" : "EN"
}

function parseBool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1"
}

export async function saveEmailSignatureAction(formData: FormData): Promise<SignatureActionResult> {
  const sessionUser = await getAdminSessionUser()
  if (!sessionUser?.isActive) {
    return { ok: false, error: "Sesión no válida." }
  }

  const id = parseStr(formData.get("id"))
  const fullName = parseStr(formData.get("fullName"))
  const jobTitle = parseOptStr(formData.get("jobTitle"))
  const phone = parseOptStr(formData.get("phone"))
  const email = parseStr(formData.get("email")).toLowerCase()
  const locale = parseLocale(formData.get("locale"))
  const htmlBody = parseOptStr(formData.get("htmlBody"))
  const active = parseBool(formData.get("active"))
  const useCustomHtml = parseBool(formData.get("useCustomHtml"))

  if (!id) return { ok: false, error: "Firma no encontrada." }
  if (!fullName || !email) {
    return { ok: false, error: "Nombre y email son obligatorios." }
  }

  const signature = await prisma.emailSignature.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!signature) return { ok: false, error: "Firma no encontrada." }

  const updated = await prisma.emailSignature.update({
    where: { id },
    data: {
      fullName,
      jobTitle,
      phone,
      email,
      locale,
      active,
      htmlBody: useCustomHtml ? htmlBody : null,
    },
  })

  const previewHtml = renderEmailSignatureHtml({
    fullName: updated.fullName,
    jobTitle: updated.jobTitle,
    phone: updated.phone,
    email: updated.email,
    locale: updated.locale,
    htmlBody: updated.htmlBody,
  })

  revalidatePath("/dashboard/correos")
  return { ok: true, id: updated.id, previewHtml }
}

export async function previewEmailSignatureAction(formData: FormData): Promise<SignatureActionResult> {
  if (!(await requireAdminUser())) return { ok: false, error: "Sesión no válida." }

  const fullName = parseStr(formData.get("fullName"))
  const jobTitle = parseOptStr(formData.get("jobTitle"))
  const phone = parseOptStr(formData.get("phone"))
  const email = parseStr(formData.get("email"))
  const locale = parseLocale(formData.get("locale"))
  const htmlBody = parseOptStr(formData.get("htmlBody"))
  const useCustomHtml = parseBool(formData.get("useCustomHtml"))

  if (!fullName || !email) {
    return { ok: false, error: "Nombre y email son obligatorios." }
  }

  const previewHtml = renderEmailSignatureHtml({
    fullName,
    jobTitle,
    phone,
    email,
    locale,
    htmlBody: useCustomHtml ? htmlBody : null,
  })

  return { ok: true, previewHtml }
}

export async function resetEmailSignatureAction(formData: FormData): Promise<SignatureActionResult> {
  if (!(await requireAdminUser())) return { ok: false, error: "Sesión no válida." }

  const id = parseStr(formData.get("id"))
  if (!id) return { ok: false, error: "Firma no encontrada." }

  const updated = await prisma.emailSignature.update({
    where: { id },
    data: { htmlBody: null },
  })

  revalidatePath("/dashboard/correos")
  return {
    ok: true,
    id: updated.id,
    previewHtml: renderEmailSignatureHtml({
      fullName: updated.fullName,
      jobTitle: updated.jobTitle,
      phone: updated.phone,
      email: updated.email,
      locale: updated.locale,
      htmlBody: null,
    }),
  }
}

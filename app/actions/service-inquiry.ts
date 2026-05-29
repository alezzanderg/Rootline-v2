"use server"

import { revalidatePath } from "next/cache"

import { isCompleteNJAddress } from "@/lib/address-format"
import { parsePhoneRequired } from "@/lib/phone-format"
import { getInquirySubjectLabel, isValidInquirySubject } from "@/lib/service-inquiry-subjects"
import { prisma } from "@/lib/prisma"

function parseStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : ""
}

function parseEmail(v: FormDataEntryValue | null): string | null {
  const s = parseStr(v)
  if (!s || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null
  return s.toLowerCase()
}

export type SubmitInquiryResult =
  | { ok: true }
  | { ok: false; error: "missing" | "invalid_email" | "invalid_phone" | "invalid_address" }

export async function submitServiceInquiryAction(formData: FormData): Promise<SubmitInquiryResult> {
  const firstName = parseStr(formData.get("firstName"))
  const lastName = parseStr(formData.get("lastName"))
  const address = parseStr(formData.get("address"))
  const email = parseEmail(formData.get("email"))
  const phone = parsePhoneRequired(formData.get("phone"))
  const subjectValue = parseStr(formData.get("subject"))
  const message = parseStr(formData.get("message"))
  const localeRaw = parseStr(formData.get("locale"))
  const locale = localeRaw === "es" ? "es" : localeRaw === "en" ? "en" : "en"

  if (!firstName || !lastName || !address || !subjectValue || !message) {
    return { ok: false, error: "missing" }
  }
  if (!isValidInquirySubject(subjectValue)) {
    return { ok: false, error: "missing" }
  }
  const subject = getInquirySubjectLabel(subjectValue, locale)
  if (!subject) return { ok: false, error: "missing" }
  if (!isCompleteNJAddress(address)) return { ok: false, error: "invalid_address" }
  if (!email) return { ok: false, error: "invalid_email" }
  if (!phone) return { ok: false, error: "invalid_phone" }

  await prisma.serviceInquiry.create({
    data: {
      firstName,
      lastName,
      address,
      email,
      phone,
      subject,
      message,
      locale,
    },
  })

  revalidatePath("/dashboard/solicitudes")
  revalidatePath("/dashboard", "layout")
  return { ok: true }
}

export async function markServiceInquiryReadAction(formData: FormData) {
  const id = parseStr(formData.get("id"))
  if (!id) return
  await prisma.serviceInquiry.update({
    where: { id },
    data: { status: "READ", readAt: new Date() },
  })
  revalidatePath("/dashboard/solicitudes")
  revalidatePath("/dashboard", "layout")
}

export async function archiveServiceInquiryAction(formData: FormData) {
  const id = parseStr(formData.get("id"))
  if (!id) return
  await prisma.serviceInquiry.update({
    where: { id },
    data: { status: "ARCHIVED" },
  })
  revalidatePath("/dashboard/solicitudes")
  revalidatePath("/dashboard", "layout")
}

export async function deleteServiceInquiryAction(formData: FormData) {
  const id = parseStr(formData.get("id"))
  const confirm = formData.get("confirmDelete") === "on"
  if (!id || !confirm) return
  await prisma.serviceInquiry.delete({ where: { id } })
  revalidatePath("/dashboard/solicitudes")
  revalidatePath("/dashboard", "layout")
}

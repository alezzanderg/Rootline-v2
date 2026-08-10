"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdminUser } from "@/lib/admin-session"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isCompleteNJAddress, parseCompleteUSAddress } from "@/lib/address-format"
import { parsePhoneRequired } from "@/lib/phone-format"
import { sendNewInquiryNotification } from "@/lib/inquiry-notifications"
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
  | {
      ok: false
      error: "missing" | "invalid_email" | "invalid_phone" | "invalid_address" | "rate_limited"
    }

export async function submitServiceInquiryAction(formData: FormData): Promise<SubmitInquiryResult> {
  // Each submission stores a row and triggers notification emails — cap per IP.
  if (!checkRateLimit(`inquiry:${await getClientIp()}`, 5, 10 * 60_000)) {
    return { ok: false, error: "rate_limited" }
  }

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

  const inquiry = await prisma.serviceInquiry.create({
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

  void sendNewInquiryNotification({
    id: inquiry.id,
    firstName,
    lastName,
    address,
    email,
    phone,
    subject,
    message,
    locale,
  }).catch(() => {})

  revalidatePath("/dashboard/solicitudes")
  revalidatePath("/dashboard", "layout")
  return { ok: true }
}

export async function markServiceInquiryReadAction(formData: FormData) {
  if (!(await requireAdminUser())) return

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
  if (!(await requireAdminUser())) return

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
  if (!(await requireAdminUser())) return

  const id = parseStr(formData.get("id"))
  const confirm = formData.get("confirmDelete") === "on"
  if (!id || !confirm) return
  await prisma.serviceInquiry.delete({ where: { id } })
  revalidatePath("/dashboard/solicitudes")
  revalidatePath("/dashboard", "layout")
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function createCustomerFromInquiryAction(formData: FormData) {
  if (!(await requireAdminUser())) return

  const id = parseStr(formData.get("id"))
  if (!id) return

  const inquiry = await prisma.serviceInquiry.findUnique({ where: { id } })
  if (!inquiry) return

  const phone = parsePhoneRequired(inquiry.phone)
  if (!phone) return

  const firstName = titleCase(inquiry.firstName.trim())
  const lastName = titleCase(inquiry.lastName.trim())
  const email = inquiry.email.toLowerCase()
  const inquiryNotes = `Solicitud: ${inquiry.subject}\n\n${inquiry.message}`
  const parsedAddress = parseCompleteUSAddress(inquiry.address)

  // Dedupe against live customers only. Matching an archived record here would
  // silently resurrect it: the customer would reappear in every list without
  // anyone deciding to restore them.
  let customer = await prisma.customer.findFirst({
    where: { archivedAt: null, OR: [{ email }, { phone }] },
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        notes: inquiryNotes,
      },
    })
  } else if (!customer.notes) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { notes: inquiryNotes },
    })
  }

  if (parsedAddress) {
    const existingProperty = await prisma.property.findFirst({
      where: {
        customerId: customer.id,
        archivedAt: null,
        street: parsedAddress.street,
        city: parsedAddress.city,
        zipCode: parsedAddress.zipCode,
      },
    })

    if (!existingProperty) {
      await prisma.property.create({
        data: {
          customerId: customer.id,
          street: parsedAddress.street,
          city: parsedAddress.city,
          state: parsedAddress.state,
          zipCode: parsedAddress.zipCode,
        },
      })
    }
  }

  if (inquiry.status === "NEW") {
    await prisma.serviceInquiry.update({
      where: { id },
      data: { status: "READ", readAt: new Date() },
    })
  }

  revalidatePath("/dashboard/solicitudes")
  revalidatePath("/dashboard/clientes")
  revalidatePath(`/dashboard/clientes/${customer.id}`)
  revalidatePath("/dashboard", "layout")

  redirect(`/dashboard/clientes/${customer.id}`)
}

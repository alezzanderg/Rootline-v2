"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { normalizeOperatingType, OPERATING_TYPE_META } from "@/lib/operating-shared"

function parseStr(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : ""
}
function parseOptStr(v: FormDataEntryValue | null) {
  if (typeof v !== "string") return null
  const s = v.trim()
  return s || null
}
function parseOptDecimal(v: FormDataEntryValue | null) {
  const s = parseOptStr(v)
  if (!s) return null
  const n = Number(s.replace(/[^0-9.]/g, ""))
  return Number.isFinite(n) ? n : null
}
function parseOptDate(v: FormDataEntryValue | null) {
  const s = parseOptStr(v)
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}
/** Accept only inline image data URLs (base64). Receipts move to Cloudflare R2 later. */
function parseReceipt(v: FormDataEntryValue | null) {
  if (typeof v !== "string") return null
  const s = v.trim()
  if (!s) return null
  return s.startsWith("data:image/") ? s : null
}

/** Decode the project select value ("quote:<id>" | "job:<id>") into FK ids. */
function parseProjectRef(v: FormDataEntryValue | null): { quoteId: string | null; jobId: string | null } {
  const s = typeof v === "string" ? v.trim() : ""
  if (s.startsWith("quote:")) return { quoteId: s.slice(6) || null, jobId: null }
  if (s.startsWith("job:")) return { quoteId: null, jobId: s.slice(4) || null }
  return { quoteId: null, jobId: null }
}

export async function createPartnerAction(formData: FormData) {
  const name = parseStr(formData.get("name"))
  if (!name) return
  await prisma.partner.create({
    data: {
      name,
      email: parseOptStr(formData.get("email")),
      phone: parseOptStr(formData.get("phone")),
      ownershipPct: parseOptDecimal(formData.get("ownershipPct")),
      notes: parseOptStr(formData.get("notes")),
      active: formData.get("active") !== "off",
    },
  })
  revalidatePath("/dashboard/operating")
}

export async function updatePartnerAction(formData: FormData) {
  const id = parseStr(formData.get("id"))
  const name = parseStr(formData.get("name"))
  if (!id || !name) return
  await prisma.partner.update({
    where: { id },
    data: {
      name,
      email: parseOptStr(formData.get("email")),
      phone: parseOptStr(formData.get("phone")),
      ownershipPct: parseOptDecimal(formData.get("ownershipPct")),
      notes: parseOptStr(formData.get("notes")),
      active: formData.get("active") === "on",
    },
  })
  revalidatePath("/dashboard/operating")
}

export async function deletePartnerAction(formData: FormData) {
  const id = parseStr(formData.get("id"))
  const confirmDelete = parseStr(formData.get("confirmDelete")) === "on"
  if (!id || !confirmDelete) return
  await prisma.partner.delete({ where: { id } })
  revalidatePath("/dashboard/operating")
}

export async function createTransactionAction(formData: FormData) {
  const type = normalizeOperatingType(parseStr(formData.get("type")))
  if (!type) return
  const amount = parseOptDecimal(formData.get("amount"))
  if (amount == null || amount <= 0) return
  const meta = OPERATING_TYPE_META[type]

  const partnerId = meta.needsPartner ? parseOptStr(formData.get("partnerId")) : null
  if (meta.needsPartner && !partnerId) return
  const project = meta.needsJob ? parseProjectRef(formData.get("project")) : { quoteId: null, jobId: null }
  if (meta.needsJob && !project.quoteId && !project.jobId) return

  await prisma.operatingTransaction.create({
    data: {
      type,
      amount,
      occurredAt: parseOptDate(formData.get("occurredAt")) ?? new Date(),
      description: parseOptStr(formData.get("description")),
      category: meta.isExpense ? parseOptStr(formData.get("category")) : null,
      vendor: meta.isExpense ? parseOptStr(formData.get("vendor")) : null,
      invoiceNumber: meta.isExpense ? parseOptStr(formData.get("invoiceNumber")) : null,
      receiptUrl: parseReceipt(formData.get("receiptUrl")),
      partnerId,
      jobId: project.jobId,
      quoteId: project.quoteId,
    },
  })
  revalidatePath("/dashboard/operating")
  redirect("/dashboard/operating")
}

export async function updateTransactionAction(formData: FormData) {
  const id = parseStr(formData.get("id"))
  const type = normalizeOperatingType(parseStr(formData.get("type")))
  if (!id || !type) return
  const amount = parseOptDecimal(formData.get("amount"))
  if (amount == null || amount <= 0) return
  const meta = OPERATING_TYPE_META[type]

  const partnerId = meta.needsPartner ? parseOptStr(formData.get("partnerId")) : null
  if (meta.needsPartner && !partnerId) return
  const project = meta.needsJob ? parseProjectRef(formData.get("project")) : { quoteId: null, jobId: null }
  if (meta.needsJob && !project.quoteId && !project.jobId) return

  await prisma.operatingTransaction.update({
    where: { id },
    data: {
      type,
      amount,
      occurredAt: parseOptDate(formData.get("occurredAt")) ?? new Date(),
      description: parseOptStr(formData.get("description")),
      category: meta.isExpense ? parseOptStr(formData.get("category")) : null,
      vendor: meta.isExpense ? parseOptStr(formData.get("vendor")) : null,
      invoiceNumber: meta.isExpense ? parseOptStr(formData.get("invoiceNumber")) : null,
      receiptUrl: parseReceipt(formData.get("receiptUrl")),
      partnerId,
      jobId: project.jobId,
      quoteId: project.quoteId,
    },
  })
  revalidatePath("/dashboard/operating")
  redirect("/dashboard/operating")
}

export async function deleteTransactionAction(formData: FormData) {
  const id = parseStr(formData.get("id"))
  if (!id) return
  await prisma.operatingTransaction.delete({ where: { id } })
  revalidatePath("/dashboard/operating")
}

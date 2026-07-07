"use server"

import { randomUUID } from "crypto"

import { revalidatePath } from "next/cache"

import { requireAdminUser } from "@/lib/admin-session"
import { getPublicQuotePath } from "@/lib/quote-document"
import { prisma } from "@/lib/prisma"

function parseStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : ""
}

export async function generatePublicQuoteLinkAction(formData: FormData) {
  if (!(await requireAdminUser())) return

  const quoteId = parseStr(formData.get("quoteId"))
  if (!quoteId) return

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, publicToken: true },
  })
  if (!quote) return

  const publicToken = quote.publicToken ?? randomUUID()

  await prisma.quote.update({
    where: { id: quoteId },
    data: { publicToken },
  })

  revalidatePath(`/dashboard/estimados/${quoteId}`)
  revalidatePath(`/dashboard/estimados/${quoteId}/preview`)
  if (publicToken) revalidatePath(getPublicQuotePath(publicToken))
}

export async function revokePublicQuoteLinkAction(formData: FormData) {
  if (!(await requireAdminUser())) return

  const quoteId = parseStr(formData.get("quoteId"))
  if (!quoteId) return

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { publicToken: true },
  })
  if (!quote?.publicToken) return

  const oldPath = getPublicQuotePath(quote.publicToken)

  await prisma.quote.update({
    where: { id: quoteId },
    data: { publicToken: null },
  })

  revalidatePath(`/dashboard/estimados/${quoteId}`)
  revalidatePath(`/dashboard/estimados/${quoteId}/preview`)
  revalidatePath(oldPath)
}

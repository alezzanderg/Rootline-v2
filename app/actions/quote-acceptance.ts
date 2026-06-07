"use server"

import { revalidatePath } from "next/cache"

import { tryCreateMercuryInvoiceAfterAcceptance } from "@/app/actions/mercury-payment"
import { tryCreateStripeCheckoutAfterAcceptance } from "@/app/actions/stripe-payment"
import { getPublicQuotePath } from "@/lib/quote-document"
import { prisma } from "@/lib/prisma"

function parseStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : ""
}

function isValidSignatureData(value: string): boolean {
  if (!value.startsWith("data:image/png;base64,")) return false
  if (value.length < 120 || value.length > 600_000) return false
  return true
}

export type QuoteAcceptanceResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "not_found" | "not_available" | "terms" | "signature" }

export async function acceptPublicQuoteAction(formData: FormData): Promise<QuoteAcceptanceResult> {
  const token = parseStr(formData.get("token"))
  const signatureData = parseStr(formData.get("signatureData"))
  const termsAccepted = formData.get("termsAccepted") === "on"

  if (!token) return { ok: false, error: "invalid" }
  if (!termsAccepted) return { ok: false, error: "terms" }
  if (!isValidSignatureData(signatureData)) return { ok: false, error: "signature" }

  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    select: { id: true, status: true },
  })
  if (!quote) return { ok: false, error: "not_found" }
  if (quote.status !== "SENT") return { ok: false, error: "not_available" }

  const now = new Date()
  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: "APPROVED",
      approvedAt: now,
      signedAt: now,
      signatureData,
      rejectedAt: null,
    },
  })

  await tryCreateMercuryInvoiceAfterAcceptance(quote.id)
  await tryCreateStripeCheckoutAfterAcceptance(quote.id)

  revalidatePath(getPublicQuotePath(token))
  revalidatePath(`/dashboard/estimados/${quote.id}`)
  revalidatePath(`/dashboard/estimados/${quote.id}/preview`)
  revalidatePath("/dashboard/estimados")
  revalidatePath("/dashboard/scheduling")

  return { ok: true }
}

export async function declinePublicQuoteAction(formData: FormData): Promise<QuoteAcceptanceResult> {
  const token = parseStr(formData.get("token"))

  if (!token) return { ok: false, error: "invalid" }

  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    select: { id: true, status: true },
  })
  if (!quote) return { ok: false, error: "not_found" }
  if (quote.status !== "SENT") return { ok: false, error: "not_available" }

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: "REJECTED",
      rejectedAt: new Date(),
    },
  })

  revalidatePath(getPublicQuotePath(token))
  revalidatePath(`/dashboard/estimados/${quote.id}`)
  revalidatePath(`/dashboard/estimados/${quote.id}/preview`)
  revalidatePath("/dashboard/estimados")

  return { ok: true }
}

"use server"

import { revalidatePath } from "next/cache"

import {
  tryCreateMercuryInvoiceAfterAcceptance,
  tryCreateStripeCheckoutAfterAcceptance,
} from "@/lib/payments/post-acceptance"
import { getTaxRatePercent } from "@/lib/app-settings"
import { getPublicQuotePath } from "@/lib/quote-document"
import { assignMembershipFromQuoteIfNeeded } from "@/lib/quote-membership"
import { computeQuoteTotals, isLineActive, type PricingLine, type QuoteRecurringIntervalValue } from "@/lib/quote-pricing"
import { isQuoteExpired } from "@/lib/status-ui"
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
  | {
      ok: false
      error:
        | "invalid"
        | "not_found"
        | "not_available"
        | "expired"
        | "terms"
        | "signature"
        | "option_required"
    }

export async function acceptPublicQuoteAction(formData: FormData): Promise<QuoteAcceptanceResult> {
  const token = parseStr(formData.get("token"))
  const signatureData = parseStr(formData.get("signatureData"))
  const termsAccepted = formData.get("termsAccepted") === "on"

  if (!token) return { ok: false, error: "invalid" }
  if (!termsAccepted) return { ok: false, error: "terms" }
  if (!isValidSignatureData(signatureData)) return { ok: false, error: "signature" }

  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      status: true,
      validUntil: true,
      archivedAt: true,
      paymentsEnabled: true,
      collectFirstCycleNow: true,
      optionGroups: { select: { id: true, title: true, required: true } },
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          taxable: true,
          isRecurring: true,
          isSelected: true,
          lineType: true,
          optionGroupId: true,
          recurringInterval: true,
          service: { select: { name: true } },
          plan: { select: { name: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  })
  if (!quote) return { ok: false, error: "not_found" }
  if (quote.status !== "SENT") return { ok: false, error: "not_available" }

  // Every required option group must have a selection.
  const missingRequired = quote.optionGroups.some(
    (g) => g.required && !quote.items.some((i) => i.optionGroupId === g.id && i.isSelected)
  )
  if (missingRequired) return { ok: false, error: "option_required" }

  const taxRatePercent = await getTaxRatePercent()
  const itemName = (i: (typeof quote.items)[number]) => i.service?.name ?? i.plan?.name ?? i.name ?? "Service"
  const lines: PricingLine[] = quote.items.map((i) => ({
    lineType: i.lineType,
    isRecurring: i.isRecurring,
    isSelected: i.isSelected,
    taxable: i.taxable,
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice),
    lineTotal: Number(i.lineTotal),
    recurringInterval: (i.recurringInterval as QuoteRecurringIntervalValue | null) ?? null,
    name: itemName(i),
  }))
  const totals = computeQuoteTotals(lines, taxRatePercent, { collectFirstCycleNow: quote.collectFirstCycleNow })

  const now = new Date()
  const acceptanceSnapshot = {
    acceptedAt: now.toISOString(),
    taxRatePercent,
    collectFirstCycleNow: quote.collectFirstCycleNow,
    dueNow: { subtotal: totals.dueNowSubtotal, tax: totals.dueNowTax, total: totals.dueNowTotal },
    recurring: totals.recurring,
    items: quote.items
      .filter((i) => isLineActive({ lineType: i.lineType, isSelected: i.isSelected }))
      .map((i) => ({
        name: itemName(i),
        lineType: i.lineType,
        isRecurring: i.isRecurring,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
        taxable: i.taxable,
        recurringInterval: i.recurringInterval ?? null,
      })),
  }

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: "APPROVED",
      approvedAt: now,
      signedAt: now,
      signatureData,
      rejectedAt: null,
      acceptanceSnapshot,
    },
  })

  // Auto-assign the membership + schedule if this quote has a recurring plan line.
  await assignMembershipFromQuoteIfNeeded(prisma, quote.id)

  // Only create online checkout when payments are enabled for this quote.
  if (quote.paymentsEnabled) {
    await tryCreateMercuryInvoiceAfterAcceptance(quote.id)
    await tryCreateStripeCheckoutAfterAcceptance(quote.id)
  }

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
    select: { id: true, status: true, archivedAt: true },
  })
  if (!quote || quote.archivedAt) return { ok: false, error: "not_found" }
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

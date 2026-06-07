"use server"

import {
  clearManualQuotePayment,
  ManualPaymentError,
  markQuotePaidManually,
  type ManualPaymentMethod,
} from "@/lib/payments/manual"

function parseStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : ""
}

export type ManualPaymentActionResult = { ok: true } | { ok: false; error: string }

function mapError(error: unknown): string {
  if (error instanceof ManualPaymentError) return error.message
  if (error instanceof Error) return error.message
  return "Unexpected error"
}

function parseMethod(raw: string): ManualPaymentMethod | null {
  if (raw === "CASH" || raw === "CHECK") return raw
  return null
}

function parsePaidAt(raw: string): Date | undefined {
  if (!raw) return undefined
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export async function recordManualPaymentAction(formData: FormData): Promise<ManualPaymentActionResult> {
  const quoteId = parseStr(formData.get("quoteId"))
  const method = parseMethod(parseStr(formData.get("method")))
  const note = parseStr(formData.get("note"))
  const paidAt = parsePaidAt(parseStr(formData.get("paidAt")))

  if (!quoteId) return { ok: false, error: "Missing quote" }
  if (!method) return { ok: false, error: "Select cash or check" }

  try {
    await markQuotePaidManually(quoteId, method, { note: note || null, paidAt })
    return { ok: true }
  } catch (error) {
    return { ok: false, error: mapError(error) }
  }
}

export async function clearManualPaymentAction(formData: FormData): Promise<ManualPaymentActionResult> {
  const quoteId = parseStr(formData.get("quoteId"))
  if (!quoteId) return { ok: false, error: "Missing quote" }

  try {
    await clearManualQuotePayment(quoteId)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: mapError(error) }
  }
}

"use server"

import { revalidateQuotePaymentPaths } from "@/lib/payments/revalidate"
import {
  createMercuryInvoiceForQuote,
  isMercuryConfigured,
  MercuryApiError,
  syncMercuryInvoiceStatus,
} from "@/lib/mercury/invoices"

function parseStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : ""
}

export type MercuryPaymentActionResult =
  | { ok: true; payUrl?: string; status?: string }
  | { ok: false; error: string }

function mapMercuryError(error: unknown): string {
  if (error instanceof MercuryApiError) {
    if (error.status === 401) {
      return "Token de Mercury inválido o revocado. En .env usa el valor completo: MERCURY_API_TOKEN=secret-token:mercury_production_... (desde app.mercury.com/settings/tokens, incluyendo secret-token:)."
    }
    if (error.status === 403) {
      return "Mercury Accounts Receivable is not enabled on this account (subscription required)."
    }
    if (error.status === 400 && error.body?.includes("Stripe")) {
      return "Connect Stripe in Mercury to accept card payments on invoices."
    }
    return error.message
  }
  if (error instanceof Error) return error.message
  return "Unexpected Mercury error"
}

export async function createMercuryInvoiceAction(formData: FormData): Promise<MercuryPaymentActionResult> {
  const quoteId = parseStr(formData.get("quoteId"))
  const sendEmail = formData.get("sendEmail") === "on"
  if (!quoteId) return { ok: false, error: "Missing quote" }
  if (!isMercuryConfigured()) {
    return { ok: false, error: "Mercury is not configured (API token and destination account)." }
  }

  try {
    const result = await createMercuryInvoiceForQuote(quoteId, { sendEmail })
    await revalidateQuotePaymentPaths(quoteId)
    return { ok: true, payUrl: result.payUrl, status: result.status }
  } catch (error) {
    return { ok: false, error: mapMercuryError(error) }
  }
}

export async function syncMercuryInvoiceAction(formData: FormData): Promise<MercuryPaymentActionResult> {
  const quoteId = parseStr(formData.get("quoteId"))
  if (!quoteId) return { ok: false, error: "Missing quote" }
  if (!isMercuryConfigured()) {
    return { ok: false, error: "Mercury is not configured." }
  }

  try {
    const status = await syncMercuryInvoiceStatus(quoteId)
    await revalidateQuotePaymentPaths(quoteId)
    return { ok: true, status: status ?? undefined }
  } catch (error) {
    return { ok: false, error: mapMercuryError(error) }
  }
}

/** Called after quote acceptance — failures are logged but do not block signing. */
export async function tryCreateMercuryInvoiceAfterAcceptance(quoteId: string): Promise<void> {
  if (!isMercuryConfigured()) return

  try {
    await createMercuryInvoiceForQuote(quoteId, { sendEmail: false })
    await revalidateQuotePaymentPaths(quoteId)
  } catch (error) {
    console.error("[mercury] Failed to create invoice after quote acceptance:", mapMercuryError(error))
  }
}

"use server"

import { revalidateQuotePaymentPaths } from "@/lib/payments/revalidate"
import {
  createStripeCheckoutForQuote,
  isStripeConfigured,
  StripeConfigError,
  syncStripeCheckoutStatus,
} from "@/lib/stripe/checkout"

function parseStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : ""
}

export type StripePaymentActionResult =
  | { ok: true; checkoutUrl?: string; status?: string }
  | { ok: false; error: string }

function mapStripeError(error: unknown): string {
  if (error instanceof StripeConfigError) return error.message
  if (error instanceof Error) return error.message
  return "Unexpected Stripe error"
}

export async function createStripeCheckoutAction(formData: FormData): Promise<StripePaymentActionResult> {
  const quoteId = parseStr(formData.get("quoteId"))
  if (!quoteId) return { ok: false, error: "Missing quote" }
  if (!isStripeConfigured()) {
    return { ok: false, error: "Stripe is not configured (STRIPE_TEST_SECRET_KEY or STRIPE_LIVE_SECRET_KEY)." }
  }

  try {
    const result = await createStripeCheckoutForQuote(quoteId)
    await revalidateQuotePaymentPaths(quoteId)
    return { ok: true, checkoutUrl: result.checkoutUrl, status: result.status }
  } catch (error) {
    return { ok: false, error: mapStripeError(error) }
  }
}

export async function syncStripeCheckoutAction(formData: FormData): Promise<StripePaymentActionResult> {
  const quoteId = parseStr(formData.get("quoteId"))
  if (!quoteId) return { ok: false, error: "Missing quote" }
  if (!isStripeConfigured()) {
    return { ok: false, error: "Stripe is not configured." }
  }

  try {
    const status = await syncStripeCheckoutStatus(quoteId)
    await revalidateQuotePaymentPaths(quoteId)
    return { ok: true, status: status ?? undefined }
  } catch (error) {
    return { ok: false, error: mapStripeError(error) }
  }
}

/** Fallback when Mercury AR is unavailable — failures are logged but do not block signing. */
export async function tryCreateStripeCheckoutAfterAcceptance(quoteId: string): Promise<void> {
  if (!isStripeConfigured()) return

  try {
    await createStripeCheckoutForQuote(quoteId)
    await revalidateQuotePaymentPaths(quoteId)
  } catch (error) {
    console.error("[stripe] Failed to create checkout after quote acceptance:", mapStripeError(error))
  }
}

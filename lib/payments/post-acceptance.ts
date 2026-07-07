import { createMercuryInvoiceForQuote, isMercuryConfigured } from "@/lib/mercury/invoices"
import { revalidateQuotePaymentPaths } from "@/lib/payments/revalidate"
import { createStripeCheckoutForQuote, isStripeConfigured } from "@/lib/stripe/checkout"

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Called after quote acceptance — failures are logged but do not block signing. */
export async function tryCreateMercuryInvoiceAfterAcceptance(quoteId: string): Promise<void> {
  if (!isMercuryConfigured()) return

  try {
    await createMercuryInvoiceForQuote(quoteId, { sendEmail: false })
    await revalidateQuotePaymentPaths(quoteId)
  } catch (error) {
    console.error("[mercury] Failed to create invoice after quote acceptance:", errorMessage(error))
  }
}

/** Fallback when Mercury AR is unavailable — failures are logged but do not block signing. */
export async function tryCreateStripeCheckoutAfterAcceptance(quoteId: string): Promise<void> {
  if (!isStripeConfigured()) return

  try {
    await createStripeCheckoutForQuote(quoteId)
    await revalidateQuotePaymentPaths(quoteId)
  } catch (error) {
    console.error("[stripe] Failed to create checkout after quote acceptance:", errorMessage(error))
  }
}

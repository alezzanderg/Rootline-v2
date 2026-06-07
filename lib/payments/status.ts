export function isQuotePaymentComplete(quote: {
  paidAt: Date | string | null
  mercuryInvoiceStatus: string | null
  stripePaymentStatus?: string | null
}): boolean {
  if (quote.mercuryInvoiceStatus === "Paid") return true
  // paidAt is only set after Stripe/Mercury confirms payment — never from URL params
  if (quote.paidAt) return true
  return false
}

export type QuotePaymentReturnStatus = "success" | "cancelled"

export type StripePaymentVerifyResult =
  | { verified: true; status: "paid" | "pending" }
  | { verified: false; reason: "no_session" | "session_mismatch" | "not_paid" }

export type QuotePaymentMethodValue = "STRIPE" | "MERCURY" | "CASH" | "CHECK"

const PUBLIC_LABELS: Record<QuotePaymentMethodValue, string> = {
  STRIPE: "Credit/debit card (Stripe)",
  MERCURY: "Online payment (Mercury)",
  CASH: "Cash",
  CHECK: "Check",
}

const ADMIN_LABELS: Record<QuotePaymentMethodValue, string> = {
  STRIPE: "Tarjeta (Stripe)",
  MERCURY: "Mercury",
  CASH: "Efectivo",
  CHECK: "Cheque",
}

export function getQuotePaymentMethodPublicLabel(method: string | null | undefined): string | null {
  if (!method) return null
  return PUBLIC_LABELS[method as QuotePaymentMethodValue] ?? method
}

export function getQuotePaymentMethodAdminLabel(method: string | null | undefined): string | null {
  if (!method) return null
  return ADMIN_LABELS[method as QuotePaymentMethodValue] ?? method
}

export function isManualQuotePaymentMethod(method: string | null | undefined): boolean {
  return method === "CASH" || method === "CHECK"
}

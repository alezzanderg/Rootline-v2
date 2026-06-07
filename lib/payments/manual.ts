import { revalidateQuotePaymentPaths } from "@/lib/payments/revalidate"
import { isQuotePaymentComplete } from "@/lib/payments/status"
import { prisma } from "@/lib/prisma"

export class ManualPaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ManualPaymentError"
  }
}

export type ManualPaymentMethod = "CASH" | "CHECK"

export async function markQuotePaidManually(
  quoteId: string,
  method: ManualPaymentMethod,
  options: { note?: string | null; paidAt?: Date } = {}
): Promise<void> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      status: true,
      paidAt: true,
      mercuryInvoiceStatus: true,
      stripePaymentStatus: true,
    },
  })

  if (!quote) throw new ManualPaymentError("Quote not found")
  if (quote.status !== "APPROVED") {
    throw new ManualPaymentError("Quote must be approved before recording payment")
  }
  if (isQuotePaymentComplete(quote)) {
    throw new ManualPaymentError("This quote is already marked as paid")
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      paidAt: options.paidAt ?? new Date(),
      paymentMethod: method,
      paymentNote: options.note?.trim() || null,
    },
  })

  await revalidateQuotePaymentPaths(quoteId)
}

export async function clearManualQuotePayment(quoteId: string): Promise<void> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, paymentMethod: true, paidAt: true },
  })

  if (!quote) throw new ManualPaymentError("Quote not found")
  if (quote.paymentMethod !== "CASH" && quote.paymentMethod !== "CHECK") {
    throw new ManualPaymentError("Only cash or check payments can be cleared here")
  }
  if (!quote.paidAt) {
    throw new ManualPaymentError("This quote is not marked as paid")
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      paidAt: null,
      paymentMethod: null,
      paymentNote: null,
    },
  })

  await revalidateQuotePaymentPaths(quoteId)
}

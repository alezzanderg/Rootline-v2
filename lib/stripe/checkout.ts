import type Stripe from "stripe"

import { revalidateQuotePaymentPaths } from "@/lib/payments/revalidate"
import { getPublicQuotePath, getPublicQuoteUrl } from "@/lib/quote-document"
import { prisma } from "@/lib/prisma"
import { getCheckoutBrandingSettings } from "@/lib/stripe/branding"
import type { StripePaymentVerifyResult } from "@/lib/payments/status"
import {
  getStripeClient,
  getStripeClientForMode,
  getStripeMode,
  isStripeConfigured,
  stripeModeFromId,
  StripeConfigError,
} from "@/lib/stripe/config"

export { isStripeConfigured, StripeConfigError }

function isStripeCheckoutSessionPaid(session: Stripe.Checkout.Session): boolean {
  return session.status === "complete" && session.payment_status === "paid"
}

function quoteInvoiceNumber(quoteId: string): string {
  return `EST-${quoteId.slice(0, 8).toUpperCase()}`
}

function toCents(amount: number): number {
  return Math.round(amount * 100)
}

function buildLineItems(
  quote: {
    items: Array<{
      quantity: { toString(): string }
      unitPrice: { toString(): string }
      isRecurring: boolean
      isSelected: boolean
      lineType: "REQUIRED" | "OPTION" | "ADDON"
      name: string | null
      service: { name: string } | null
    }>
    tax: { toString(): string }
    taxRatePercent: number
    collectFirstCycleNow: boolean
  }
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = quote.items
    .filter((item) => {
      const active = item.lineType === "REQUIRED" || item.isSelected
      return active && (!item.isRecurring || quote.collectFirstCycleNow)
    })
    .map((item) => ({
      quantity: Math.max(1, Math.round(Number(item.quantity))),
      price_data: {
        currency: "usd",
        unit_amount: toCents(Number(item.unitPrice)),
        product_data: {
          name: item.service?.name ?? item.name ?? "Service",
        },
      },
    }))

  const tax = Number(quote.tax)
  if (tax > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: toCents(tax),
        product_data: {
          name: `Sales tax (${quote.taxRatePercent.toFixed(3)}%)`,
        },
      },
    })
  }

  return lineItems
}

async function loadQuoteForCheckout(quoteId: string) {
  const { getTaxRatePercent } = await import("@/lib/app-settings")
  const [quote, taxRatePercent] = await Promise.all([
    prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        customer: { select: { email: true, firstName: true, lastName: true } },
        items: {
          include: { service: { select: { name: true } } },
          orderBy: { id: "asc" },
        },
      },
    }),
    getTaxRatePercent(),
  ])

  return quote ? { ...quote, taxRatePercent } : null
}

export async function createStripeCheckoutForQuote(
  quoteId: string
): Promise<{ checkoutUrl: string; status: string }> {
  if (!isStripeConfigured()) {
    throw new StripeConfigError("Stripe is not configured")
  }

  const quote = await loadQuoteForCheckout(quoteId)

  if (!quote) throw new StripeConfigError("Quote not found")
  if (quote.status !== "APPROVED") {
    throw new StripeConfigError("Quote must be approved before creating a payment link")
  }
  if (!quote.publicToken) {
    throw new StripeConfigError("Generate a public quote link before accepting Stripe payments")
  }
  if (quote.items.length === 0) {
    throw new StripeConfigError("Quote has no line items")
  }

  const stripe = getStripeClient()

  if (quote.stripeCheckoutSessionId) {
    const existing = await stripe.checkout.sessions.retrieve(quote.stripeCheckoutSessionId)
    if (existing.status === "complete") {
      await prisma.quote.update({
        where: { id: quoteId },
        data: {
          stripePaymentStatus: "complete",
          paidAt: quote.paidAt ?? new Date(),
          paymentMethod: "STRIPE",
        },
      })
      throw new StripeConfigError("This estimate has already been paid via Stripe")
    }
    if (existing.status === "open" && existing.url) {
      return { checkoutUrl: existing.url, status: "open" }
    }
  }

  const publicUrl = getPublicQuoteUrl(quote.publicToken)
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: quote.customer.email ?? undefined,
    line_items: buildLineItems(quote),
    success_url: `${publicUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}#quote-payment`,
    cancel_url: `${publicUrl}?payment=cancelled`,
    branding_settings: getCheckoutBrandingSettings(),
    metadata: {
      quoteId: quote.id,
      publicToken: quote.publicToken,
      invoiceNumber: quoteInvoiceNumber(quote.id),
    },
    payment_intent_data: {
      metadata: {
        quoteId: quote.id,
        invoiceNumber: quoteInvoiceNumber(quote.id),
      },
    },
  })

  if (!session.url) {
    throw new StripeConfigError("Stripe did not return a checkout URL")
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      stripeCheckoutSessionId: session.id,
      stripeCheckoutUrl: session.url,
      stripePaymentStatus: session.status ?? "open",
    },
  })

  return { checkoutUrl: session.url, status: session.status ?? "open" }
}

export async function syncStripeCheckoutStatus(quoteId: string): Promise<string | null> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { stripeCheckoutSessionId: true, paidAt: true, publicToken: true },
  })
  if (!quote?.stripeCheckoutSessionId) return null

  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.retrieve(quote.stripeCheckoutSessionId)

  if (quote.publicToken && session.metadata?.publicToken !== quote.publicToken) {
    return session.status ?? null
  }

  const verifiedPaid = isStripeCheckoutSessionPaid(session)

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      stripePaymentStatus: session.status ?? null,
      stripeCheckoutUrl: session.url ?? undefined,
      ...(verifiedPaid
        ? { paidAt: quote.paidAt ?? new Date(), paymentMethod: "STRIPE" as const }
        : {}),
    },
  })

  return session.status ?? null
}

/** Verify return from Stripe Checkout — never trust ?payment=success alone. */
export async function verifyStripePaymentReturn(
  publicToken: string,
  sessionIdFromUrl?: string | null
): Promise<StripePaymentVerifyResult> {
  if (!isStripeConfigured()) {
    return { verified: false, reason: "no_session" }
  }

  const quote = await prisma.quote.findUnique({
    where: { publicToken },
    select: { id: true, stripeCheckoutSessionId: true, publicToken: true },
  })

  // Only trust the checkout session currently stored on the quote. A success URL
  // by itself must never re-mark payment — e.g. revisiting an old payment link
  // after the quote was reset (its stored session is cleared).
  const storedSession = quote?.stripeCheckoutSessionId?.trim() || null
  if (!quote || !storedSession) {
    return { verified: false, reason: "no_session" }
  }

  const urlSession = sessionIdFromUrl?.trim()
  if (urlSession && urlSession !== storedSession) {
    return { verified: false, reason: "session_mismatch" }
  }

  const sessionId = storedSession

  // Use the client matching the session's own mode (cs_test_… vs cs_live_…) so a
  // test session is never verified with a live key (and vice versa).
  const mode = stripeModeFromId(sessionId) ?? getStripeMode()

  try {
    const stripe = getStripeClientForMode(mode)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.metadata?.publicToken !== publicToken) {
      return { verified: false, reason: "session_mismatch" }
    }

    if (isStripeCheckoutSessionPaid(session)) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          stripeCheckoutSessionId: session.id,
          stripeCheckoutUrl: session.url ?? undefined,
          stripePaymentStatus: session.status ?? "complete",
          paidAt: new Date(),
          paymentMethod: "STRIPE",
        },
      })
      // Revalidation runs in the Stripe webhook / admin actions — not here (page render).
      return { verified: true, status: "paid" }
    }

    return { verified: true, status: "pending" }
  } catch (error) {
    // Never crash the customer-facing page on a verification error (bad key, mode
    // mismatch, network). The Stripe webhook remains the source of truth for payment.
    console.error("verifyStripePaymentReturn failed", error)
    return { verified: false, reason: "error" }
  }
}

/** @deprecated Use verifyStripePaymentReturn — kept for webhook/admin sync paths */
export async function syncStripePaymentForPublicQuote(publicToken: string): Promise<void> {
  await verifyStripePaymentReturn(publicToken, null)
}

export async function markQuotePaidFromStripeSession(
  session: Stripe.Checkout.Session
): Promise<void> {
  const quoteId = session.metadata?.quoteId
  if (!quoteId || !isStripeCheckoutSessionPaid(session)) return

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      stripeCheckoutSessionId: session.id,
      stripeCheckoutUrl: session.url ?? undefined,
      stripePaymentStatus: session.status ?? "complete",
      paidAt: new Date(),
      paymentMethod: "STRIPE",
    },
  })

  await revalidateQuotePaymentPaths(quoteId)

  const publicToken = session.metadata?.publicToken
  if (publicToken) {
    const { revalidatePath } = await import("next/cache")
    revalidatePath(getPublicQuotePath(publicToken))
  }
}

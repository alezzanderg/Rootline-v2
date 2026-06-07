import { Check, CreditCard, ExternalLink } from "lucide-react"

import { getMercuryPayUrl } from "@/lib/mercury/config"
import {
  isQuotePaymentComplete,
  type QuotePaymentReturnStatus,
  type StripePaymentVerifyResult,
} from "@/lib/payments/status"
import { fmtMoney, fmtQuoteDate } from "@/lib/quote-document-format"

type QuotePaymentPanelProps = {
  total: number
  mercuryPaySlug: string | null
  mercuryInvoiceStatus: string | null
  stripeCheckoutUrl: string | null
  stripePaymentStatus: string | null
  paidAt: string | null
  paymentReturnStatus?: QuotePaymentReturnStatus | null
  stripeVerify?: StripePaymentVerifyResult | null
}

export function QuotePaymentPanel(props: QuotePaymentPanelProps) {
  const {
    total,
    mercuryPaySlug,
    mercuryInvoiceStatus,
    stripeCheckoutUrl,
    paymentReturnStatus,
    stripeVerify,
    paidAt,
  } = props

  const hasMercury = Boolean(mercuryPaySlug)
  const hasStripe = Boolean(stripeCheckoutUrl)
  const isPaid = isQuotePaymentComplete({
    paidAt: props.paidAt,
    mercuryInvoiceStatus: props.mercuryInvoiceStatus,
    stripePaymentStatus: props.stripePaymentStatus,
  })

  if (!hasMercury && !hasStripe && !isPaid && paymentReturnStatus !== "cancelled" && !stripeVerify) {
    return null
  }

  if (isPaid) {
    return (
      <section id="quote-payment" className="mt-8 scroll-mt-24 print:hidden">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/80 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-emerald-900">Payment received</h2>
              <p className="mt-1 text-sm text-emerald-800/80">
                {paidAt
                  ? `Thank you — ${fmtMoney(total)} was paid on ${fmtQuoteDate(new Date(paidAt))}.`
                  : `Thank you — your payment of ${fmtMoney(total)} has been received.`}
              </p>
              <p className="mt-2 text-sm text-emerald-800/70">
                A confirmation will be sent by email if you provided one at checkout.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const mercuryUrl = mercuryPaySlug ? getMercuryPayUrl(mercuryPaySlug) : null
  const mercuryProcessing = mercuryInvoiceStatus === "Processing"

  const stripePending =
    paymentReturnStatus === "success" &&
    stripeVerify?.verified === true &&
    stripeVerify.status === "pending"

  const stripeUnverified =
    paymentReturnStatus === "success" &&
    stripeVerify !== null &&
    stripeVerify !== undefined &&
    stripeVerify.verified === false

  return (
    <section id="quote-payment" className="mt-8 scroll-mt-24 print:hidden">
      {paymentReturnStatus === "cancelled" ? (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-50/90 px-4 py-3 text-sm text-amber-900/85">
          Payment was cancelled. You can try again below when you&apos;re ready.
        </div>
      ) : null}

      {stripePending ? (
        <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-50/90 px-4 py-3 text-sm text-blue-900/85">
          Confirming your payment with Stripe. This page will update once verification completes.
        </div>
      ) : null}

      {stripeUnverified ? (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-50/90 px-4 py-3 text-sm text-rose-900/85">
          We couldn&apos;t verify a completed payment. Please use the Pay with card button below if you
          still need to pay.
        </div>
      ) : null}

      <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-foreground">Pay online</h2>
            <p className="mt-1 text-sm text-foreground/65">
              Pay {fmtMoney(total)} securely online. Choose the option that works best for you.
            </p>

            {mercuryProcessing ? (
              <p className="mt-2 text-sm text-amber-800/85">Your Mercury payment is processing.</p>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {mercuryUrl ? (
                <a
                  href={mercuryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/15 bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-foreground/5"
                >
                  <ExternalLink className="h-4 w-4" />
                  Pay with Mercury
                </a>
              ) : null}
              {stripeCheckoutUrl ? (
                <a
                  href={stripeCheckoutUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-terra px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-terra/90"
                >
                  <ExternalLink className="h-4 w-4" />
                  Pay with card (Stripe)
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

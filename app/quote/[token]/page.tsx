import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { QuoteAcceptancePanel } from "@/components/quotes/QuoteAcceptancePanel"
import { QuoteDocumentShell } from "@/components/quotes/QuoteDocumentShell"
import { QuoteDocumentView } from "@/components/quotes/QuoteDocumentView"
import { QuotePaymentPanel } from "@/components/quotes/QuotePaymentPanel"
import { getQuoteDocumentByPublicToken } from "@/lib/quote-document"
import {
  isQuotePaymentComplete,
  type QuotePaymentReturnStatus,
  type StripePaymentVerifyResult,
} from "@/lib/payments/status"
import { getQuoteTermsAndConditions } from "@/lib/quote-terms"
import { businessInfo } from "@/lib/services-data"
import { verifyStripePaymentReturn } from "@/lib/stripe/checkout"

type Props = {
  params: Promise<{ token: string }>
  searchParams: Promise<{ payment?: string; session_id?: string }>
}

function parsePaymentReturn(raw: string | undefined): QuotePaymentReturnStatus | null {
  if (raw === "success") return "success"
  if (raw === "cancelled") return "cancelled"
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const quote = await getQuoteDocumentByPublicToken(token)
  if (!quote) {
    return {
      title: "Estimate not found",
      robots: { index: false, follow: false },
    }
  }

  return {
    title: isQuotePaymentComplete(quote)
      ? `Invoice for ${quote.customerName}`
      : `Estimate for ${quote.customerName}`,
    description: isQuotePaymentComplete(quote)
      ? `Paid invoice from ${businessInfo.name}. Total ${quote.total.toFixed(2)}.`
      : `Service estimate from ${businessInfo.name}. Total ${quote.total.toFixed(2)}.`,
    robots: { index: false, follow: false },
  }
}

export default async function PublicQuotePage({ params, searchParams }: Props) {
  const { token } = await params
  const { payment: paymentRaw, session_id: sessionId } = await searchParams
  const paymentReturnStatus = parsePaymentReturn(paymentRaw)

  let stripeVerify: StripePaymentVerifyResult | null = null
  if (paymentReturnStatus === "success") {
    stripeVerify = await verifyStripePaymentReturn(token, sessionId)
  }

  const [quote, termsAndConditions] = await Promise.all([
    getQuoteDocumentByPublicToken(token),
    getQuoteTermsAndConditions(),
  ])
  if (!quote) notFound()

  const isPaid = isQuotePaymentComplete(quote)

  return (
    <main className="quote-document-page mx-auto min-h-screen max-w-3xl bg-background px-4 py-8 sm:px-6 sm:py-12 print:bg-[#fdfcf8] print:p-0">
      <QuoteDocumentShell
        quoteNumber={quote.quoteNumber}
        customerName={quote.customerName}
        mode="public"
        isAccepted={quote.status === "APPROVED"}
        isPaid={isPaid}
      >
        <QuoteDocumentView quote={quote} mode="public" isPaid={isPaid} />
      </QuoteDocumentShell>

      <QuoteAcceptancePanel
        token={token}
        status={quote.status}
        approvedAt={quote.approvedAt?.toISOString() ?? null}
        rejectedAt={quote.rejectedAt?.toISOString() ?? null}
        signedAt={quote.signedAt?.toISOString() ?? null}
        signatureData={quote.signatureData}
        termsAndConditions={termsAndConditions}
      />

      {quote.paymentsEnabled || isPaid ? (
        <QuotePaymentPanel
          total={quote.total}
          isAccepted={quote.status === "APPROVED"}
          mercuryPaySlug={quote.mercuryInvoiceSlug}
          mercuryInvoiceStatus={quote.mercuryInvoiceStatus}
          stripeCheckoutUrl={quote.stripeCheckoutUrl}
          stripePaymentStatus={quote.stripePaymentStatus}
          paidAt={quote.paidAt?.toISOString() ?? null}
          paymentMethod={quote.paymentMethod}
          paymentReturnStatus={paymentReturnStatus}
          stripeVerify={stripeVerify}
        />
      ) : null}
    </main>
  )
}

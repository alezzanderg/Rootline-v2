"use client"

import { useState, useTransition } from "react"
import { Check, ChevronDown, X } from "lucide-react"

import {
  acceptPublicQuoteAction,
  declinePublicQuoteAction,
} from "@/app/actions/quote-acceptance"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { SignaturePad } from "@/components/quotes/SignaturePad"
import { fmtQuoteDate } from "@/lib/quote-document-format"

type QuoteAcceptancePanelProps = {
  token: string
  status: string
  approvedAt: string | null
  rejectedAt: string | null
  signedAt: string | null
  signatureData: string | null
  termsAndConditions: string
}

const ERROR_MESSAGE: Record<string, string> = {
  terms: "Please confirm that you have read and agree to the Terms & Conditions.",
  signature: "Please draw your signature before accepting.",
  not_available: "This estimate is no longer available for signing.",
  not_found: "Estimate not found.",
  invalid: "Unable to process your request. Please try again.",
}

export function QuoteAcceptancePanel({
  token,
  status,
  approvedAt,
  rejectedAt,
  signedAt,
  signatureData,
  termsAndConditions,
}: QuoteAcceptancePanelProps) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (status === "APPROVED") {
    const when = signedAt ?? approvedAt
    return (
      <section className="mt-8 print:hidden">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/80 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold text-emerald-900">Estimate accepted</h2>
              <p className="mt-1 text-sm text-emerald-800/80">
                {when ? `Signed on ${fmtQuoteDate(new Date(when))}.` : "Thank you for your approval."}
              </p>
              <p className="mt-2 text-sm text-emerald-800/70">
                Use <strong className="font-semibold">Download accepted PDF</strong> above to save a copy with your
                signature.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (status === "REJECTED") {
    return (
      <section className="mt-8 print:hidden">
        <div className="rounded-2xl border border-rose-400/30 bg-rose-50/80 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
              <X className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-rose-900">Estimate declined</h2>
              <p className="mt-1 text-sm text-rose-800/80">
                {rejectedAt
                  ? `Declined on ${fmtQuoteDate(new Date(rejectedAt))}.`
                  : "This estimate was declined."}
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (status !== "SENT") {
    return (
      <section className="mt-8 print:hidden">
        <div className="rounded-2xl border border-foreground/12 bg-foreground/3 px-5 py-4 text-sm text-foreground/55">
          This estimate is not open for acceptance yet. Contact us if you have questions.
        </div>
      </section>
    )
  }

  function handleAccept() {
    setError(null)
    const formData = new FormData()
    formData.set("token", token)
    formData.set("termsAccepted", termsAccepted ? "on" : "off")
    if (signatureDataUrl) formData.set("signatureData", signatureDataUrl)

    startTransition(async () => {
      const result = await acceptPublicQuoteAction(formData)
      if (!result.ok) {
        setError(ERROR_MESSAGE[result.error] ?? ERROR_MESSAGE.invalid)
      }
    })
  }

  function handleDecline() {
    if (!window.confirm("Are you sure you want to decline this estimate?")) return
    setError(null)
    const formData = new FormData()
    formData.set("token", token)

    startTransition(async () => {
      const result = await declinePublicQuoteAction(formData)
      if (!result.ok) {
        setError(ERROR_MESSAGE[result.error] ?? ERROR_MESSAGE.invalid)
      }
    })
  }

  return (
    <section className="mt-8 space-y-6 print:hidden">
      <div className="overflow-hidden rounded-2xl border border-foreground/12 bg-[#fdfcf8] shadow-sm">
        <details className="group" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-foreground/10 px-4 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Attached Documents</h2>
              <p className="mt-1 text-sm text-foreground/55">
                Please read all documents below before signing.
              </p>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 text-foreground/45 transition group-open:rotate-180" />
          </summary>

          <div className="px-4 py-2 sm:px-6">
            <Accordion type="single" collapsible defaultValue="terms">
              <AccordionItem value="terms" className="border-foreground/10">
                <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline">
                  Terms &amp; Conditions
                </AccordionTrigger>
                <AccordionContent className="max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground/70 sm:max-h-96">
                  {termsAndConditions}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </details>
      </div>

      <div className="rounded-2xl border border-foreground/12 bg-[#fdfcf8] p-4 shadow-sm sm:p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Authorization</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/65">
          By signing below, you agree to the scope and pricing outlined in this estimate.
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-foreground/10 bg-white px-3 py-3">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            disabled={isPending}
            className="mt-0.5"
          />
          <span className="text-sm leading-relaxed text-foreground/75">
            I have read and agree to the Terms &amp; Conditions included with this estimate.
          </span>
        </label>

        <div className="mt-5">
          <SignaturePad onChange={setSignatureDataUrl} disabled={isPending} />
        </div>

        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-cream transition hover:bg-forest/90 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {isPending ? "Submitting…" : "Sign & Accept"}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-300/50 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Decline
          </button>
        </div>
      </div>
    </section>
  )
}

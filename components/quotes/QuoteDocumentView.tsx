import Image from "next/image"
import Link from "next/link"

import {
  fmtMoney,
  fmtQuoteDate,
  type QuoteDocumentData,
} from "@/lib/quote-document"
import { isQuotePaymentComplete } from "@/lib/payments/status"
import { getQuotePaymentMethodPublicLabel } from "@/lib/payments/methods"
import { getQuoteDocumentTitle } from "@/lib/quote-document-format"
import { QuoteOptionsSelector } from "@/components/quotes/QuoteOptionsSelector"
import { businessInfo } from "@/lib/services-data"

type QuoteDocumentViewProps = {
  quote: QuoteDocumentData
  mode: "preview" | "public"
  isPaid?: boolean
}

export function QuoteDocumentView({ quote, mode, isPaid: isPaidProp }: QuoteDocumentViewProps) {
  const showSentBadge = mode === "preview" && quote.status === "SENT"
  const isAccepted = quote.status === "APPROVED"
  const isPaid = isPaidProp ?? isQuotePaymentComplete(quote)
  const acceptedAt = quote.signedAt ?? quote.approvedAt
  const documentTitle = getQuoteDocumentTitle(isPaid)
  const documentDate = isPaid && quote.paidAt ? quote.paidAt : quote.createdAt
  const documentDateLabel = isPaid ? "Invoice date" : "Date"

  // Estimate Options: required (due-today) lines go in the table; options/add-ons
  // are presented in a selector; recurring shows separately as ongoing billing.
  const tableItems = quote.items.filter((i) => i.lineType === "REQUIRED" && !i.isRecurring)
  const hasOptions = quote.items.some((i) => i.lineType !== "REQUIRED") || quote.optionGroups.length > 0
  const recurring = quote.recurring
  const interactive = mode === "public" && quote.status === "SENT" && !isPaid
  // Once accepted/paid the selection is locked; the document shows only chosen options.
  const lockedSelection = isAccepted || isPaid

  return (
    <div className="quote-document-view-root mx-auto w-full max-w-3xl">
      <article
        id="quote-document"
        className="overflow-hidden rounded-2xl border border-forest/15 bg-[#fdfcf8] shadow-xl shadow-forest/8 print:overflow-visible print:rounded-none print:border-0 print:shadow-none"
      >
        <header className="border-b border-forest/10 bg-forest px-4 py-5 text-cream sm:px-8 sm:py-8">
          <div className="flex items-center justify-between gap-4 sm:gap-6">
            <Image
              src="/images/logo-navbar.png"
              alt={businessInfo.name}
              width={280}
              height={70}
              className="h-12 w-auto max-w-[12rem] shrink-0 sm:h-14 sm:max-w-56"
              priority
            />

            <div className="min-w-0 space-y-1 text-right text-sm">
              <p className="font-display text-lg font-semibold leading-tight text-cream sm:text-2xl">
                {documentTitle}
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-cream/70">#{quote.quoteNumber}</p>
              <p className="text-cream/90">
                {documentDateLabel}: {fmtQuoteDate(documentDate)}
              </p>
              {!isPaid && quote.validUntil ? (
                <p className="text-cream/75">Valid until: {fmtQuoteDate(quote.validUntil)}</p>
              ) : null}
              {isPaid ? (
                <span className="mt-1 inline-flex rounded-full border border-cream/30 bg-cream/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cream">
                  Paid
                </span>
              ) : null}
              {isAccepted ? (
                <span className="mt-1 inline-flex rounded-full border border-emerald-300/40 bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                  Accepted
                </span>
              ) : showSentBadge ? (
                <span className="mt-1 inline-flex rounded-full border border-cream/25 bg-cream/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cream">
                  Sent
                </span>
              ) : null}
            </div>
          </div>
        </header>

        <div className="px-4 py-5 sm:px-8 sm:py-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Prepared for</p>
              <p className="mt-1 font-display text-lg font-semibold text-foreground">{quote.customerName}</p>
              {quote.propertyAddress ? (
                <p className="mt-1 text-sm text-foreground/65">{quote.propertyAddress}</p>
              ) : null}
              <div className="mt-2 space-y-0.5 text-sm text-foreground/55">
                {quote.customerPhone ? <p>{quote.customerPhone}</p> : null}
                {quote.customerEmail ? <p>{quote.customerEmail}</p> : null}
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">From</p>
              <p className="mt-1 font-semibold text-foreground">{businessInfo.name}</p>
              <p className="mt-1 text-sm text-foreground/65">{businessInfo.location}</p>
              <p className="text-sm text-foreground/65">{businessInfo.phone}</p>
              <p className="text-sm text-foreground/65">{businessInfo.email}</p>
            </div>
          </div>

          {(quote.serviceFrequencyLabel || quote.planTierLabel) && (
            <div className="mt-6 flex flex-wrap gap-2">
              {quote.serviceFrequencyLabel ? (
                <span className="rounded-full border border-forest/15 bg-forest/5 px-3 py-1 text-xs font-semibold text-forest">
                  {quote.serviceFrequencyLabel}
                </span>
              ) : null}
              {quote.planTierLabel ? (
                <span className="rounded-full border border-moss/25 bg-moss/10 px-3 py-1 text-xs font-semibold text-forest">
                  {quote.planTierLabel} yard
                </span>
              ) : null}
            </div>
          )}

          {hasOptions && !lockedSelection ? (
            <div className="mt-6 rounded-xl border border-forest/15 bg-forest/4 px-4 py-3">
              <p className="text-sm leading-relaxed text-foreground/70">
                This estimate includes the initial first cut only. After the initial service is completed, weekly lawn
                maintenance will begin the following week. Please select one ongoing maintenance plan below. The 4-week
                prepaid cycle is billed in advance and includes 4 weekly visits. Weekly payment is available at a higher
                per-visit rate.
              </p>
            </div>
          ) : null}

          {tableItems.length > 0 ? (
            <div className="mt-6 overflow-hidden rounded-xl border border-foreground/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-foreground/10 bg-foreground/4 text-left">
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                      {hasOptions ? "Required service" : "Service"}
                    </th>
                    <th className="quote-print-col hidden px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/45 sm:table-cell">
                      Qty
                    </th>
                    <th className="quote-print-col hidden px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/45 md:table-cell">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableItems.map((item) => (
                    <tr key={item.id} className="border-b border-foreground/8 last:border-b-0">
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{item.name}</span>
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                              item.category === "ADD_ON"
                                ? "border-violet-300/40 bg-violet-50/80 text-violet-700"
                                : "border-foreground/12 bg-foreground/5 text-foreground/50"
                            }`}
                          >
                            {item.categoryLabel}
                          </span>
                        </div>
                        {item.description ? <p className="mt-1 text-xs text-foreground/50">{item.description}</p> : null}
                        <p className="quote-screen-only mt-1 text-xs text-foreground/40 sm:hidden">
                          {item.quantity}
                          {item.pricingUnit ? ` ${item.pricingUnit}` : ""} × {fmtMoney(item.unitPrice)}
                        </p>
                      </td>
                      <td className="quote-print-col hidden px-4 py-3 text-right tabular-nums text-foreground/70 sm:table-cell">
                        {item.quantity}
                        {item.pricingUnit ? <span className="block text-[10px] text-foreground/40">{item.pricingUnit}</span> : null}
                      </td>
                      <td className="quote-print-col hidden px-4 py-3 text-right tabular-nums text-foreground/70 md:table-cell">
                        {fmtMoney(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground">
                        {fmtMoney(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : quote.items.length === 0 ? (
            <p className="mt-6 rounded-xl border border-foreground/10 px-4 py-10 text-center text-foreground/45">
              No line items on this {documentTitle.toLowerCase()} yet.
            </p>
          ) : null}

          {hasOptions ? (
            <QuoteOptionsSelector
              quoteId={quote.id}
              interactive={interactive}
              showUnselected={!lockedSelection}
              groups={quote.optionGroups}
              items={quote.items}
              taxRatePercent={quote.taxRatePercent}
            />
          ) : null}

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex items-center justify-between text-foreground/65">
                <span>Subtotal</span>
                <span className="tabular-nums">{fmtMoney(quote.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-foreground/65">
                <span>Tax ({quote.taxRatePercent.toFixed(3)}%)</span>
                <span className="tabular-nums">{fmtMoney(quote.tax)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-foreground/12 pt-2 font-display text-lg font-semibold text-forest">
                <span>Total due today</span>
                <span className="tabular-nums">{fmtMoney(quote.total)}</span>
              </div>
            </div>
          </div>

          {recurring.length > 0 ? (
            <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-50/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800/70">
                Selected recurring plan — ongoing service
              </p>
              <div className="mt-3 space-y-3">
                {recurring.map((r, i) => (
                  <div key={i} className="border-t border-amber-400/20 pt-3 first:border-t-0 first:pt-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                        {r.name}
                        {r.recommended ? (
                          <span className="rounded-full border border-emerald-400/40 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            {r.badgeLabel || "Recommended"}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-display text-base font-bold tabular-nums text-amber-800">
                        {fmtMoney(r.total)} {r.intervalLabel}
                      </span>
                    </div>
                    {r.description ? <p className="mt-0.5 text-xs text-foreground/55">{r.description}</p> : null}
                    <p className="mt-0.5 text-[11px] text-foreground/45">
                      Subtotal {fmtMoney(r.subtotal)} · Tax {fmtMoney(r.tax)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-amber-800/70">
                Billed in advance before each cycle, starting after the first service is completed. Not part of the total
                due today{quote.collectFirstCycleNow ? " — except the first cycle, which is included in today's total" : ""}.
              </p>
            </div>
          ) : null}

          {hasOptions && !lockedSelection ? (
            <div className="mt-4 rounded-xl border border-foreground/10 bg-foreground/3 px-4 py-3">
              <p className="text-xs leading-relaxed text-foreground/70">
                By accepting this estimate, the customer approves the initial first cut and the selected ongoing
                maintenance plan. Recurring service will begin after the first cut is completed.
              </p>
            </div>
          ) : null}

          {quote.notes ? (
            <div className="mt-8 rounded-xl border border-foreground/10 bg-foreground/3 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Notes</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/70">{quote.notes}</p>
            </div>
          ) : null}

          {isAccepted ? (
            <div className="mt-8 rounded-xl border border-emerald-500/25 bg-emerald-50/70 px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/70">
                    Client acceptance
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-emerald-900">Accepted</p>
                  {acceptedAt ? (
                    <p className="mt-1 text-sm text-emerald-800/85">
                      Signed on {fmtQuoteDate(acceptedAt)}
                    </p>
                  ) : null}
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-emerald-900/75">
                    The client has read and agreed to the Terms &amp; Conditions and approved the scope and pricing
                    in this {documentTitle.toLowerCase()}.
                  </p>
                </div>
                {quote.signatureData ? (
                  <div className="shrink-0 rounded-lg border border-emerald-900/10 bg-white px-3 py-2.5 sm:min-w-[11rem]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                      Signature
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={quote.signatureData}
                      alt={`Signature of ${quote.customerName}`}
                      className="quote-signature-image mt-2 max-h-20 w-auto"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {isPaid ? (
            <div className="mt-8 rounded-xl border border-emerald-500/25 bg-emerald-50/70 px-4 py-4 sm:px-5 sm:py-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/70">
                Payment
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-emerald-900">Paid in full</p>
              <p className="mt-1 text-sm text-emerald-800/85">
                {fmtMoney(quote.total)} received
                {quote.paidAt ? ` on ${fmtQuoteDate(quote.paidAt)}` : ""}
                {getQuotePaymentMethodPublicLabel(quote.paymentMethod)
                  ? ` via ${getQuotePaymentMethodPublicLabel(quote.paymentMethod)}`
                  : ""}
                .
              </p>
              {quote.paymentNote && (quote.paymentMethod === "CHECK" || quote.paymentMethod === "CASH") ? (
                <p className="mt-1 text-sm text-emerald-800/75">Reference: {quote.paymentNote}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="border-t border-forest/10 bg-forest/4 px-4 py-4 text-center text-xs text-foreground/50 sm:px-8">
          {mode === "public" ? (
            <p>
              Questions? Contact us at{" "}
              <a href={`tel:${businessInfo.phoneTel}`} className="font-medium text-accent hover:underline">
                {businessInfo.phone}
              </a>{" "}
              or{" "}
              <a href={`mailto:${businessInfo.email}`} className="font-medium text-accent hover:underline">
                {businessInfo.email}
              </a>
              .
            </p>
          ) : (
            <p>
              Internal preview —{" "}
              <Link href={`/dashboard/estimados/${quote.id}`} className="font-medium text-accent hover:underline">
                back to edit
              </Link>
            </p>
          )}
        </footer>
      </article>
    </div>
  )
}

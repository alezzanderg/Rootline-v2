export type QuoteLineTypeValue = "REQUIRED" | "OPTION" | "ADDON"
export type QuoteRecurringIntervalValue =
  | "WEEKLY"
  | "EVERY_4_WEEKS"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY"

/** Minimal line shape needed to compute estimate totals. */
export type PricingLine = {
  lineType: QuoteLineTypeValue
  isRecurring: boolean
  isSelected: boolean
  taxable: boolean
  quantity: number
  unitPrice: number
  lineTotal: number
  recurringInterval?: QuoteRecurringIntervalValue | null
  name?: string | null
  description?: string | null
  recommended?: boolean
  badgeLabel?: string | null
}

export type RecurringSummary = {
  name: string
  description: string | null
  recommended: boolean
  badgeLabel: string | null
  interval: QuoteRecurringIntervalValue | null
  intervalLabel: string
  visits: number
  unitPrice: number
  subtotal: number
  tax: number
  total: number
}

export type QuoteTotals = {
  dueNowSubtotal: number
  dueNowTax: number
  dueNowTotal: number
  recurring: RecurringSummary[]
  taxRatePercent: number
}

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** A line counts toward the accepted scope when it is required, or a selected option/add-on. */
export function isLineActive(line: Pick<PricingLine, "lineType" | "isSelected">): boolean {
  return line.lineType === "REQUIRED" || line.isSelected
}

/** Customer-facing English label for a recurring billing cadence. */
export function recurringIntervalLabel(
  interval: QuoteRecurringIntervalValue | null | undefined,
  visits: number
): string {
  switch (interval) {
    case "WEEKLY":
      return "per weekly visit"
    case "EVERY_4_WEEKS":
      return "every 4 weeks"
    case "MONTHLY":
      return "per month"
    case "QUARTERLY":
      return "per quarter"
    case "YEARLY":
      return "per year"
    default:
      return visits > 1 ? `per ${visits}-visit cycle` : "recurring"
  }
}

export function computeQuoteTotals(
  lines: PricingLine[],
  taxRatePercent: number,
  opts: { collectFirstCycleNow?: boolean } = {}
): QuoteTotals {
  const collectFirstCycleNow = opts.collectFirstCycleNow ?? false
  const active = lines.filter(isLineActive)

  // Due now: non-recurring active lines, plus first recurring cycle if collecting upfront.
  let dueNowSubtotal = 0
  let dueNowTaxable = 0
  for (const l of active) {
    const inDueNow = !l.isRecurring || collectFirstCycleNow
    if (!inDueNow) continue
    dueNowSubtotal += l.lineTotal
    if (l.taxable) dueNowTaxable += l.lineTotal
  }
  dueNowSubtotal = round(dueNowSubtotal)
  const dueNowTax = round((dueNowTaxable * taxRatePercent) / 100)
  const dueNowTotal = round(dueNowSubtotal + dueNowTax)

  const recurring: RecurringSummary[] = active
    .filter((l) => l.isRecurring)
    .map((l) => {
      const subtotal = round(l.lineTotal)
      const tax = round(((l.taxable ? l.lineTotal : 0) * taxRatePercent) / 100)
      return {
        name: l.name ?? "Recurring service",
        description: l.description ?? null,
        recommended: l.recommended ?? false,
        badgeLabel: l.badgeLabel ?? null,
        interval: l.recurringInterval ?? null,
        intervalLabel: recurringIntervalLabel(l.recurringInterval, l.quantity),
        visits: l.quantity,
        unitPrice: l.unitPrice,
        subtotal,
        tax,
        total: round(subtotal + tax),
      }
    })

  return { dueNowSubtotal, dueNowTax, dueNowTotal, recurring, taxRatePercent }
}

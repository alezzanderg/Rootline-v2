import { describe, expect, it } from "vitest"

import { computeQuoteTotals, isLineActive, type PricingLine } from "@/lib/quote-pricing"

/**
 * This is the money. A mistake here undercharges or overcharges a real customer
 * on a signed estimate, and nothing in the UI would reveal it.
 */

function line(overrides: Partial<PricingLine> = {}): PricingLine {
  return {
    lineType: "REQUIRED",
    isRecurring: false,
    isSelected: false,
    taxable: true,
    quantity: 1,
    unitPrice: 100,
    lineTotal: 100,
    ...overrides,
  }
}

describe("isLineActive", () => {
  it("counts required lines whether or not they are selected", () => {
    expect(isLineActive({ lineType: "REQUIRED", isSelected: false })).toBe(true)
    expect(isLineActive({ lineType: "REQUIRED", isSelected: true })).toBe(true)
  })

  it("counts options and add-ons only when selected", () => {
    expect(isLineActive({ lineType: "OPTION", isSelected: false })).toBe(false)
    expect(isLineActive({ lineType: "OPTION", isSelected: true })).toBe(true)
    expect(isLineActive({ lineType: "ADDON", isSelected: false })).toBe(false)
    expect(isLineActive({ lineType: "ADDON", isSelected: true })).toBe(true)
  })
})

describe("computeQuoteTotals", () => {
  it("adds tax to a single taxable line", () => {
    const totals = computeQuoteTotals([line({ lineTotal: 100 })], 6.625)
    expect(totals.dueNowSubtotal).toBe(100)
    expect(totals.dueNowTax).toBe(6.63)
    expect(totals.dueNowTotal).toBe(106.63)
  })

  it("leaves non-taxable lines out of the tax base but in the subtotal", () => {
    const totals = computeQuoteTotals(
      [line({ lineTotal: 100, taxable: true }), line({ lineTotal: 50, taxable: false })],
      10
    )
    expect(totals.dueNowSubtotal).toBe(150)
    expect(totals.dueNowTax).toBe(10)
    expect(totals.dueNowTotal).toBe(160)
  })

  it("ignores unselected options entirely", () => {
    const totals = computeQuoteTotals(
      [
        line({ lineTotal: 100 }),
        line({ lineType: "OPTION", isSelected: false, lineTotal: 999 }),
        line({ lineType: "ADDON", isSelected: false, lineTotal: 555 }),
      ],
      0
    )
    expect(totals.dueNowSubtotal).toBe(100)
    expect(totals.dueNowTotal).toBe(100)
  })

  it("includes selected options", () => {
    const totals = computeQuoteTotals(
      [line({ lineTotal: 100 }), line({ lineType: "OPTION", isSelected: true, lineTotal: 40 })],
      0
    )
    expect(totals.dueNowSubtotal).toBe(140)
  })

  it("keeps recurring lines out of the amount due today by default", () => {
    const totals = computeQuoteTotals(
      [
        line({ lineTotal: 100 }),
        line({ isRecurring: true, lineTotal: 200, recurringInterval: "MONTHLY", name: "Plan" }),
      ],
      0
    )
    expect(totals.dueNowSubtotal).toBe(100)
    expect(totals.recurring).toHaveLength(1)
    expect(totals.recurring[0].subtotal).toBe(200)
  })

  it("adds the first recurring cycle to today's total when collectFirstCycleNow is on", () => {
    const totals = computeQuoteTotals(
      [
        line({ lineTotal: 100 }),
        line({ isRecurring: true, lineTotal: 200, recurringInterval: "MONTHLY", name: "Plan" }),
      ],
      0,
      { collectFirstCycleNow: true }
    )
    expect(totals.dueNowSubtotal).toBe(300)
    // The plan still shows as recurring: it is charged again next cycle.
    expect(totals.recurring).toHaveLength(1)
  })

  it("taxes the recurring cycle separately from today's total", () => {
    const totals = computeQuoteTotals(
      [line({ isRecurring: true, lineTotal: 200, taxable: true, recurringInterval: "MONTHLY" })],
      10
    )
    expect(totals.dueNowTotal).toBe(0)
    expect(totals.recurring[0].tax).toBe(20)
    expect(totals.recurring[0].total).toBe(220)
  })

  it("returns zeros for an empty estimate instead of NaN", () => {
    const totals = computeQuoteTotals([], 6.625)
    expect(totals.dueNowSubtotal).toBe(0)
    expect(totals.dueNowTax).toBe(0)
    expect(totals.dueNowTotal).toBe(0)
    expect(totals.recurring).toEqual([])
  })

  it("rounds to cents rather than accumulating float drift", () => {
    // 3 x 33.33 at 8.25% is the classic case where naive float math shows 0.1 cents.
    const totals = computeQuoteTotals(
      [line({ lineTotal: 33.33 }), line({ lineTotal: 33.33 }), line({ lineTotal: 33.33 })],
      8.25
    )
    expect(totals.dueNowSubtotal).toBe(99.99)
    expect(Number.isInteger(totals.dueNowTotal * 100)).toBe(true)
  })

  it("handles a zero tax rate without producing -0", () => {
    const totals = computeQuoteTotals([line({ lineTotal: 100 })], 0)
    expect(totals.dueNowTax).toBe(0)
    expect(Object.is(totals.dueNowTax, -0)).toBe(false)
  })
})

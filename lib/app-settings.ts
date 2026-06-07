import { prisma } from "@/lib/prisma"

const TAX_RATE_KEY = "taxRatePercent"
const DEFAULT_TAX_RATE_PERCENT = 6.625

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

/** Tax rates need 3 decimal places (e.g. NJ 6.625%), not 2 like dollar amounts. */
function roundTaxRatePercent(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function formatTaxRatePercent(value: number): string {
  return roundTaxRatePercent(value).toFixed(3)
}

export async function getTaxRatePercent(): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ value: string }>>`
    SELECT "value"
    FROM "AppSetting"
    WHERE "key" = ${TAX_RATE_KEY}
    LIMIT 1
  `
  const setting = rows[0]
  if (!setting) return DEFAULT_TAX_RATE_PERCENT
  const parsed = Number(setting.value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_TAX_RATE_PERCENT
}

export async function setTaxRatePercent(percent: number): Promise<void> {
  const normalized = Math.max(0, roundTaxRatePercent(percent))
  await prisma.$executeRaw`
    INSERT INTO "AppSetting" ("key", "value", "updatedAt")
    VALUES (${TAX_RATE_KEY}, ${formatTaxRatePercent(normalized)}, NOW())
    ON CONFLICT ("key")
    DO UPDATE SET
      "value" = EXCLUDED."value",
      "updatedAt" = NOW()
  `
}

export async function recalcQuoteTotals(quoteId: string): Promise<void> {
  const [items, taxRatePercent] = await Promise.all([
    prisma.quoteItem.findMany({ where: { quoteId }, select: { lineTotal: true } }),
    getTaxRatePercent(),
  ])
  const subtotal = roundMoney(items.reduce((acc, item) => acc + Number(item.lineTotal), 0))
  const tax = roundMoney(subtotal * (taxRatePercent / 100))
  const total = roundMoney(subtotal + tax)

  await prisma.quote.update({
    where: { id: quoteId },
    data: { subtotal, tax, total },
  })
}


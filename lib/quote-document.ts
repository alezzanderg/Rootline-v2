import { getTaxRatePercent } from "@/lib/app-settings"
import {
  fmtMoney,
  fmtQuoteDate,
  getPublicQuotePath,
  QUOTE_STATUS_PUBLIC_LABEL,
} from "@/lib/quote-document-format"
import { prisma } from "@/lib/prisma"
import { type PlanTier } from "@/lib/service-pricing"
import { absoluteUrl } from "@/lib/site-config"

export { fmtMoney, fmtQuoteDate, getPublicQuotePath, QUOTE_STATUS_PUBLIC_LABEL }

/** English labels for customer-facing estimate documents. */
const QUOTE_DOCUMENT_FREQUENCY_LABEL: Record<string, string> = {
  ONE_TIME: "One-time Service",
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
}

const QUOTE_DOCUMENT_PLAN_TIER_LABEL: Record<PlanTier, string> = {
  SMALL: "Small",
  MEDIUM: "Medium",
  LARGE: "Large",
}

const QUOTE_DOCUMENT_CATEGORY_LABEL: Record<string, string> = {
  CORE: "Core",
  ADD_ON: "Add-on",
  CLEANUP: "Cleanup",
}

export type QuoteDocumentItem = {
  id: string
  name: string
  category: string
  categoryLabel: string
  pricingUnit: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
  description: string | null
}

export type QuoteDocumentData = {
  id: string
  quoteNumber: string
  status: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  propertyAddress: string | null
  serviceFrequency: string | null
  serviceFrequencyLabel: string | null
  planTier: string | null
  planTierLabel: string | null
  validUntil: Date | null
  createdAt: Date
  notes: string | null
  subtotal: number
  tax: number
  total: number
  taxRatePercent: number
  items: QuoteDocumentItem[]
  publicToken: string | null
  approvedAt: Date | null
  rejectedAt: Date | null
  signedAt: Date | null
  signatureData: string | null
  mercuryInvoiceSlug: string | null
  mercuryInvoiceStatus: string | null
  paidAt: Date | null
  stripeCheckoutUrl: string | null
  stripePaymentStatus: string | null
}

const quoteDocumentInclude = {
  customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
  property: { select: { street: true, city: true, state: true, zipCode: true } },
  items: {
    include: { service: { select: { name: true, category: true, pricingUnit: true } } },
    orderBy: { id: "asc" as const },
  },
} as const

function mapQuoteToDocument(
  quote: {
    id: string
    status: string
    serviceFrequency: string | null
    planTier: string | null
    validUntil: Date | null
    createdAt: Date
    notes: string | null
    subtotal: { toString(): string }
    tax: { toString(): string }
    total: { toString(): string }
    publicToken: string | null
    approvedAt: Date | null
    rejectedAt: Date | null
    signedAt: Date | null
    signatureData: string | null
    mercuryInvoiceSlug: string | null
    mercuryInvoiceStatus: string | null
    paidAt: Date | null
    stripeCheckoutUrl: string | null
    stripePaymentStatus: string | null
    customer: { firstName: string; lastName: string; email: string | null; phone: string | null }
    property: { street: string; city: string; state: string; zipCode: string } | null
    items: Array<{
      id: string
      quantity: { toString(): string }
      unitPrice: { toString(): string }
      lineTotal: { toString(): string }
      description: string | null
      service: { name: string; category: string; pricingUnit: string | null }
    }>
  },
  taxRatePercent: number
): QuoteDocumentData {
  const planTier = quote.planTier
  const planTierLabel =
    planTier === "SMALL" || planTier === "MEDIUM" || planTier === "LARGE"
      ? QUOTE_DOCUMENT_PLAN_TIER_LABEL[planTier as PlanTier]
      : null

  return {
    id: quote.id,
    quoteNumber: quote.id.slice(0, 8).toUpperCase(),
    status: quote.status,
    customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
    customerEmail: quote.customer.email,
    customerPhone: quote.customer.phone,
    propertyAddress: quote.property
      ? `${quote.property.street}, ${quote.property.city}, ${quote.property.state} ${quote.property.zipCode}`
      : null,
    serviceFrequency: quote.serviceFrequency,
    serviceFrequencyLabel: quote.serviceFrequency
      ? (QUOTE_DOCUMENT_FREQUENCY_LABEL[quote.serviceFrequency] ?? quote.serviceFrequency)
      : null,
    planTier,
    planTierLabel,
    validUntil: quote.validUntil,
    createdAt: quote.createdAt,
    notes: quote.notes,
    subtotal: Number(quote.subtotal),
    tax: Number(quote.tax),
    total: Number(quote.total),
    taxRatePercent,
    publicToken: quote.publicToken,
    approvedAt: quote.approvedAt,
    rejectedAt: quote.rejectedAt,
    signedAt: quote.signedAt,
    signatureData: quote.signatureData,
    mercuryInvoiceSlug: quote.mercuryInvoiceSlug,
    mercuryInvoiceStatus: quote.mercuryInvoiceStatus,
    paidAt: quote.paidAt,
    stripeCheckoutUrl: quote.stripeCheckoutUrl,
    stripePaymentStatus: quote.stripePaymentStatus,
    items: quote.items.map((item) => ({
      id: item.id,
      name: item.service.name,
      category: item.service.category,
      categoryLabel: QUOTE_DOCUMENT_CATEGORY_LABEL[item.service.category] ?? item.service.category,
      pricingUnit: item.service.pricingUnit,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      description: item.description,
    })),
  }
}

export async function getQuoteDocumentById(id: string): Promise<QuoteDocumentData | null> {
  const [quote, taxRatePercent] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: quoteDocumentInclude,
    }),
    getTaxRatePercent(),
  ])
  if (!quote) return null
  return mapQuoteToDocument(quote, taxRatePercent)
}

export async function getQuoteDocumentByPublicToken(token: string): Promise<QuoteDocumentData | null> {
  const [quote, taxRatePercent] = await Promise.all([
    prisma.quote.findUnique({
      where: { publicToken: token },
      include: quoteDocumentInclude,
    }),
    getTaxRatePercent(),
  ])
  if (!quote) return null
  return mapQuoteToDocument(quote, taxRatePercent)
}

export function getPublicQuoteUrl(token: string): string {
  return absoluteUrl(getPublicQuotePath(token))
}

import { getTaxRatePercent } from "@/lib/app-settings"
import {
  getMercuryDestinationAccountId,
  getMercuryPayUrl,
  isMercuryConfigured,
} from "@/lib/mercury/config"
import { mercuryRequest, MercuryApiError } from "@/lib/mercury/client"
import type {
  CreateMercuryInvoiceInput,
  MercuryAccount,
  MercuryArCustomer,
  MercuryArInvoice,
  MercuryInvoiceStatus,
} from "@/lib/mercury/types"
import { prisma } from "@/lib/prisma"

export { getMercuryPayUrl, isMercuryConfigured, MercuryApiError }

type QuoteForMercuryInvoice = {
  id: string
  status: string
  subtotal: { toString(): string }
  tax: { toString(): string }
  total: { toString(): string }
  validUntil: Date | null
  createdAt: Date
  notes: string | null
  collectFirstCycleNow: boolean
  mercuryInvoiceId: string | null
  mercuryInvoiceSlug: string | null
  mercuryInvoiceStatus: string | null
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    mercuryCustomerId: string | null
  }
  property: {
    street: string
    city: string
    state: string
    zipCode: string
  } | null
  items: Array<{
    quantity: { toString(): string }
    unitPrice: { toString(): string }
    description: string | null
    isRecurring: boolean
    isSelected: boolean
    lineType: "REQUIRED" | "OPTION" | "ADDON"
    name: string | null
    service: { name: string } | null
  }>
}

function formatMercuryDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function quoteInvoiceNumber(quoteId: string): string {
  return `EST-${quoteId.slice(0, 8).toUpperCase()}`
}

async function ensureMercuryCustomer(quote: QuoteForMercuryInvoice): Promise<string> {
  if (quote.customer.mercuryCustomerId) {
    return quote.customer.mercuryCustomerId
  }

  const email = quote.customer.email?.trim()
  if (!email) {
    throw new MercuryApiError("Customer email is required for Mercury invoicing", 0)
  }

  const name = `${quote.customer.firstName} ${quote.customer.lastName}`.trim()
  const address = quote.property
    ? {
        name,
        address1: quote.property.street,
        city: quote.property.city,
        region: quote.property.state,
        postalCode: quote.property.zipCode,
        country: "US" as const,
      }
    : null

  const created = await mercuryRequest<MercuryArCustomer>("/ar/customers", {
    method: "POST",
    body: {
      name,
      email,
      address,
    },
  })

  await prisma.customer.update({
    where: { id: quote.customer.id },
    data: { mercuryCustomerId: created.id },
  })

  return created.id
}

function buildInvoicePayload(
  quote: QuoteForMercuryInvoice,
  mercuryCustomerId: string,
  destinationAccountId: string,
  taxRatePercent: number,
  sendEmailOption: "DontSend" | "SendNow"
): CreateMercuryInvoiceInput {
  const salesTaxRate = taxRatePercent / 100
  const invoiceDate = formatMercuryDay(quote.createdAt)
  const dueDate = formatMercuryDay(quote.validUntil ?? quote.createdAt)

  return {
    customerId: mercuryCustomerId,
    destinationAccountId,
    invoiceDate,
    dueDate,
    invoiceNumber: quoteInvoiceNumber(quote.id),
    lineItems: quote.items
      .filter((item) => {
        const active = item.lineType === "REQUIRED" || item.isSelected
        return active && (!item.isRecurring || quote.collectFirstCycleNow)
      })
      .map((item) => ({
        name: item.service?.name ?? item.name ?? "Service",
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        salesTaxRate,
      })),
    payerMemo: quote.notes,
    internalNote: `Rootline quote ${quote.id}`,
    creditCardEnabled: true,
    achDebitEnabled: true,
    useRealAccountNumber: false,
    ccEmails: [],
    sendEmailOption,
  }
}

export async function createMercuryInvoiceForQuote(
  quoteId: string,
  options: { sendEmail?: boolean } = {}
): Promise<{ payUrl: string; status: MercuryInvoiceStatus }> {
  if (!isMercuryConfigured()) {
    throw new MercuryApiError("Mercury is not configured", 0)
  }

  const destinationAccountId = getMercuryDestinationAccountId()
  if (!destinationAccountId) {
    throw new MercuryApiError("MERCURY_DESTINATION_ACCOUNT_ID is not configured", 0)
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mercuryCustomerId: true,
        },
      },
      property: { select: { street: true, city: true, state: true, zipCode: true } },
      items: {
        include: { service: { select: { name: true } } },
        orderBy: { id: "asc" },
      },
    },
  })

  if (!quote) throw new MercuryApiError("Quote not found", 0)
  if (quote.status !== "APPROVED") {
    throw new MercuryApiError("Quote must be approved before creating a payment link", 0)
  }
  if (quote.items.length === 0) {
    throw new MercuryApiError("Quote has no line items", 0)
  }

  if (quote.mercuryInvoiceId && quote.mercuryInvoiceSlug) {
    return {
      payUrl: getMercuryPayUrl(quote.mercuryInvoiceSlug),
      status: (quote.mercuryInvoiceStatus as MercuryInvoiceStatus) ?? "Unpaid",
    }
  }

  const [mercuryCustomerId, taxRatePercent] = await Promise.all([
    ensureMercuryCustomer(quote),
    getTaxRatePercent(),
  ])

  const invoice = await mercuryRequest<MercuryArInvoice>("/ar/invoices", {
    method: "POST",
    body: buildInvoicePayload(
      quote,
      mercuryCustomerId,
      destinationAccountId,
      taxRatePercent,
      options.sendEmail ? "SendNow" : "DontSend"
    ),
  })

  const paidAt = invoice.status === "Paid" ? new Date() : null

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      mercuryInvoiceId: invoice.id,
      mercuryInvoiceSlug: invoice.slug,
      mercuryInvoiceStatus: invoice.status,
      paidAt,
      ...(paidAt ? { paymentMethod: "MERCURY" as const } : {}),
    },
  })

  return {
    payUrl: getMercuryPayUrl(invoice.slug),
    status: invoice.status,
  }
}

export async function syncMercuryInvoiceStatus(quoteId: string): Promise<MercuryInvoiceStatus | null> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { mercuryInvoiceId: true },
  })
  if (!quote?.mercuryInvoiceId) return null

  const invoice = await mercuryRequest<MercuryArInvoice>(`/ar/invoices/${quote.mercuryInvoiceId}`)
  const paidAt = invoice.status === "Paid" ? new Date() : null

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      mercuryInvoiceStatus: invoice.status,
      paidAt,
      ...(paidAt ? { paymentMethod: "MERCURY" as const } : {}),
    },
  })

  return invoice.status
}

export async function listMercuryAccounts(): Promise<MercuryAccount[]> {
  const response = await mercuryRequest<{ accounts: MercuryAccount[] }>("/accounts")
  return response.accounts ?? []
}

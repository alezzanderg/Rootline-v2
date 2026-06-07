/** Client-safe quote document helpers (no Prisma / Node-only imports). */

export function getPublicQuotePath(token: string): string {
  return `/quote/${token}`
}

export function fmtQuoteDate(d: Date | null | undefined): string {
  if (!d) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d)
}

export function fmtMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n)
}

export const QUOTE_STATUS_PUBLIC_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  APPROVED: "Approved",
  REJECTED: "Declined",
}

export function getQuoteDocumentTitle(isPaid: boolean): "Invoice" | "Estimate" {
  return isPaid ? "Invoice" : "Estimate"
}

export function buildQuoteDocumentDownloadTitle(
  quoteNumber: string,
  customerName: string,
  options: { isPaid?: boolean; isAccepted?: boolean } = {}
): string {
  const safeName = customerName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")

  const docType = options.isPaid ? "Invoice" : "Estimate"
  const base = safeName ? `${docType}-${quoteNumber}-${safeName}` : `${docType}-${quoteNumber}`

  if (options.isPaid) return `${base}-Paid`
  if (options.isAccepted) return `${base}-Accepted`
  return base
}

export function getQuoteDocumentDownloadLabel(
  mode: "preview" | "public",
  options: { isPaid?: boolean; isAccepted?: boolean } = {}
): string {
  if (options.isPaid) {
    return mode === "public" ? "Download invoice PDF" : "Descargar factura PDF"
  }
  if (options.isAccepted) {
    return mode === "public" ? "Download accepted PDF" : "Descargar PDF aceptado"
  }
  return mode === "public" ? "Download PDF" : "Descargar PDF"
}

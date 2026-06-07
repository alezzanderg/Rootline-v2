export type MercuryInvoiceStatus = "Unpaid" | "Paid" | "Cancelled" | "Processing"

export type MercuryArCustomer = {
  id: string
  name: string
  email: string
}

export type MercuryArLineItem = {
  name: string
  quantity: number
  unitPrice: number
  salesTaxRate?: number | null
}

export type MercuryArInvoice = {
  id: string
  slug: string
  status: MercuryInvoiceStatus
  amount: number
  invoiceNumber: string
  dueDate: string
  invoiceDate: string
  customerId: string
  creditCardEnabled: boolean
  achDebitEnabled: boolean
  updatedAt: string
  canceledAt?: string | null
}

export type MercuryAccount = {
  id: string
  name: string
  status: string
  type: string
}

export type CreateMercuryInvoiceInput = {
  customerId: string
  destinationAccountId: string
  invoiceDate: string
  dueDate: string
  invoiceNumber: string
  lineItems: MercuryArLineItem[]
  payerMemo?: string | null
  internalNote?: string | null
  creditCardEnabled: boolean
  achDebitEnabled: boolean
  useRealAccountNumber: boolean
  ccEmails: string[]
  sendEmailOption?: "DontSend" | "SendNow"
}

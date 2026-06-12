import type { Prisma } from "@/lib/generated/prisma/client"

export type OperatingTxnType =
  | "CAPITAL_CONTRIBUTION"
  | "PARTNER_LOAN"
  | "PARTNER_REIMBURSEMENT"
  | "COMPANY_EXPENSE"
  | "PROJECT_EXPENSE"

export type TxnDirection = "in" | "out"

type TypeMeta = {
  label: string
  short: string
  direction: TxnDirection
  needsPartner: boolean
  needsJob: boolean
  isExpense: boolean
  accent: string
}

export const OPERATING_TYPE_META: Record<OperatingTxnType, TypeMeta> = {
  CAPITAL_CONTRIBUTION: {
    label: "Aporte de capital del socio",
    short: "Aporte de capital",
    direction: "in",
    needsPartner: true,
    needsJob: false,
    isExpense: false,
    accent: "border-emerald-500/35 bg-emerald-50 text-emerald-700",
  },
  PARTNER_LOAN: {
    label: "Préstamo del socio a la empresa",
    short: "Préstamo del socio",
    direction: "in",
    needsPartner: true,
    needsJob: false,
    isExpense: false,
    accent: "border-sky-500/35 bg-sky-50 text-sky-700",
  },
  PARTNER_REIMBURSEMENT: {
    label: "Reembolso al socio",
    short: "Reembolso al socio",
    direction: "out",
    needsPartner: true,
    needsJob: false,
    isExpense: false,
    accent: "border-violet-500/35 bg-violet-50 text-violet-700",
  },
  COMPANY_EXPENSE: {
    label: "Gasto de la empresa (bills)",
    short: "Gasto de empresa",
    direction: "out",
    needsPartner: false,
    needsJob: false,
    isExpense: true,
    accent: "border-rose-500/35 bg-rose-50 text-rose-700",
  },
  PROJECT_EXPENSE: {
    label: "Gasto en proyecto",
    short: "Gasto de proyecto",
    direction: "out",
    needsPartner: false,
    needsJob: true,
    isExpense: true,
    accent: "border-amber-500/35 bg-amber-50 text-amber-800",
  },
}

export const OPERATING_TYPES = Object.keys(OPERATING_TYPE_META) as OperatingTxnType[]

export const EXPENSE_CATEGORIES = [
  "Combustible",
  "Equipo / Herramientas",
  "Mantenimiento de equipo",
  "Materiales",
  "Seguro",
  "Renta",
  "Servicios (utilities)",
  "Permisos / Licencias",
  "Marketing",
  "Software",
  "Nómina",
  "Impuestos",
  "Transporte / Vehículo",
  "Oficina",
  "Otro",
]

export type OperatingPeriod = "month" | "year" | "all"

export function normalizeOperatingType(raw: string): OperatingTxnType | null {
  return (OPERATING_TYPES as string[]).includes(raw) ? (raw as OperatingTxnType) : null
}

export function normalizePeriod(raw: string | undefined): OperatingPeriod {
  return raw === "year" || raw === "all" ? raw : "month"
}

/** Inclusive start date for a period; null = all time. */
export function periodStart(period: OperatingPeriod, now = new Date()): Date | null {
  if (period === "all") return null
  if (period === "year") return new Date(now.getFullYear(), 0, 1)
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export const PERIOD_LABEL: Record<OperatingPeriod, string> = {
  month: "Este mes",
  year: "Este año",
  all: "Todo",
}

export function num(v: Prisma.Decimal | number | null | undefined): number {
  return v == null ? 0 : Number(v)
}

export function fmtMoney(v: Prisma.Decimal | number | null | undefined): string {
  return `$${num(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—"
  return d.toLocaleDateString("es-US", { month: "short", day: "numeric", year: "numeric" })
}

export function toInputDate(d: Date | null | undefined): string {
  if (!d) return ""
  return d.toISOString().slice(0, 10)
}

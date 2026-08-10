import type { JobStatus, QuoteStatus } from "@/lib/generated/prisma/enums"

/**
 * One source of truth for how a status looks and reads across the panel.
 *
 * This replaces six hand-copied maps that had drifted into two contradictory
 * visual languages for the same data: `clientes/[id]` painted job statuses as
 * solid dark chips (`bg-blue-700 text-white`) while the dashboard, scheduling
 * page and timeline painted the identical status as a pale chip
 * (`bg-blue-50 text-blue-700`). SchedulingTimeline even carried two maps of its
 * own for the same four values.
 *
 * `badge` is the default everywhere. `solid` exists only for placement on top of
 * a colored or image background, where the pale variant loses contrast.
 */

export type StatusStyle = {
  label: string
  badge: string
  solid: string
}

const NEUTRAL: StatusStyle = {
  label: "Desconocido",
  badge: "border-foreground/20 bg-foreground/8 text-foreground/60",
  solid: "border-foreground/30 bg-foreground/60 text-background",
}

export const JOB_STATUS: Record<JobStatus, StatusStyle> = {
  SCHEDULED: {
    label: "Programado",
    badge: "border-blue-400/40 bg-blue-50 text-blue-700",
    solid: "border-blue-800 bg-blue-700 text-white",
  },
  IN_PROGRESS: {
    label: "En curso",
    badge: "border-amber-400/40 bg-amber-50 text-amber-800",
    solid: "border-amber-700 bg-amber-600 text-white",
  },
  COMPLETED: {
    label: "Completado",
    badge: "border-emerald-500/35 bg-emerald-50 text-emerald-700",
    solid: "border-emerald-800 bg-emerald-700 text-white",
  },
  CANCELLED: {
    label: "Cancelado",
    badge: "border-rose-400/40 bg-rose-50 text-rose-600",
    solid: "border-rose-800 bg-rose-700 text-white",
  },
}

export const QUOTE_STATUS: Record<QuoteStatus, StatusStyle> = {
  DRAFT: {
    label: "Borrador",
    badge: "border-foreground/20 bg-foreground/8 text-foreground/60",
    solid: "border-foreground/30 bg-foreground/60 text-background",
  },
  SENT: {
    label: "Enviado",
    badge: "border-blue-400/40 bg-blue-50 text-blue-700",
    solid: "border-blue-800 bg-blue-700 text-white",
  },
  APPROVED: {
    label: "Aprobado",
    badge: "border-emerald-500/40 bg-emerald-50 text-emerald-700",
    solid: "border-emerald-800 bg-emerald-700 text-white",
  },
  REJECTED: {
    label: "Rechazado",
    badge: "border-rose-400/40 bg-rose-50 text-rose-600",
    solid: "border-rose-800 bg-rose-700 text-white",
  },
}

/** Estimates past `validUntil` that nobody answered. Not a DB status, a derived one. */
export const EXPIRED_STATUS: StatusStyle = {
  label: "Vencido",
  badge: "border-orange-400/45 bg-orange-50 text-orange-700",
  solid: "border-orange-800 bg-orange-700 text-white",
}

export function jobStatus(status: string): StatusStyle {
  return JOB_STATUS[status as JobStatus] ?? { ...NEUTRAL, label: status }
}

export function quoteStatus(status: string): StatusStyle {
  return QUOTE_STATUS[status as QuoteStatus] ?? { ...NEUTRAL, label: status }
}

/** A SENT estimate whose validity window has closed. */
export function isQuoteExpired(
  status: string,
  validUntil: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (status !== "SENT" || !validUntil) return false
  const until = validUntil instanceof Date ? validUntil : new Date(validUntil)
  if (Number.isNaN(until.getTime())) return false
  // validUntil is a date, so the estimate stays valid through the end of that day.
  const endOfDay = new Date(until)
  endOfDay.setHours(23, 59, 59, 999)
  return endOfDay < now
}

/** Status style for an estimate, downgrading SENT to Vencido past its window. */
export function quoteStatusResolved(
  status: string,
  validUntil: Date | string | null | undefined,
  now?: Date
): StatusStyle {
  return isQuoteExpired(status, validUntil, now) ? EXPIRED_STATUS : quoteStatus(status)
}

/** Shared chip classes. Pair with `.badge` or `.solid`. */
export const STATUS_CHIP =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"

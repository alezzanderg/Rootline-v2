import { ActionError } from "@/lib/admin-action"
import { prisma } from "@/lib/prisma"
import type { JobStatus } from "@/lib/generated/prisma/enums"

/**
 * The operational half of the platform: moving a Job from scheduled to done.
 *
 * Before this module the codebase contained zero `prisma.job.update` calls —
 * jobs were created and never touched again, so `startedAt`/`completedAt` (which
 * have existed in the schema since the beginning) were never written, the
 * scheduling board grew forever, and a customer's job history was permanently
 * empty.
 *
 *        ┌─────────────┐
 *   ────▶│  SCHEDULED  │──────────────┐
 *        └──────┬──────┘              │ cancel
 *               │ start               ▼
 *               ▼               ┌─────────────┐
 *        ┌─────────────┐ cancel │  CANCELLED  │  (terminal)
 *        │ IN_PROGRESS │───────▶└─────────────┘
 *        └──────┬──────┘
 *               │ complete
 *               ▼
 *        ┌─────────────┐
 *        │  COMPLETED  │──── reopen ──▶ IN_PROGRESS
 *        └─────────────┘
 *
 * Every transition is a conditional `updateMany` filtered on the expected
 * current status. If a second actor already moved the job, zero rows match and
 * we raise `conflicto` instead of silently overwriting their timestamps.
 */

/** Which statuses each transition is allowed to start from. */
export const ALLOWED_FROM = {
  start: ["SCHEDULED"],
  complete: ["IN_PROGRESS"],
  cancel: ["SCHEDULED", "IN_PROGRESS"],
  reopen: ["COMPLETED"],
  reschedule: ["SCHEDULED", "IN_PROGRESS"],
  reassign: ["SCHEDULED", "IN_PROGRESS"],
} as const satisfies Record<string, readonly JobStatus[]>

export type JobTransition = keyof typeof ALLOWED_FROM

export function canTransition(from: JobStatus, transition: JobTransition): boolean {
  return (ALLOWED_FROM[transition] as readonly JobStatus[]).includes(from)
}

/**
 * Applies a status change only if the row is still in one of `from`.
 *
 * Distinguishes three outcomes so the user gets a useful message:
 *   - job missing entirely      -> `no_encontrado`
 *   - job exists, wrong status  -> `transicion` (illegal move) or `conflicto`
 *     (legal move, but someone else got there first)
 *   - updated                   -> resolves
 */
async function transition(
  jobId: string,
  name: JobTransition,
  data: Record<string, unknown>
): Promise<void> {
  const from = ALLOWED_FROM[name] as readonly JobStatus[]

  const { count } = await prisma.job.updateMany({
    where: { id: jobId, status: { in: [...from] } },
    data,
  })
  if (count > 0) return

  const current = await prisma.job.findUnique({ where: { id: jobId }, select: { status: true } })
  if (!current) throw new ActionError("no_encontrado")

  // The job moved on between our update and this read, or the caller asked for
  // a move that is not legal from where the job actually is.
  throw new ActionError(
    current.status === "CANCELLED" || current.status === "COMPLETED" ? "transicion" : "conflicto"
  )
}

export async function startJob(jobId: string): Promise<void> {
  await transition(jobId, "start", { status: "IN_PROGRESS", startedAt: new Date() })
}

export async function completeJob(jobId: string, notes?: string | null): Promise<void> {
  await transition(jobId, "complete", {
    status: "COMPLETED",
    completedAt: new Date(),
    ...(notes ? { notes } : {}),
  })
}

export async function cancelJob(jobId: string, reason?: string | null): Promise<void> {
  await transition(jobId, "cancel", {
    status: "CANCELLED",
    cancelledAt: new Date(),
    cancelReason: reason?.trim() || null,
  })
}

/**
 * Reopens a finished job. Crews mis-tap; the audit log records who reopened it,
 * so this stays reversible rather than forcing a duplicate job.
 */
export async function reopenJob(jobId: string): Promise<void> {
  await transition(jobId, "reopen", { status: "IN_PROGRESS", completedAt: null })
}

export async function rescheduleJob(jobId: string, scheduledAt: Date): Promise<void> {
  if (Number.isNaN(scheduledAt.getTime())) throw new ActionError("datos")
  await transition(jobId, "reschedule", { scheduledAt })
}

/** Replaces the crew on an open job. Assignments are additive rows, not a column. */
export async function reassignJob(jobId: string, employeeIds: string[]): Promise<void> {
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { status: true } })
  if (!job) throw new ActionError("no_encontrado")
  if (!canTransition(job.status, "reassign")) throw new ActionError("transicion")

  const unique = [...new Set(employeeIds.filter(Boolean))]
  if (unique.length === 0) throw new ActionError("datos")

  await prisma.$transaction([
    prisma.jobAssignment.deleteMany({ where: { jobId, employeeId: { notIn: unique } } }),
    ...unique.map((employeeId) =>
      prisma.jobAssignment.upsert({
        where: { jobId_employeeId: { jobId, employeeId } },
        create: { jobId, employeeId },
        update: {},
      })
    ),
  ])
}

export async function setJobNotes(jobId: string, notes: string | null): Promise<void> {
  const { count } = await prisma.job.updateMany({ where: { id: jobId }, data: { notes } })
  if (count === 0) throw new ActionError("no_encontrado")
}

// ── Quote → Job ───────────────────────────────────────────────────────────────

export type ConvertQuoteResult = { jobId: string; created: boolean }

/**
 * Turns an approved estimate into one scheduled job, carrying its service lines
 * over as JobItems. One visit with several tasks, which is how a landscaping
 * crew actually works and what the (previously unused) JobItem model is for.
 *
 * Idempotent by design: a double-click or a browser retry returns the existing
 * job instead of cluttering the calendar with a duplicate visit.
 */
export async function convertQuoteToJob(
  quoteId: string,
  options: { scheduledAt: Date; title?: string | null; employeeIds?: string[] }
): Promise<ConvertQuoteResult> {
  if (Number.isNaN(options.scheduledAt.getTime())) throw new ActionError("datos")

  const existing = await prisma.job.findFirst({
    where: { quoteId },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  })
  if (existing) return { jobId: existing.id, created: false }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      status: true,
      propertyId: true,
      archivedAt: true,
      customer: { select: { firstName: true, lastName: true } },
      items: {
        where: { serviceId: { not: null }, isSelected: true },
        select: { serviceId: true, quantity: true, unitPrice: true, description: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  if (!quote || quote.archivedAt) throw new ActionError("no_encontrado")
  if (quote.status !== "APPROVED") throw new ActionError("transicion")
  if (!quote.propertyId) throw new ActionError("sin_propiedad")

  const title =
    options.title?.trim() ||
    `Visita · ${quote.customer.firstName} ${quote.customer.lastName}`.trim()

  const created = await prisma.$transaction(async (tx) => {
    const job = await tx.job.create({
      data: {
        propertyId: quote.propertyId!,
        quoteId: quote.id,
        title,
        scheduledAt: options.scheduledAt,
        status: "SCHEDULED",
        items: {
          create: quote.items
            .filter((item): item is typeof item & { serviceId: string } => Boolean(item.serviceId))
            .map((item) => ({
              serviceId: item.serviceId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              description: item.description,
            })),
        },
      },
      select: { id: true },
    })

    const employeeIds = [...new Set((options.employeeIds ?? []).filter(Boolean))]
    if (employeeIds.length > 0) {
      await tx.jobAssignment.createMany({
        data: employeeIds.map((employeeId) => ({ jobId: job.id, employeeId })),
        skipDuplicates: true,
      })
    }

    return job
  })

  return { jobId: created.id, created: true }
}

import Link from "next/link"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { ActionBanner } from "@/components/ui/ActionBanner"
import { SubmitButton } from "@/components/ui/SubmitButton"
import { ActionError, requireAdmin, runAction, withError } from "@/lib/admin-action"
import {
  cancelJob,
  completeJob,
  reopenJob,
  rescheduleJob,
  startJob,
} from "@/lib/job-lifecycle"
import { prisma } from "@/lib/prisma"
import { jobStatus, STATUS_CHIP } from "@/lib/status-ui"
import { SchedulingTimeline } from "./SchedulingTimeline"

const ic = "w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

const PAGE = "/dashboard/scheduling"

type SchedulingPageProps = {
  searchParams?: Promise<{ error?: string; ok?: string }>
}

export default async function SchedulingPage({ searchParams }: SchedulingPageProps) {
  const banner = (await searchParams) ?? {}

  async function createAppointmentAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("scheduling:write")
    if (!auth.ok) redirect(withError(PAGE, auth.code))

    const result = await runAction(
      auth.user,
      { action: "job.create", entityType: "Job" },
      async () => {
        const propertyId = String(formData.get("propertyId") ?? "")
        const employeeId = String(formData.get("employeeId") ?? "")
        const title = String(formData.get("title") ?? "").trim()
        const scheduledAtRaw = String(formData.get("scheduledAt") ?? "")
        const quoteIdRaw = String(formData.get("quoteId") ?? "")
        if (!propertyId || !employeeId || !title || !scheduledAtRaw) throw new ActionError("datos")
        const scheduledAt = new Date(scheduledAtRaw)
        if (Number.isNaN(scheduledAt.getTime())) throw new ActionError("datos")
        const quoteId = quoteIdRaw === "none" ? null : quoteIdRaw

        await prisma.$transaction(async (tx) => {
          const job = await tx.job.create({
            data: { propertyId, quoteId, title, scheduledAt, status: "SCHEDULED" },
            select: { id: true },
          })
          await tx.jobAssignment.create({ data: { jobId: job.id, employeeId } })
        })
      }
    )
    if (!result.ok) redirect(withError(PAGE, result.code))
    revalidatePath(PAGE)
  }

  async function addJobItemAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("jobs:operate")
    if (!auth.ok) redirect(withError(PAGE, auth.code))

    const result = await runAction(
      auth.user,
      { action: "jobItem.add", entityType: "Job", entityId: String(formData.get("jobId") ?? "") },
      async () => {
        const jobId = String(formData.get("jobId") ?? "")
        const serviceId = String(formData.get("serviceId") ?? "")
        const quantity = Math.max(1, Number(formData.get("quantity") ?? 1))
        if (!jobId || !serviceId) throw new ActionError("datos")
        const service = await prisma.serviceCatalog.findUnique({
          where: { id: serviceId },
          select: { defaultPrice: true },
        })
        await prisma.jobItem.create({
          data: { jobId, serviceId, quantity, unitPrice: service?.defaultPrice ?? undefined },
        })
      }
    )
    if (!result.ok) redirect(withError(PAGE, result.code))
    revalidatePath(PAGE)
  }

  async function removeJobItemAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("jobs:operate")
    if (!auth.ok) redirect(withError(PAGE, auth.code))

    const result = await runAction(
      auth.user,
      { action: "jobItem.remove", entityType: "JobItem", entityId: String(formData.get("itemId") ?? "") },
      async () => {
        const itemId = String(formData.get("itemId") ?? "")
        if (!itemId) throw new ActionError("datos")
        await prisma.jobItem.delete({ where: { id: itemId } })
      }
    )
    if (!result.ok) redirect(withError(PAGE, result.code))
    revalidatePath(PAGE)
  }

  /**
   * The transition that never existed. Until now a Job was write-once: created
   * SCHEDULED and never updated, so the board grew forever and customer history
   * stayed empty. CREW_LEAD and TECHNICIAN can reach this one (jobs:operate);
   * everything else on this page is scheduling:write.
   */
  async function jobTransitionAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("jobs:operate")
    if (!auth.ok) redirect(withError(PAGE, auth.code))

    const jobId = String(formData.get("jobId") ?? "")
    const move = String(formData.get("move") ?? "")

    const result = await runAction(
      auth.user,
      { action: `job.${move || "unknown"}`, entityType: "Job", entityId: jobId },
      async () => {
        if (!jobId) throw new ActionError("datos")
        switch (move) {
          case "start":
            return startJob(jobId)
          case "complete":
            return completeJob(jobId, String(formData.get("notes") ?? "").trim() || null)
          case "cancel":
            return cancelJob(jobId, String(formData.get("reason") ?? "").trim() || null)
          case "reopen":
            return reopenJob(jobId)
          case "reschedule": {
            const raw = String(formData.get("scheduledAt") ?? "")
            if (!raw) throw new ActionError("datos")
            return rescheduleJob(jobId, new Date(raw))
          }
          default:
            throw new ActionError("datos")
        }
      }
    )
    if (!result.ok) redirect(withError(PAGE, result.code))

    revalidatePath(PAGE)
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/clientes")
  }

  const now = new Date()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const jobs = await prisma.job.findMany({
    where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
    include: {
      property: {
        include: { customer: { select: { firstName: true, lastName: true } } },
      },
      assignments: {
        include: { employee: { select: { firstName: true, lastName: true } } },
      },
      items: {
        include: { service: { select: { id: true, name: true } } },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 120,
  })

  const [properties, employees, approvedQuotes, addOnServices] = await Promise.all([
    prisma.property.findMany({
      // Archived properties and customers must not appear when booking a visit.
      where: { archivedAt: null, customer: { archivedAt: null } },
      include: { customer: { select: { firstName: true, lastName: true } } },
      orderBy: { street: "asc" },
      take: 300,
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 200,
    }),
    prisma.quote.findMany({
      where: { status: "APPROVED", archivedAt: null },
      include: { customer: { select: { firstName: true, lastName: true } } },
      orderBy: { approvedAt: "desc" },
      take: 150,
    }),
    prisma.serviceCatalog.findMany({
      where: { category: "ADD_ON", active: true, archivedAt: null },
      select: { id: true, name: true, defaultPrice: true },
      orderBy: { displayOrder: "asc" },
    }),
  ])

  // "Hoy" used to mean `scheduledAt <= endOfToday`, which quietly swept every
  // past visit into today's list. With jobs that never closed, that list only
  // ever grew. Overdue work now gets its own bucket so it can be chased.
  const overdueJobs = jobs.filter((j) => j.scheduledAt < startOfToday)
  const todaysJobs = jobs.filter((j) => j.scheduledAt >= startOfToday && j.scheduledAt <= endOfToday)
  const upcomingJobs = jobs.filter((j) => j.scheduledAt > endOfToday)

  return (
    <section className="text-foreground">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Operaciones</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Scheduling</h1>
          <p className="mt-2 text-sm text-foreground/55">
            Programa visitas, asigna crews y sigue el estado en tiempo real.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {overdueJobs.length > 0 ? (
            <span className="rounded-full border border-rose-400/40 bg-rose-50 px-3 py-1 font-semibold text-rose-700">
              {overdueJobs.length} vencidos
            </span>
          ) : null}
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {todaysJobs.length} hoy
          </span>
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {upcomingJobs.length} próximos
          </span>
        </div>
      </div>

      <ActionBanner error={banner.error} notice={banner.ok} />

      {/* New appointment form */}
      <div className="mt-6 rounded-2xl border border-foreground/12 bg-background p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Nueva visita</h2>
            <p className="mt-0.5 text-sm text-foreground/55">Crea un trabajo y asígnalo al crew.</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/estimados"
              className="rounded-xl border border-foreground/20 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
            >
              Estimados
            </Link>
            <Link
              href="/dashboard/clientes"
              className="rounded-xl border border-foreground/20 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
            >
              Clientes
            </Link>
          </div>
        </div>

        <form action={createAppointmentAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1 sm:col-span-2 lg:col-span-2">
            <span className={lbl}>Cliente / Propiedad</span>
            <select name="propertyId" required className={ic}>
              <option value="">Seleccionar propiedad</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.customer.firstName} {p.customer.lastName} · {p.street}, {p.city}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className={lbl}>Empleado asignado</span>
            <select name="employeeId" required className={ic}>
              <option value="">Asignar</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className={lbl}>Título del trabajo</span>
            <input name="title" required placeholder="Ej. Visita semanal" className={ic} />
          </label>

          <label className="grid gap-1">
            <span className={lbl}>Fecha y hora</span>
            <input name="scheduledAt" type="datetime-local" required className={ic} />
          </label>

          <label className="grid gap-1">
            <span className={lbl}>Estimado (opcional)</span>
            <select name="quoteId" className={ic}>
              <option value="none">Sin estimado</option>
              {approvedQuotes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.customer.firstName} {q.customer.lastName} · #{q.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 sm:w-auto"
            >
              Agregar visita
            </button>
          </div>
        </form>
      </div>

      {/* Overdue first: it is the bucket that needs a decision today. */}
      {overdueJobs.length > 0 ? (
        <div className="mt-6">
          <JobPanel
            title="Vencidos"
            subtitle="Pasó su fecha y siguen abiertos. Ciérralos o repárgalos."
            tone="danger"
            jobs={overdueJobs}
            emptyText=""
            transitionAction={jobTransitionAction}
          />
        </div>
      ) : null}

      {/* Today + Upcoming — mobile priority */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <JobPanel
          title="Hoy"
          jobs={todaysJobs}
          emptyText="Sin visitas programadas para hoy."
          transitionAction={jobTransitionAction}
        />
        <JobPanel
          title="Próximas visitas"
          jobs={upcomingJobs}
          emptyText="Sin visitas próximas."
          transitionAction={jobTransitionAction}
        />
      </div>

      {/* Timeline — desktop-optimized, scrollable on mobile */}
      <SchedulingTimeline
        jobs={jobs.map((job) => ({
          id: job.id,
          title: job.title,
          status: job.status,
          scheduledAt: job.scheduledAt.toISOString(),
          customerName: `${job.property.customer.firstName} ${job.property.customer.lastName}`,
          propertyAddress: `${job.property.street}, ${job.property.city}`,
          yardFront: job.property.yardFront,
          yardBack: job.property.yardBack,
          yardSides: job.property.yardSides,
          jobDifficulty: job.property.jobDifficulty ?? null,
          estimatedDurationMin: job.property.estimatedDurationMin ?? null,
          items: job.items.map((item) => ({
            id: item.id,
            serviceId: item.serviceId,
            serviceName: item.service.name,
            quantity: Number(item.quantity),
          })),
        }))}
        addOnServices={addOnServices.map((s) => ({
          id: s.id,
          name: s.name,
          defaultPrice: s.defaultPrice?.toString() ?? null,
        }))}
        addJobItemAction={addJobItemAction}
        removeJobItemAction={removeJobItemAction}
      />
    </section>
  )
}

type PanelJob = {
  id: string
  title: string
  status: string
  scheduledAt: Date
  property: {
    street: string
    city: string
    customer: { firstName: string; lastName: string }
  }
  assignments: Array<{ employee: { firstName: string; lastName: string } }>
}

/** Which buttons a job shows, mirroring the legal moves in lib/job-lifecycle. */
function movesFor(status: string): Array<{ move: string; label: string; pending: string; className: string }> {
  switch (status) {
    case "SCHEDULED":
      return [
        {
          move: "start",
          label: "Empezar",
          pending: "Empezando…",
          className: "bg-accent text-accent-foreground hover:bg-accent/90",
        },
        {
          move: "cancel",
          label: "Cancelar",
          pending: "Cancelando…",
          className: "border border-foreground/20 text-foreground/65 hover:bg-foreground/5",
        },
      ]
    case "IN_PROGRESS":
      return [
        {
          move: "complete",
          label: "Terminar",
          pending: "Cerrando…",
          className: "bg-emerald-700 text-white hover:bg-emerald-800",
        },
        {
          move: "cancel",
          label: "Cancelar",
          pending: "Cancelando…",
          className: "border border-foreground/20 text-foreground/65 hover:bg-foreground/5",
        },
      ]
    default:
      return []
  }
}

function JobPanel({
  title,
  subtitle,
  jobs,
  emptyText,
  transitionAction,
  tone = "default",
}: {
  title: string
  subtitle?: string
  jobs: PanelJob[]
  emptyText: string
  transitionAction: (formData: FormData) => Promise<void>
  tone?: "default" | "danger"
}) {
  return (
    <div
      className={`rounded-2xl border bg-background ${
        tone === "danger" ? "border-rose-400/40" : "border-foreground/12"
      }`}
    >
      <div className="border-b border-foreground/10 px-4 py-3">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-foreground/50">{subtitle}</p> : null}
      </div>

      {jobs.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-foreground/45">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-foreground/8">
          {jobs.map((job) => {
            const crew = job.assignments.length
              ? job.assignments.map((a) => `${a.employee.firstName} ${a.employee.lastName}`).join(", ")
              : "Sin asignar"
            const style = jobStatus(job.status)
            const moves = movesFor(job.status)

            return (
              <li key={job.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-snug">{job.title}</p>
                  <span className={`shrink-0 ${STATUS_CHIP} ${style.badge}`}>{style.label}</span>
                </div>
                <p className="mt-1 text-xs text-foreground/55">
                  {job.property.customer.firstName} {job.property.customer.lastName}
                </p>
                <p className="text-xs text-foreground/45">{job.property.street}, {job.property.city}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground/50">
                  <span>
                    {new Intl.DateTimeFormat("es-US", {
                      weekday: "short", month: "short", day: "numeric",
                      hour: "numeric", minute: "2-digit",
                    }).format(job.scheduledAt)}
                  </span>
                  <span>{crew}</span>
                </div>

                {moves.length > 0 ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {moves.map((m) => (
                      <form key={m.move} action={transitionAction}>
                        <input type="hidden" name="jobId" value={job.id} />
                        <input type="hidden" name="move" value={m.move} />
                        <SubmitButton
                          pendingLabel={m.pending}
                          aria-label={`${m.label} el trabajo ${job.title}`}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${m.className}`}
                        >
                          {m.label}
                        </SubmitButton>
                      </form>
                    ))}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

import Link from "next/link"
import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { SchedulingTimeline } from "./SchedulingTimeline"

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Programado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
}

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: "border-blue-400/40 bg-blue-50 text-blue-700",
  IN_PROGRESS: "border-amber-400/40 bg-amber-50 text-amber-800",
  COMPLETED: "border-emerald-500/35 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-rose-400/40 bg-rose-50 text-rose-600",
}

function formatDate(dt: Date) {
  return new Intl.DateTimeFormat("es-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(dt)
}

const ic = "w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

export default async function SchedulingPage() {
  async function createAppointmentAction(formData: FormData) {
    "use server"
    const propertyId = String(formData.get("propertyId") ?? "")
    const employeeId = String(formData.get("employeeId") ?? "")
    const title = String(formData.get("title") ?? "").trim()
    const scheduledAtRaw = String(formData.get("scheduledAt") ?? "")
    const quoteIdRaw = String(formData.get("quoteId") ?? "")
    if (!propertyId || !employeeId || !title || !scheduledAtRaw) return
    const scheduledAt = new Date(scheduledAtRaw)
    if (Number.isNaN(scheduledAt.getTime())) return
    const quoteId = quoteIdRaw === "none" ? null : quoteIdRaw
    const job = await prisma.job.create({
      data: { propertyId, quoteId, title, scheduledAt, status: "SCHEDULED" },
      select: { id: true },
    })
    await prisma.jobAssignment.create({ data: { jobId: job.id, employeeId } })
    revalidatePath("/dashboard/scheduling")
  }

  async function addJobItemAction(formData: FormData) {
    "use server"
    const jobId = String(formData.get("jobId") ?? "")
    const serviceId = String(formData.get("serviceId") ?? "")
    const quantity = Math.max(1, Number(formData.get("quantity") ?? 1))
    if (!jobId || !serviceId) return
    const service = await prisma.serviceCatalog.findUnique({
      where: { id: serviceId },
      select: { defaultPrice: true },
    })
    await prisma.jobItem.create({
      data: { jobId, serviceId, quantity, unitPrice: service?.defaultPrice ?? undefined },
    })
    revalidatePath("/dashboard/scheduling")
  }

  async function removeJobItemAction(formData: FormData) {
    "use server"
    const itemId = String(formData.get("itemId") ?? "")
    if (!itemId) return
    await prisma.jobItem.delete({ where: { id: itemId } })
    revalidatePath("/dashboard/scheduling")
  }

  const now = new Date()
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
      where: { status: "APPROVED" },
      include: { customer: { select: { firstName: true, lastName: true } } },
      orderBy: { approvedAt: "desc" },
      take: 150,
    }),
    prisma.serviceCatalog.findMany({
      where: { category: "ADD_ON", active: true },
      select: { id: true, name: true, defaultPrice: true },
      orderBy: { displayOrder: "asc" },
    }),
  ])

  const todaysJobs = jobs.filter((j) => j.scheduledAt <= endOfToday)
  const upcomingJobs = jobs.filter((j) => j.scheduledAt > endOfToday)

  return (
    <section className="mx-auto max-w-7xl text-foreground">
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
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {todaysJobs.length} hoy
          </span>
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {upcomingJobs.length} próximos
          </span>
        </div>
      </div>

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

      {/* Today + Upcoming — mobile priority */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <JobPanel
          title="Hoy"
          jobs={todaysJobs}
          emptyText="Sin visitas programadas para hoy."
        />
        <JobPanel
          title="Próximas visitas"
          jobs={upcomingJobs}
          emptyText="Sin visitas próximas."
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

function JobPanel({
  title,
  jobs,
  emptyText,
}: {
  title: string
  jobs: Array<{
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
  }>
  emptyText: string
}) {
  return (
    <div className="rounded-2xl border border-foreground/12 bg-background">
      <div className="border-b border-foreground/10 px-4 py-3">
        <h2 className="font-display text-base font-semibold">{title}</h2>
      </div>

      {jobs.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-foreground/45">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-foreground/8">
          {jobs.map((job) => {
            const crew = job.assignments.length
              ? job.assignments.map((a) => `${a.employee.firstName} ${a.employee.lastName}`).join(", ")
              : "Sin asignar"
            const badge = STATUS_BADGE[job.status] ?? "border-foreground/20 bg-foreground/8 text-foreground/60"

            return (
              <li key={job.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-snug">{job.title}</p>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge}`}>
                    {STATUS_LABEL[job.status] ?? job.status}
                  </span>
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
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

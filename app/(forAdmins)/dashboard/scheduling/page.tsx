import Link from "next/link"
import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { SchedulingTimeline } from "./SchedulingTimeline"

const statusClasses: Record<string, string> = {
  SCHEDULED: "border-blue-800 bg-blue-700 text-white",
  IN_PROGRESS: "border-amber-700 bg-amber-600 text-white",
  COMPLETED: "border-emerald-800 bg-emerald-700 text-white",
  CANCELLED: "border-rose-800 bg-rose-700 text-white",
}

function formatDate(dt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(dt)
}

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
      data: {
        propertyId,
        quoteId,
        title,
        scheduledAt,
        status: "SCHEDULED",
      },
      select: { id: true },
    })

    await prisma.jobAssignment.create({
      data: {
        jobId: job.id,
        employeeId,
      },
    })

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
      data: {
        jobId,
        serviceId,
        quantity,
        unitPrice: service?.defaultPrice ?? undefined,
      },
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
    where: {
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
    },
    include: {
      property: {
        include: {
          customer: {
            select: { firstName: true, lastName: true },
          },
        },
      },
      assignments: {
        include: {
          employee: {
            select: { firstName: true, lastName: true },
          },
        },
      },
      items: {
        include: {
          service: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 120,
  })

  const [properties, employees, approvedQuotes, addOnServices] = await Promise.all([
    prisma.property.findMany({
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
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
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Operations
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display-family)] text-3xl font-semibold sm:text-4xl">
            Scheduling
          </h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            Plan routes, assign crews, and track upcoming visits from one place.
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-foreground/10 bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display-family)] text-xl font-semibold">
              Quick actions
            </h2>
            <p className="text-sm text-foreground/65">
              Add appointments and connect visits to approved quotes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/estimados" className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5">
              Open quotes
            </Link>
            <Link href="/dashboard/clientes" className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5">
              Open clients
            </Link>
          </div>
        </div>

        <form action={createAppointmentAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label htmlFor="propertyId" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
              Client / Property
            </label>
            <select
              id="propertyId"
              name="propertyId"
              required
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">Select property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.customer.firstName} {p.customer.lastName} · {p.street}, {p.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="employeeId" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
              Assigned employee
            </label>
            <select
              id="employeeId"
              name="employeeId"
              required
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">Assign</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} · {e.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="scheduledAt" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
              Date & time
            </label>
            <input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              required
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="title" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
              Work title
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="Lawn visit"
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <label htmlFor="quoteId" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
              Quote (optional)
            </label>
            <select
              id="quoteId"
              name="quoteId"
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="none">No quote linked</option>
              {approvedQuotes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.customer.firstName} {q.customer.lastName} · Quote #{q.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
            >
              Add appointment
            </button>
          </div>
        </form>
      </section>

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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <JobPanel title="Today’s route" jobs={todaysJobs} emptyText="No visits scheduled for today." />
        <JobPanel title="Upcoming visits" jobs={upcomingJobs} emptyText="No upcoming visits yet." />
      </div>

      <p className="mt-6 text-xs text-foreground/55">
        Current server time: {formatDate(now)}
      </p>
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
    assignments: Array<{
      employee: { firstName: string; lastName: string }
    }>
  }>
  emptyText: string
}) {
  return (
    <section className="rounded-xl border border-foreground/10 bg-background p-4">
      <h2 className="font-[family-name:var(--font-display-family)] text-xl font-semibold">{title}</h2>

      {jobs.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/60">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {jobs.map((job) => {
            const crew = job.assignments.length
              ? job.assignments
                  .map((a) => `${a.employee.firstName} ${a.employee.lastName}`)
                  .join(", ")
              : "Unassigned"

            const statusClass = statusClasses[job.status] ?? "border-zinc-600 bg-zinc-700 text-white"

            return (
              <article key={job.id} className="rounded-lg border border-zinc-600 bg-zinc-800 p-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{job.title}</p>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
                    {job.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/70">
                  {formatDate(job.scheduledAt)} · {job.property.street}, {job.property.city}
                </p>
                <p className="mt-1 text-sm text-foreground/60">
                  {job.property.customer.firstName} {job.property.customer.lastName} · Crew: {crew}
                </p>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import Link from "next/link"

import { ActionBanner } from "@/components/ui/ActionBanner"
import { AssignPlanCustomerPropertyFields } from "@/components/ui/AssignPlanCustomerPropertyFields"
import { SubmitButton } from "@/components/ui/SubmitButton"
import { ActionError, requireAdmin, runAction, withError } from "@/lib/admin-action"
import { recalcQuoteTotals } from "@/lib/app-settings"
import { prisma } from "@/lib/prisma"
import { isQuoteExpired, quoteStatusResolved, STATUS_CHIP } from "@/lib/status-ui"

type PageProps = {
  searchParams?: Promise<{ status?: string; q?: string; error?: string; ok?: string }>
}

const PAGE = "/dashboard/estimados"

function parseStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : ""
}
function parseOptStr(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null
  const s = v.trim()
  return s || null
}

export default async function EstimadosPage({ searchParams }: PageProps) {
  async function createQuoteAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("quotes:write")
    if (!auth.ok) redirect(withError(PAGE, auth.code))

    const result = await runAction(
      auth.user,
      { action: "quote.create", entityType: "Quote" },
      async () => {
        const customerId = parseStr(formData.get("customerId"))
        if (!customerId) throw new ActionError("datos")
        const propertyId = parseOptStr(formData.get("propertyId"))
        if (propertyId) {
          const owned = await prisma.property.findFirst({
            where: { id: propertyId, customerId, archivedAt: null },
            select: { id: true },
          })
          if (!owned) throw new ActionError("no_encontrado")
        }
        const validUntilRaw = parseOptStr(formData.get("validUntil"))
        const createdQuote = await prisma.quote.create({
          data: {
            customerId,
            propertyId,
            status: "DRAFT",
            notes: parseOptStr(formData.get("notes")),
            validUntil: validUntilRaw ? new Date(validUntilRaw) : null,
          },
          select: { id: true },
        })
        await recalcQuoteTotals(createdQuote.id)
      }
    )
    if (!result.ok) redirect(withError(PAGE, result.code))
    revalidatePath(PAGE)
  }

  const params = (await searchParams) ?? {}
  const statusFilter = params.status ?? "ALL"
  const queryRaw = typeof params.q === "string" ? params.q.trim() : ""
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  // Status/search filtering runs in Prisma. The previous version pulled the most
  // recent 200 quotes and filtered them in JS, so with 201+ quotes the counts
  // disagreed with the database and search could not reach older records.
  const archiveWhere = { archivedAt: null }
  const statusWhere =
    statusFilter === "EXPIRED"
      ? { status: "SENT" as const, validUntil: { lt: startOfToday } }
      : statusFilter !== "ALL"
        ? { status: statusFilter as "DRAFT" | "SENT" | "APPROVED" | "REJECTED" }
        : {}
  const searchWhere = queryRaw
    ? {
        OR: [
          { customer: { firstName: { contains: queryRaw, mode: "insensitive" as const } } },
          { customer: { lastName: { contains: queryRaw, mode: "insensitive" as const } } },
          { id: { contains: queryRaw } },
        ],
      }
    : {}
  const where = { ...archiveWhere, ...statusWhere, ...searchWhere }

  const [
    filteredQuotes,
    matchingCount,
    totalCount,
    draftCount,
    sentCount,
    approvedCount,
    expiredCount,
    approvedAgg,
    customers,
  ] = await Promise.all([
    prisma.quote.findMany({
      where,
      include: {
        customer: { select: { firstName: true, lastName: true } },
        property: { select: { street: true, city: true } },
        items: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.quote.count({ where }),
    prisma.quote.count({ where: archiveWhere }),
    prisma.quote.count({ where: { ...archiveWhere, status: "DRAFT" } }),
    prisma.quote.count({ where: { ...archiveWhere, status: "SENT" } }),
    prisma.quote.count({ where: { ...archiveWhere, status: "APPROVED" } }),
    prisma.quote.count({
      where: { ...archiveWhere, status: "SENT", validUntil: { lt: startOfToday } },
    }),
    prisma.quote.aggregate({
      where: { ...archiveWhere, status: "APPROVED" },
      _sum: { total: true },
    }),
    prisma.customer.findMany({
      where: { isActive: true, archivedAt: null },
      include: {
        properties: {
          where: { archivedAt: null },
          select: { id: true, label: true, street: true, city: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 300,
    }),
  ])

  const totalRevenue = Number(approvedAgg._sum.total ?? 0)

  const customerOptions = customers.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    properties: c.properties,
  }))

  const ic =
    "rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

  const STATUS_OPTIONS = ["ALL", "DRAFT", "SENT", "EXPIRED", "APPROVED", "REJECTED"] as const
  const STATUS_LABELS: Record<string, string> = {
    ALL: "Todos",
    DRAFT: "Borrador",
    SENT: "Enviado",
    EXPIRED: "Vencido",
    APPROVED: "Aprobado",
    REJECTED: "Rechazado",
  }
  const STATUS_COUNTS: Record<string, number> = {
    ALL: totalCount,
    DRAFT: draftCount,
    SENT: sentCount,
    EXPIRED: expiredCount,
    APPROVED: approvedCount,
  }

  return (
    <section className="text-foreground">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
            Estimados
          </h1>
          <p className="mt-2 text-sm text-foreground/55">
            Flujo mobile-first tipo iOS: abre cada estimado en su propia pantalla.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {totalCount} estimados
          </span>
          {sentCount > 0 ? (
            <span className="rounded-full border border-blue-400/30 bg-blue-50/60 px-3 py-1 text-blue-700">
              {sentCount} enviados
            </span>
          ) : null}
          {expiredCount > 0 ? (
            <span className="rounded-full border border-orange-400/40 bg-orange-50 px-3 py-1 font-semibold text-orange-700">
              {expiredCount} vencidos
            </span>
          ) : null}
          {approvedCount > 0 ? (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-50/60 px-3 py-1 font-semibold text-emerald-700">
              ${totalRevenue.toFixed(2)} aprobado
            </span>
          ) : null}
        </div>
      </div>

      <ActionBanner error={params.error} notice={params.ok} />

      <div className="mt-6 rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5">
        <p className="mb-3 text-sm font-semibold text-foreground/80">Nuevo estimado</p>
        <form action={createQuoteAction} className="grid gap-3 md:grid-cols-2">
          <AssignPlanCustomerPropertyFields customers={customerOptions} ic={ic} lbl={lbl} />
          <label className="grid gap-1">
            <span className={lbl}>Valido hasta</span>
            <input name="validUntil" type="date" className={ic} />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Notas</span>
            <input name="notes" placeholder="Notas internas…" className={ic} />
          </label>
          <SubmitButton
            pendingLabel="Creando…"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 md:col-span-2"
          >
            Crear estimado
          </SubmitButton>
        </form>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = statusFilter === opt
              const href = opt === "ALL" ? PAGE : `${PAGE}?status=${opt}`
              const count = STATUS_COUNTS[opt] ?? null
              return (
                <Link
                  key={opt}
                  href={href}
                  className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "border-accent/60 bg-accent/20 text-accent"
                      : opt === "EXPIRED" && expiredCount > 0
                        ? "border-orange-400/45 text-orange-700 hover:bg-orange-50"
                        : "border-foreground/20 text-foreground/60 hover:bg-foreground/5"
                  }`}
                >
                  {STATUS_LABELS[opt]}
                  {count !== null && count > 0 ? ` (${count})` : ""}
                </Link>
              )
            })}
          </div>

          <form method="get" className="flex w-full items-center gap-2 sm:w-auto">
            {statusFilter !== "ALL" ? <input type="hidden" name="status" value={statusFilter} /> : null}
            <input
              name="q"
              type="search"
              defaultValue={queryRaw}
              placeholder="Buscar por cliente o ID…"
              className={`w-full sm:w-60 ${ic}`}
              autoComplete="off"
            />
            <button
              type="submit"
              className="rounded-xl border border-foreground/20 px-3 py-2 text-sm hover:bg-foreground/5"
            >
              Buscar
            </button>
            {queryRaw ? (
              <Link
                href={statusFilter !== "ALL" ? `/dashboard/estimados?status=${statusFilter}` : "/dashboard/estimados"}
                className="text-sm text-foreground/55 underline-offset-2 hover:text-foreground hover:underline"
              >
                Limpiar
              </Link>
            ) : null}
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-foreground/12 bg-background">
          {filteredQuotes.length === 0 ? (
            <div className="px-5 py-12 text-center">
              {totalCount === 0 ? (
                <>
                  <p className="font-display text-lg font-semibold text-foreground/40">
                    No hay estimados todavia
                  </p>
                  <p className="mt-1 text-sm text-foreground/35">
                    Crea el primero desde el formulario de arriba.
                  </p>
                </>
              ) : (
                <p className="font-medium text-foreground/60">
                  Sin resultados para los filtros aplicados
                </p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-foreground/10">
              {filteredQuotes.map((quote) => {
                const customerName = `${quote.customer.firstName} ${quote.customer.lastName}`
                const propertyAddress = quote.property
                  ? `${quote.property.street}, ${quote.property.city}`
                  : "Sin propiedad"
                const style = quoteStatusResolved(quote.status, quote.validUntil, now)
                const expired = isQuoteExpired(quote.status, quote.validUntil, now)
                return (
                  <li key={quote.id} className="px-4 py-3.5 sm:px-5">
                    <Link
                      href={`/dashboard/estimados/${quote.id}`}
                      className="block rounded-xl p-1 transition hover:bg-foreground/3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold">{customerName}</p>
                          <p className="truncate text-sm text-foreground/55">{propertyAddress}</p>
                        </div>
                        <span className="tabular-nums text-sm font-semibold">
                          {Number(quote.total) > 0 ? `$${Number(quote.total).toFixed(2)}` : "—"}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`${STATUS_CHIP} ${style.badge}`}>{style.label}</span>
                          {expired && quote.validUntil ? (
                            <span className="text-xs text-orange-700">
                              venció el{" "}
                              {quote.validUntil.toLocaleDateString("es-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          ) : null}
                          <span className="text-xs text-foreground/45">
                            {quote.items.length} linea{quote.items.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <span className="text-xs text-foreground/45">
                          {quote.createdAt.toLocaleDateString("es-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

import { revalidatePath } from "next/cache"
import Link from "next/link"

import { AssignPlanCustomerPropertyFields } from "@/components/ui/AssignPlanCustomerPropertyFields"
import { prisma } from "@/lib/prisma"

type PageProps = {
  searchParams?: Promise<{ status?: string; q?: string }>
}

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
    const customerId = parseStr(formData.get("customerId"))
    if (!customerId) return
    const validUntilRaw = parseOptStr(formData.get("validUntil"))
    await prisma.quote.create({
      data: {
        customerId,
        propertyId: parseOptStr(formData.get("propertyId")),
        status: "DRAFT",
        notes: parseOptStr(formData.get("notes")),
        validUntil: validUntilRaw ? new Date(validUntilRaw) : null,
      },
    })
    revalidatePath("/dashboard/estimados")
  }

  const params = (await searchParams) ?? {}
  const statusFilter = params.status ?? "ALL"
  const queryRaw = typeof params.q === "string" ? params.q.trim() : ""
  const queryLower = queryRaw.toLowerCase()

  const [quotes, customers] = await Promise.all([
    prisma.quote.findMany({
      include: {
        customer: { select: { firstName: true, lastName: true } },
        property: { select: { street: true, city: true } },
        items: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.customer.findMany({
      where: { isActive: true },
      include: {
        properties: {
          select: { id: true, label: true, street: true, city: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 300,
    }),
  ])

  const filteredQuotes = quotes.filter((q) => {
    if (statusFilter !== "ALL" && q.status !== statusFilter) return false
    if (queryLower) {
      const name = `${q.customer.firstName} ${q.customer.lastName}`.toLowerCase()
      if (!name.includes(queryLower) && !q.id.includes(queryLower)) return false
    }
    return true
  })

  const draftCount = quotes.filter((q) => q.status === "DRAFT").length
  const sentCount = quotes.filter((q) => q.status === "SENT").length
  const approvedCount = quotes.filter((q) => q.status === "APPROVED").length
  const totalRevenue = quotes
    .filter((q) => q.status === "APPROVED")
    .reduce((acc, q) => acc + Number(q.total), 0)

  const customerOptions = customers.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    properties: c.properties,
  }))

  const ic =
    "rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

  const statusLabel = (s: string) =>
    ({ DRAFT: "Borrador", SENT: "Enviado", APPROVED: "Aprobado", REJECTED: "Rechazado" }[s] ??
      s)

  const statusBadge = (s: string) =>
    ({
      DRAFT: "border-foreground/20 bg-foreground/8 text-foreground/60",
      SENT: "border-blue-400/40 bg-blue-50 text-blue-700",
      APPROVED: "border-emerald-500/40 bg-emerald-50 text-emerald-700",
      REJECTED: "border-rose-400/40 bg-rose-50 text-rose-600",
    }[s] ?? "border-foreground/20 bg-foreground/8 text-foreground/60")

  const STATUS_OPTIONS = ["ALL", "DRAFT", "SENT", "APPROVED", "REJECTED"] as const

  return (
    <section className="mx-auto max-w-4xl text-foreground">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin</p>
          <h1 className="mt-1 font-(family-name:--font-display-family) text-3xl font-semibold sm:text-4xl">
            Estimados
          </h1>
          <p className="mt-2 text-sm text-foreground/55">
            Flujo mobile-first tipo iOS: abre cada estimado en su propia pantalla.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {quotes.length} estimados
          </span>
          {sentCount > 0 ? (
            <span className="rounded-full border border-blue-400/30 bg-blue-50/60 px-3 py-1 text-blue-700">
              {sentCount} enviados
            </span>
          ) : null}
          {approvedCount > 0 ? (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-50/60 px-3 py-1 font-semibold text-emerald-700">
              ${totalRevenue.toFixed(2)} aprobado
            </span>
          ) : null}
        </div>
      </div>

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
          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 md:col-span-2"
          >
            Crear estimado
          </button>
        </form>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = statusFilter === opt
              const href = opt === "ALL" ? "/dashboard/estimados" : `/dashboard/estimados?status=${opt}`
              const count =
                opt === "DRAFT"
                  ? draftCount
                  : opt === "SENT"
                    ? sentCount
                    : opt === "APPROVED"
                      ? approvedCount
                      : opt === "ALL"
                        ? quotes.length
                        : null
              return (
                <Link
                  key={opt}
                  href={href}
                  className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "border-accent/60 bg-accent/20 text-accent"
                      : "border-foreground/20 text-foreground/60 hover:bg-foreground/5"
                  }`}
                >
                  {opt === "ALL" ? "Todos" : statusLabel(opt)}
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
              {quotes.length === 0 ? (
                <>
                  <p className="font-(family-name:--font-display-family) text-lg font-semibold text-foreground/40">
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
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge(quote.status)}`}
                          >
                            {statusLabel(quote.status)}
                          </span>
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

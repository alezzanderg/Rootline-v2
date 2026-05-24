import { revalidatePath } from "next/cache"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { EditDialog } from "@/components/ui/EditDialog"
import { QuoteDialog } from "@/components/ui/QuoteDialog"
import { AssignPlanCustomerPropertyFields } from "@/components/ui/AssignPlanCustomerPropertyFields"

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
function parseOptFloat(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null
  const n = parseFloat(v.trim())
  return Number.isFinite(n) ? n : null
}

export default async function EstimadosPage({ searchParams }: PageProps) {

  // ── Server Actions ──────────────────────────────────────────────────────

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

  async function updateQuoteAction(formData: FormData) {
    "use server"
    const id = parseStr(formData.get("id"))
    if (!id) return
    const validUntilRaw = parseOptStr(formData.get("validUntil"))
    await prisma.quote.update({
      where: { id },
      data: {
        notes: parseOptStr(formData.get("notes")),
        validUntil: validUntilRaw ? new Date(validUntilRaw) : null,
      },
    })
    revalidatePath("/dashboard/estimados")
  }

  async function deleteQuoteAction(formData: FormData) {
    "use server"
    const id = parseStr(formData.get("id"))
    const confirmed = formData.get("confirmDelete") === "on"
    if (!id || !confirmed) return
    await prisma.quote.delete({ where: { id } })
    revalidatePath("/dashboard/estimados")
  }

  async function addQuoteItemAction(formData: FormData) {
    "use server"
    const quoteId = parseStr(formData.get("quoteId"))
    const serviceId = parseStr(formData.get("serviceId"))
    const quantity = parseOptFloat(formData.get("quantity")) ?? 1
    const unitPrice = parseOptFloat(formData.get("unitPrice"))
    if (!quoteId || !serviceId || unitPrice === null) return

    await prisma.quoteItem.create({
      data: {
        quoteId,
        serviceId,
        quantity,
        unitPrice,
        lineTotal: quantity * unitPrice,
        description: parseOptStr(formData.get("description")),
      },
    })

    const allItems = await prisma.quoteItem.findMany({ where: { quoteId } })
    const subtotal = allItems.reduce((acc, item) => acc + Number(item.lineTotal), 0)
    await prisma.quote.update({ where: { id: quoteId }, data: { subtotal, total: subtotal } })

    revalidatePath("/dashboard/estimados")
  }

  async function removeQuoteItemAction(formData: FormData) {
    "use server"
    const itemId = parseStr(formData.get("itemId"))
    const quoteId = parseStr(formData.get("quoteId"))
    if (!itemId || !quoteId) return

    await prisma.quoteItem.delete({ where: { id: itemId } })

    const allItems = await prisma.quoteItem.findMany({ where: { quoteId } })
    const subtotal = allItems.reduce((acc, item) => acc + Number(item.lineTotal), 0)
    await prisma.quote.update({ where: { id: quoteId }, data: { subtotal, total: subtotal } })

    revalidatePath("/dashboard/estimados")
  }

  async function changeQuoteStatusAction(formData: FormData) {
    "use server"
    const quoteId = parseStr(formData.get("quoteId"))
    const status = parseStr(formData.get("status"))
    if (!quoteId || !["SENT", "APPROVED", "REJECTED"].includes(status)) return

    const now = new Date()
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: status as "SENT" | "APPROVED" | "REJECTED",
        ...(status === "SENT" && { sentAt: now }),
        ...(status === "APPROVED" && { approvedAt: now }),
        ...(status === "REJECTED" && { rejectedAt: now }),
      },
    })

    revalidatePath("/dashboard/estimados")
    if (status === "APPROVED") revalidatePath("/dashboard/scheduling")
  }

  // ── Data ───────────────────────────────────────────────────────────────

  const params = (await searchParams) ?? {}
  const statusFilter = params.status ?? "ALL"
  const queryRaw = typeof params.q === "string" ? params.q.trim() : ""
  const queryLower = queryRaw.toLowerCase()

  const [quotes, customers, services] = await Promise.all([
    prisma.quote.findMany({
      include: {
        customer: { select: { firstName: true, lastName: true } },
        property: { select: { street: true, city: true } },
        items: {
          include: { service: { select: { name: true } } },
          orderBy: { id: "asc" },
        },
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
    prisma.serviceCatalog.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, defaultPrice: true, startingAtPrice: true },
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

  const serviceOptions = services.map((s) => ({
    id: s.id,
    name: s.name,
    defaultPrice: s.defaultPrice?.toString() ?? null,
    startingAtPrice: s.startingAtPrice?.toString() ?? null,
  }))

  const ic = "rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

  const statusLabel = (s: string) =>
    ({ DRAFT: "Borrador", SENT: "Enviado", APPROVED: "Aprobado", REJECTED: "Rechazado" }[s] ?? s)

  const statusBadge = (s: string) =>
    ({
      DRAFT: "border-foreground/20 bg-foreground/8 text-foreground/60",
      SENT: "border-blue-400/40 bg-blue-50 text-blue-700",
      APPROVED: "border-emerald-500/40 bg-emerald-50 text-emerald-700",
      REJECTED: "border-rose-400/40 bg-rose-50 text-rose-600",
    }[s] ?? "border-foreground/20 bg-foreground/8 text-foreground/60")

  const STATUS_OPTIONS = ["ALL", "DRAFT", "SENT", "APPROVED", "REJECTED"] as const

  return (
    <section className="mx-auto max-w-7xl text-foreground">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin</p>
          <h1 className="mt-1 font-(family-name:--font-display-family) text-3xl font-semibold sm:text-4xl">
            Estimados
          </h1>
          <p className="mt-2 text-sm text-foreground/55">
            Crea, envía y da seguimiento a estimados: borrador, enviado, aprobado o rechazado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {quotes.length} estimados
          </span>
          {sentCount > 0 && (
            <span className="rounded-full border border-blue-400/30 bg-blue-50/60 px-3 py-1 text-blue-700">
              {sentCount} enviado{sentCount !== 1 ? "s" : ""}
            </span>
          )}
          {approvedCount > 0 && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-50/60 px-3 py-1 font-semibold text-emerald-700">
              ${totalRevenue.toFixed(2)} aprobado
            </span>
          )}
        </div>
      </div>

      {/* ── NEW QUOTE ─────────────────────────────────────────────────────── */}
      <div className="mt-6">
        <EditDialog
          label="+ Nuevo estimado"
          action={createQuoteAction}
          triggerClassName="inline-flex cursor-pointer select-none items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <AssignPlanCustomerPropertyFields customers={customerOptions} ic={ic} lbl={lbl} />
            <label className="grid gap-1">
              <span className={lbl}>Válido hasta</span>
              <input name="validUntil" type="date" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Notas</span>
              <input name="notes" placeholder="Notas internas…" className={ic} />
            </label>
            <p className="text-xs text-foreground/45 md:col-span-2">
              El estimado se crea como borrador. Ábrelo para agregar servicios y cambiar el estado.
            </p>
            <button
              type="submit"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 md:col-span-2"
            >
              Crear estimado
            </button>
          </div>
        </EditDialog>
      </div>

      {/* ── FILTERS + TABLE ───────────────────────────────────────────────── */}
      <div className="mt-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = statusFilter === opt
              const href =
                opt === "ALL"
                  ? "/dashboard/estimados"
                  : `/dashboard/estimados?status=${opt}`
              const count =
                opt === "DRAFT" ? draftCount
                : opt === "SENT" ? sentCount
                : opt === "APPROVED" ? approvedCount
                : opt === "ALL" ? quotes.length
                : null
              return (
                <Link
                  key={opt}
                  href={href}
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                    isActive
                      ? "border-accent/60 bg-accent/20 text-accent"
                      : "border-foreground/20 text-foreground/60 hover:bg-foreground/5"
                  }`}
                >
                  {opt === "ALL" ? "Todos" : statusLabel(opt)}
                  {count !== null && count > 0 && ` (${count})`}
                </Link>
              )
            })}
          </div>

          {/* Search */}
          <form method="get" className="flex items-center gap-2">
            {statusFilter !== "ALL" && (
              <input type="hidden" name="status" value={statusFilter} />
            )}
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
              className="rounded-md border border-foreground/20 px-3 py-2 text-sm hover:bg-foreground/5"
            >
              Buscar
            </button>
            {queryRaw && (
              <Link
                href={
                  statusFilter !== "ALL"
                    ? `/dashboard/estimados?status=${statusFilter}`
                    : "/dashboard/estimados"
                }
                className="text-sm text-foreground/55 underline-offset-2 hover:text-foreground hover:underline"
              >
                Limpiar
              </Link>
            )}
          </form>
        </div>

        {queryRaw && (
          <p className="text-sm text-foreground/55">
            Mostrando{" "}
            <span className="font-semibold text-foreground/80">{filteredQuotes.length}</span> de{" "}
            <span className="font-semibold text-foreground/80">{quotes.length}</span>
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-foreground/12">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <caption className="sr-only">Listado de estimados</caption>
              <thead>
                <tr className="border-b border-foreground/10 bg-foreground/4">
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">#</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Cliente</th>
                  <th className="hidden px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45 md:table-cell">Propiedad</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Estado</th>
                  <th className="hidden px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-foreground/45 md:table-cell">Líneas</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Total</th>
                  <th className="hidden px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45 lg:table-cell">Fecha</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      {quotes.length === 0 ? (
                        <>
                          <p className="font-(family-name:--font-display-family) text-lg font-semibold text-foreground/40">
                            No hay estimados todavía
                          </p>
                          <p className="mt-1 text-sm text-foreground/35">
                            Usa el botón de arriba para crear el primero.
                          </p>
                        </>
                      ) : (
                        <p className="font-medium text-foreground/60">
                          Sin resultados para los filtros aplicados
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((quote) => {
                    const customerName = `${quote.customer.firstName} ${quote.customer.lastName}`
                    const propertyAddress = quote.property
                      ? `${quote.property.street}, ${quote.property.city}`
                      : null

                    return (
                      <tr key={quote.id} className="border-b border-foreground/8 last:border-b-0">
                        <td className="px-4 py-3 align-middle">
                          <span className="font-mono text-xs text-foreground/45">
                            #{quote.id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="max-w-[160px] px-4 py-3 align-middle">
                          <p className="truncate font-semibold">{customerName}</p>
                        </td>
                        <td className="hidden max-w-[200px] px-4 py-3 align-middle md:table-cell">
                          <p className="truncate text-sm text-foreground/55">
                            {propertyAddress ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge(quote.status)}`}
                          >
                            {statusLabel(quote.status)}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-center align-middle tabular-nums text-foreground/60 md:table-cell">
                          {quote.items.length}
                        </td>
                        <td className="px-4 py-3 text-right align-middle">
                          <span className="tabular-nums font-semibold">
                            {Number(quote.total) > 0
                              ? `$${Number(quote.total).toFixed(2)}`
                              : <span className="text-foreground/30">—</span>}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 align-middle text-sm text-foreground/50 lg:table-cell">
                          {quote.createdAt.toLocaleDateString("es-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <QuoteDialog
                              quoteId={quote.id}
                              quoteStatus={quote.status}
                              customerName={customerName}
                              propertyAddress={propertyAddress}
                              subtotal={quote.subtotal.toString()}
                              tax={quote.tax.toString()}
                              total={quote.total.toString()}
                              notes={quote.notes}
                              validUntil={quote.validUntil?.toISOString() ?? null}
                              items={quote.items.map((item) => ({
                                id: item.id,
                                serviceId: item.serviceId,
                                serviceName: item.service.name,
                                quantity: item.quantity.toString(),
                                unitPrice: item.unitPrice.toString(),
                                lineTotal: item.lineTotal.toString(),
                                description: item.description,
                              }))}
                              services={serviceOptions}
                              addItemAction={addQuoteItemAction}
                              removeItemAction={removeQuoteItemAction}
                              changeStatusAction={changeQuoteStatusAction}
                            />
                            {quote.status === "DRAFT" && (
                              <EditDialog
                                label="Editar"
                                action={updateQuoteAction}
                                triggerClassName="rounded-md border border-foreground/15 px-2 py-1 text-xs font-medium text-foreground/55 transition hover:bg-foreground/6 hover:text-foreground/80"
                              >
                                <input type="hidden" name="id" value={quote.id} />
                                <div className="grid gap-3">
                                  <label className="grid gap-1">
                                    <span className={lbl}>Válido hasta</span>
                                    <input
                                      name="validUntil"
                                      type="date"
                                      defaultValue={
                                        quote.validUntil
                                          ? quote.validUntil.toISOString().slice(0, 10)
                                          : ""
                                      }
                                      className={ic}
                                    />
                                  </label>
                                  <label className="grid gap-1">
                                    <span className={lbl}>Notas</span>
                                    <input
                                      name="notes"
                                      defaultValue={quote.notes ?? ""}
                                      className={ic}
                                    />
                                  </label>
                                  <button
                                    type="submit"
                                    className="rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background transition hover:bg-foreground/85"
                                  >
                                    Guardar cambios
                                  </button>
                                </div>
                              </EditDialog>
                            )}
                            {quote.status === "DRAFT" && (
                              <details className="relative">
                                <summary className="cursor-pointer list-none rounded-md border border-foreground/15 px-2 py-1 text-xs font-medium text-foreground/55 transition hover:bg-foreground/6">
                                  ···
                                </summary>
                                <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-foreground/12 bg-[#fdfcf8] p-1.5 shadow-xl">
                                  <form action={deleteQuoteAction}>
                                    <input type="hidden" name="id" value={quote.id} />
                                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs text-foreground/50 transition hover:bg-foreground/5">
                                      <input type="checkbox" name="confirmDelete" />
                                      Confirmar eliminación
                                    </label>
                                    <button
                                      type="submit"
                                      className="mt-0.5 w-full rounded-md px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                                    >
                                      Eliminar
                                    </button>
                                  </form>
                                </div>
                              </details>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

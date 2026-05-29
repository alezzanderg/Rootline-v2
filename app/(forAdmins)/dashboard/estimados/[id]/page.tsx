import { revalidatePath } from "next/cache"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { EstimadoQuoteServices, type EstimadoServiceOption } from "@/components/ui/EstimadoQuoteServices"
import { getTaxRatePercent, recalcQuoteTotals } from "@/lib/app-settings"
import { prisma } from "@/lib/prisma"
import { serviceCatalogPricingProps } from "@/lib/servicios-catalog-form"
import { QUOTE_FREQUENCY_LABEL, SERVICE_CATEGORY_LABEL } from "@/lib/quote-labels"
import { inferPlanTierFromLotSqFt, PLAN_TIER_LABEL, type PlanTier } from "@/lib/service-pricing"

type Props = {
  params: Promise<{ id: string }>
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

export default async function EstimadoDetailPage({ params }: Props) {
  const { id } = await params

  async function updateQuoteAction(formData: FormData) {
    "use server"
    const quoteId = parseStr(formData.get("id"))
    if (!quoteId) return
    const validUntilRaw = parseOptStr(formData.get("validUntil"))
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        notes: parseOptStr(formData.get("notes")),
        validUntil: validUntilRaw ? new Date(validUntilRaw) : null,
      },
    })
    revalidatePath(`/dashboard/estimados/${quoteId}`)
    revalidatePath("/dashboard/estimados")
  }

  async function updateFrequencyAction(formData: FormData) {
    "use server"
    const quoteId = parseStr(formData.get("quoteId"))
    const raw = parseStr(formData.get("serviceFrequency"))
    const serviceFrequency =
      raw === "WEEKLY" || raw === "BIWEEKLY" || raw === "ONE_TIME" ? raw : "ONE_TIME"
    if (!quoteId) return
    await prisma.quote.update({
      where: { id: quoteId },
      data: { serviceFrequency },
    })
    revalidatePath(`/dashboard/estimados/${quoteId}`)
    revalidatePath("/dashboard/estimados")
  }

  async function updatePlanTierAction(formData: FormData) {
    "use server"
    const quoteId = parseStr(formData.get("quoteId"))
    const raw = parseStr(formData.get("planTier"))
    const planTier = raw === "SMALL" || raw === "MEDIUM" || raw === "LARGE" ? raw : null
    if (!quoteId) return
    await prisma.quote.update({
      where: { id: quoteId },
      data: { planTier },
    })
    revalidatePath(`/dashboard/estimados/${quoteId}`)
    revalidatePath("/dashboard/estimados")
  }

  async function addItemAction(formData: FormData) {
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

    await recalcQuoteTotals(quoteId)

    revalidatePath(`/dashboard/estimados/${quoteId}`)
    revalidatePath("/dashboard/estimados")
  }

  async function removeItemAction(formData: FormData) {
    "use server"
    const quoteId = parseStr(formData.get("quoteId"))
    const itemId = parseStr(formData.get("itemId"))
    if (!quoteId || !itemId) return

    await prisma.quoteItem.delete({ where: { id: itemId } })
    await recalcQuoteTotals(quoteId)

    revalidatePath(`/dashboard/estimados/${quoteId}`)
    revalidatePath("/dashboard/estimados")
  }

  async function changeStatusAction(formData: FormData) {
    "use server"
    const quoteId = parseStr(formData.get("quoteId"))
    const status = parseStr(formData.get("status"))
    if (!quoteId || !["SENT", "APPROVED", "REJECTED", "DRAFT"].includes(status)) return

    const now = new Date()
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: status as "DRAFT" | "SENT" | "APPROVED" | "REJECTED",
        sentAt: status === "SENT" ? now : null,
        approvedAt: status === "APPROVED" ? now : null,
        rejectedAt: status === "REJECTED" ? now : null,
      },
    })
    revalidatePath(`/dashboard/estimados/${quoteId}`)
    revalidatePath("/dashboard/estimados")
    if (status === "APPROVED") revalidatePath("/dashboard/scheduling")
  }

  async function deleteQuoteAction(formData: FormData) {
    "use server"
    const quoteId = parseStr(formData.get("id"))
    const confirm = formData.get("confirmDelete") === "on"
    if (!quoteId || !confirm) return
    await prisma.quote.delete({ where: { id: quoteId } })
    revalidatePath("/dashboard/estimados")
    redirect("/dashboard/estimados")
  }

  const [quote, services, taxRatePercent] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        property: { select: { street: true, city: true, lotSizeSqFt: true } },
        items: {
          include: { service: { select: { id: true, name: true, category: true } } },
          orderBy: { id: "asc" },
        },
      },
    }),
    prisma.serviceCatalog.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        category: true,
        pricingUnit: true,
        defaultPrice: true,
        smallPrice: true,
        mediumPrice: true,
        largePrice: true,
        biweeklySmallPrice: true,
        biweeklyMediumPrice: true,
        biweeklyLargePrice: true,
        oneTimeSmallPrice: true,
        oneTimeMediumPrice: true,
        oneTimeLargePrice: true,
        startingAtPrice: true,
        maxRangePrice: true,
        biweeklyStartingAtPrice: true,
        oneTimeStartingAtPrice: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    getTaxRatePercent(),
  ])

  if (!quote) notFound()

  const statusLabel = (s: string) =>
    ({ DRAFT: "Borrador", SENT: "Enviado", APPROVED: "Aprobado", REJECTED: "Rechazado" }[s] ?? s)
  const statusBadge = (s: string) =>
    ({
      DRAFT: "border-foreground/20 bg-foreground/8 text-foreground/60",
      SENT: "border-blue-400/40 bg-blue-50 text-blue-700",
      APPROVED: "border-emerald-500/40 bg-emerald-50 text-emerald-700",
      REJECTED: "border-rose-400/40 bg-rose-50 text-rose-600",
    }[s] ?? "border-foreground/20 bg-foreground/8 text-foreground/60")

  const ic =
    "rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

  const customerName = `${quote.customer.firstName} ${quote.customer.lastName}`
  const propertyAddress = quote.property ? `${quote.property.street}, ${quote.property.city}` : "Sin propiedad"
  const frequency = quote.serviceFrequency ?? "ONE_TIME"
  const inferredTier = inferPlanTierFromLotSqFt(quote.property?.lotSizeSqFt ?? null)
  const planTier: PlanTier =
    quote.planTier === "SMALL" || quote.planTier === "MEDIUM" || quote.planTier === "LARGE"
      ? quote.planTier
      : inferredTier ?? "MEDIUM"

  const toServiceOption = (s: (typeof services)[number]): EstimadoServiceOption => {
    const props = serviceCatalogPricingProps(s)
    const { pricingUnit, ...pricing } = props
    return {
      id: s.id,
      name: s.name,
      category: s.category,
      pricingUnit: pricingUnit ?? null,
      pricing: { ...pricing, defaultPrice: s.defaultPrice != null ? Number(s.defaultPrice) : null },
    }
  }

  const coreServices = services.filter((s) => s.category !== "ADD_ON").map(toServiceOption)
  const addonServices = services.filter((s) => s.category === "ADD_ON").map(toServiceOption)

  return (
    <section className="mx-auto max-w-5xl text-foreground">
      <div className="mb-4">
        <Link href="/dashboard/estimados" className="text-sm text-foreground/55 hover:text-foreground">
          ← Volver a estimados
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-foreground/12 bg-background p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">{customerName}</h1>
            <p className="text-sm text-foreground/55">{propertyAddress}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xs text-foreground/50">
                <span className="font-semibold text-foreground/70">{QUOTE_FREQUENCY_LABEL[frequency] ?? frequency}</span>
                {" · "}
                <span className="font-semibold text-foreground/70">{PLAN_TIER_LABEL[planTier]}</span>
              </span>
              <span className="font-mono text-xs text-foreground/35">#{quote.id.slice(0, 8)}</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right">
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge(quote.status)}`}
              >
                {statusLabel(quote.status)}
              </span>
              <p className="mt-1.5 text-2xl font-bold tabular-nums">${Number(quote.total).toFixed(2)}</p>
              <p className="text-[11px] text-foreground/40 tabular-nums">
                Sub ${Number(quote.subtotal).toFixed(2)} · Tax ${Number(quote.tax).toFixed(2)}
              </p>
            </div>
            <details className="relative">
              <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg border border-foreground/20 text-sm text-foreground/60 transition hover:bg-foreground/5">
                ⋯
              </summary>
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-foreground/12 bg-[#fdfcf8] p-2 shadow-lg">
                <form action={deleteQuoteAction}>
                  <input type="hidden" name="id" value={quote.id} />
                  <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground/60 hover:bg-foreground/5">
                    <input type="checkbox" name="confirmDelete" />
                    Confirmar eliminación
                  </label>
                  <button
                    type="submit"
                    className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    Eliminar estimado
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_284px]">

        {/* Left: services + line items */}
        <div className="space-y-4">
          <EstimadoQuoteServices
            quoteId={quote.id}
            initialFrequency={frequency}
            initialPlanTier={planTier}
            coreServices={coreServices}
            addonServices={addonServices}
            updateFrequencyAction={updateFrequencyAction}
            updatePlanTierAction={updatePlanTierAction}
            addItemAction={addItemAction}
          />

          {/* Line items */}
          <div className="rounded-2xl border border-foreground/12 bg-background">
            <div className="border-b border-foreground/10 px-4 py-3 text-sm font-semibold">
              Líneas del estimado
            </div>
            {quote.items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-foreground/45">Aún no tiene líneas.</p>
            ) : (
              <ul className="divide-y divide-foreground/8">
                {quote.items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{item.service.name}</p>
                        <span
                          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                            item.service.category === "ADD_ON"
                              ? "border-violet-300/40 bg-violet-50/80 text-violet-700"
                              : "border-foreground/15 bg-foreground/5 text-foreground/55"
                          }`}
                        >
                          {SERVICE_CATEGORY_LABEL[item.service.category] ?? item.service.category}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/50">
                        {Number(item.quantity)} × ${Number(item.unitPrice).toFixed(2)}
                      </p>
                      {item.description ? (
                        <p className="mt-1 text-xs text-foreground/45">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums text-sm font-semibold">${Number(item.lineTotal).toFixed(2)}</p>
                      <form action={removeItemAction} className="mt-1">
                        <input type="hidden" name="quoteId" value={quote.id} />
                        <input type="hidden" name="itemId" value={item.id} />
                        <button type="submit" className="text-xs text-rose-600 hover:underline">
                          Quitar
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-foreground/10 bg-foreground/2 px-4 py-3">
              <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex items-center justify-between text-foreground/65">
                  <span>Subtotal</span>
                  <span className="tabular-nums">${Number(quote.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-foreground/65">
                  <span>Tax ({taxRatePercent.toFixed(3)}%)</span>
                  <span className="tabular-nums">${Number(quote.tax).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-foreground/12 pt-1.5 font-semibold text-foreground">
                  <span>Total</span>
                  <span className="tabular-nums">${Number(quote.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4">
            <p className="mb-3 text-sm font-semibold text-foreground/80">Estado del estimado</p>
            <div className="flex flex-wrap gap-2">
              {(["DRAFT", "SENT", "APPROVED", "REJECTED"] as const).map((s) => (
                <form key={s} action={changeStatusAction}>
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    type="submit"
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      quote.status === s
                        ? "border-accent/60 bg-accent/20 text-accent"
                        : "border-foreground/20 text-foreground/70 hover:bg-foreground/5"
                    }`}
                  >
                    {statusLabel(s)}
                  </button>
                </form>
              ))}
            </div>
          </div>

          {/* Details */}
          <form action={updateQuoteAction} className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4">
            <input type="hidden" name="id" value={quote.id} />
            <p className="mb-3 text-sm font-semibold text-foreground/80">Detalles</p>
            <div className="space-y-3">
              <label className="grid gap-1">
                <span className={lbl}>Válido hasta</span>
                <input
                  name="validUntil"
                  type="date"
                  defaultValue={quote.validUntil ? quote.validUntil.toISOString().slice(0, 10) : ""}
                  className={ic}
                />
              </label>
              <label className="grid gap-1">
                <span className={lbl}>Notas</span>
                <textarea
                  name="notes"
                  defaultValue={quote.notes ?? ""}
                  rows={4}
                  className={`${ic} resize-none`}
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

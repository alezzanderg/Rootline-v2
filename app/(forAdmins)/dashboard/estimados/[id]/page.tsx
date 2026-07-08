import { revalidatePath } from "next/cache"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { AlertTriangle, Eye, Mail, MapPin, MoreVertical, Phone, Send, User } from "lucide-react"

import { EstimadoLineItems, type EstimadoLineItem } from "@/components/ui/EstimadoLineItems"
import { EstimadoQuoteServices, type EstimadoServiceOption } from "@/components/ui/EstimadoQuoteServices"
import { QuoteActivityTimeline, type QuoteTimelineEvent } from "@/components/quotes/QuoteActivityTimeline"
import { MercuryInvoicePanel } from "@/components/quotes/MercuryInvoicePanel"
import { ManualPaymentPanel } from "@/components/quotes/ManualPaymentPanel"
import { StripeCheckoutPanel } from "@/components/quotes/StripeCheckoutPanel"
import { QuotePublicLinkPanel } from "@/components/quotes/QuotePublicLinkPanel"
import { requireAdminUser } from "@/lib/admin-session"
import { getTaxRatePercent, recalcQuoteTotals } from "@/lib/app-settings"
import { getMercuryPayUrl, hasValidMercuryTokenFormat, isMercuryConfigured } from "@/lib/mercury/config"
import { isStripeConfigured, getStripeMode, getStripeModeLabel } from "@/lib/stripe/config"
import { getPublicQuoteUrl } from "@/lib/quote-document"
import { assignMembershipFromQuoteIfNeeded } from "@/lib/quote-membership"
import { createOptionGroupAction, deleteOptionGroupAction } from "@/lib/quote-options-actions"
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
    if (!(await requireAdminUser())) return
    const quoteId = parseStr(formData.get("id"))
    if (!quoteId) return
    const validUntilRaw = parseOptStr(formData.get("validUntil"))
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        notes: parseOptStr(formData.get("notes")),
        validUntil: validUntilRaw ? new Date(validUntilRaw) : null,
        collectFirstCycleNow: formData.get("collectFirstCycleNow") === "on",
      },
    })
    await recalcQuoteTotals(quoteId)
    revalidatePath(`/dashboard/estimados/${quoteId}`)
    revalidatePath("/dashboard/estimados")
  }

  async function updateFrequencyAction(formData: FormData) {
    "use server"
    if (!(await requireAdminUser())) return
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
    if (!(await requireAdminUser())) return
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
    if (!(await requireAdminUser())) return
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

  async function addPlanItemAction(formData: FormData) {
    "use server"
    if (!(await requireAdminUser())) return
    const quoteId = parseStr(formData.get("quoteId"))
    if (!quoteId) return

    const weekdayRaw = Number.parseInt(parseStr(formData.get("planWeekday")), 10)
    const planWeekday = Number.isFinite(weekdayRaw) && weekdayRaw >= 1 && weekdayRaw <= 7 ? weekdayRaw : null
    const startWeekRaw = parseStr(formData.get("planStartWeek"))
    const planStartWeek = startWeekRaw === "THIS_WEEK" || startWeekRaw === "NEXT_WEEK" ? startWeekRaw : "NEXT_WEEK"

    let planId: string
    let name: string
    let cycleTotal: number
    let visits: number

    if (parseStr(formData.get("planMode")) === "custom") {
      const customName = parseStr(formData.get("customName"))
      const customMonthly = parseOptFloat(formData.get("customMonthly"))
      if (!customName || customMonthly === null || customMonthly <= 0) return
      const visitsRaw = Number.parseInt(parseStr(formData.get("customVisits")), 10)
      visits = Number.isFinite(visitsRaw) && visitsRaw >= 1 ? visitsRaw : 4
      const created = await prisma.membershipPlan.create({
        data: {
          name: customName,
          slug: `custom-${crypto.randomUUID()}`,
          tier: "MEDIUM",
          monthlyPrice: customMonthly,
          visitsPerMonth: visits,
          isCustom: true,
          active: true,
        },
      })
      planId = created.id
      name = created.name
      cycleTotal = customMonthly
    } else {
      const pid = parseStr(formData.get("planId"))
      if (!pid) return
      const plan = await prisma.membershipPlan.findUnique({ where: { id: pid } })
      if (!plan) return
      planId = plan.id
      name = plan.name
      cycleTotal = Number(plan.monthlyPrice)
      visits = plan.visitsPerMonth
    }

    // Store as visits × per-visit so the document can show the cycle breakdown.
    const perVisit = visits > 0 ? Math.round((cycleTotal / visits) * 100) / 100 : cycleTotal

    await prisma.quoteItem.create({
      data: {
        quoteId,
        planId,
        name,
        isRecurring: true,
        quantity: visits,
        unitPrice: perVisit,
        lineTotal: cycleTotal,
        planStartWeek,
        planWeekday,
        planTime: parseOptStr(formData.get("planTime")),
        description: parseOptStr(formData.get("description")),
      },
    })

    await recalcQuoteTotals(quoteId)
    revalidatePath(`/dashboard/estimados/${quoteId}`)
    revalidatePath("/dashboard/estimados")
  }

  async function addCustomItemAction(formData: FormData) {
    "use server"
    if (!(await requireAdminUser())) return
    const quoteId = parseStr(formData.get("quoteId"))
    const name = parseStr(formData.get("name"))
    const unitPrice = parseOptFloat(formData.get("unitPrice"))
    const quantity = parseOptFloat(formData.get("quantity")) ?? 1
    if (!quoteId || !name || unitPrice === null || unitPrice < 0 || quantity <= 0) return

    await prisma.quoteItem.create({
      data: {
        quoteId,
        name,
        isRecurring: false,
        quantity,
        unitPrice,
        lineTotal: Math.round(quantity * unitPrice * 100) / 100,
        description: parseOptStr(formData.get("description")),
      },
    })
    await recalcQuoteTotals(quoteId)
    revalidatePath(`/dashboard/estimados/${quoteId}`)
    revalidatePath("/dashboard/estimados")
  }

  async function removeItemAction(formData: FormData) {
    "use server"
    if (!(await requireAdminUser())) return
    const quoteId = parseStr(formData.get("quoteId"))
    const itemId = parseStr(formData.get("itemId"))
    if (!quoteId || !itemId) return

    await prisma.quoteItem.delete({ where: { id: itemId } })
    await recalcQuoteTotals(quoteId)

    revalidatePath(`/dashboard/estimados/${quoteId}`)
    revalidatePath("/dashboard/estimados")
  }

  async function updateItemAction(formData: FormData) {
    "use server"
    if (!(await requireAdminUser())) return
    const quoteId = parseStr(formData.get("quoteId"))
    const itemId = parseStr(formData.get("itemId"))
    if (!quoteId || !itemId) return
    const quantity = parseOptFloat(formData.get("quantity"))
    const unitPrice = parseOptFloat(formData.get("unitPrice"))
    if (quantity === null || quantity <= 0 || unitPrice === null || unitPrice < 0) return

    await prisma.quoteItem.update({
      where: { id: itemId },
      data: {
        quantity,
        unitPrice,
        lineTotal: Math.round(quantity * unitPrice * 100) / 100,
        description: parseOptStr(formData.get("description")),
      },
    })
    await recalcQuoteTotals(quoteId)
    revalidatePath(`/dashboard/estimados/${quoteId}`)
    revalidatePath("/dashboard/estimados")
  }

  async function changeStatusAction(formData: FormData) {
    "use server"
    if (!(await requireAdminUser())) return
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
    if (status === "APPROVED") {
      await assignMembershipFromQuoteIfNeeded(prisma, quoteId)
    }
    revalidatePath(`/dashboard/estimados/${quoteId}`)
    revalidatePath("/dashboard/estimados")
    if (status === "APPROVED") revalidatePath("/dashboard/scheduling")
  }

  async function deleteQuoteAction(formData: FormData) {
    "use server"
    if (!(await requireAdminUser())) return
    const quoteId = parseStr(formData.get("id"))
    const confirm = formData.get("confirmDelete") === "on"
    if (!quoteId || !confirm) return
    // Never hard-delete a paid quote — it is a financial record.
    const existing = await prisma.quote.findUnique({ where: { id: quoteId }, select: { paidAt: true } })
    if (existing?.paidAt) return
    await prisma.quote.delete({ where: { id: quoteId } })
    revalidatePath("/dashboard/estimados")
    redirect("/dashboard/estimados")
  }

  async function togglePaymentsAction(formData: FormData) {
    "use server"
    if (!(await requireAdminUser())) return
    const quoteId = parseStr(formData.get("quoteId"))
    if (!quoteId) return
    const enabled = formData.get("paymentsEnabled") === "on"
    await prisma.quote.update({ where: { id: quoteId }, data: { paymentsEnabled: enabled } })
    revalidatePath(`/dashboard/estimados/${quoteId}`)
  }

  /** Testing helper: reset the quote as if the client hasn't responded yet. */
  async function resetClientResponseAction(formData: FormData) {
    "use server"
    if (!(await requireAdminUser())) return
    const quoteId = parseStr(formData.get("quoteId"))
    const confirm = formData.get("confirmReset") === "on"
    if (!quoteId || !confirm) return
    const updated = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        approvedAt: null,
        rejectedAt: null,
        signedAt: null,
        signatureData: null,
        paidAt: null,
        paymentMethod: null,
        paymentNote: null,
        stripeCheckoutSessionId: null,
        stripeCheckoutUrl: null,
        stripePaymentStatus: null,
        mercuryInvoiceId: null,
        mercuryInvoiceSlug: null,
        mercuryInvoiceStatus: null,
        membershipAssignedAt: null,
      },
      select: { publicToken: true },
    })
    revalidatePath(`/dashboard/estimados/${quoteId}`)
    revalidatePath(`/dashboard/estimados/${quoteId}/preview`)
    if (updated.publicToken) revalidatePath(`/quote/${updated.publicToken}`)
    revalidatePath("/dashboard/estimados")
  }

  const [quote, services, plans, taxRatePercent, emailLogs] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        property: { select: { street: true, city: true, lotSizeSqFt: true } },
        items: {
          include: {
            service: { select: { id: true, name: true, category: true } },
            plan: { select: { name: true } },
          },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        },
        optionGroups: { orderBy: { sortOrder: "asc" } },
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
    prisma.membershipPlan.findMany({
      where: { active: true, isCustom: false },
      orderBy: [{ tier: "asc" }, { monthlyPrice: "asc" }],
      select: { id: true, name: true, tier: true, monthlyPrice: true, visitsPerMonth: true },
    }),
    getTaxRatePercent(),
    prisma.emailSendLog.findMany({
      where: { quoteId: id, status: "sent" },
      orderBy: { createdAt: "asc" },
      select: { id: true, createdAt: true, toEmail: true, subject: true },
    }),
  ])

  if (!quote) notFound()

  const planOptions = plans.map((p) => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    monthlyPrice: Number(p.monthlyPrice),
    visitsPerMonth: p.visitsPerMonth,
  }))

  const optionGroups = quote.optionGroups.map((g) => ({
    id: g.id,
    title: g.title,
    selectionType: g.selectionType,
    required: g.required,
  }))

  const lineItems: EstimadoLineItem[] = quote.items.map((item) => ({
    id: item.id,
    name: item.service?.name ?? item.plan?.name ?? item.name ?? "Línea",
    isRecurring: item.isRecurring,
    isAddOn: item.service?.category === "ADD_ON",
    categoryLabel: item.service
      ? (SERVICE_CATEGORY_LABEL[item.service.category] ?? item.service.category)
      : "Servicio",
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.lineTotal),
    description: item.description,
    lineType: item.lineType,
    optionGroupId: item.optionGroupId,
    isSelected: item.isSelected,
    selectedByDefault: item.selectedByDefault,
    taxable: item.taxable,
    recommended: item.recommended,
    badgeLabel: item.badgeLabel,
    recurringInterval: item.recurringInterval,
  }))

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
  const publicUrl = quote.publicToken ? getPublicQuoteUrl(quote.publicToken) : null
  const mercuryPayUrl = quote.mercuryInvoiceSlug ? getMercuryPayUrl(quote.mercuryInvoiceSlug) : null
  const mercuryConfigured = isMercuryConfigured()
  const mercuryTokenValid = hasValidMercuryTokenFormat()
  const stripeConfigured = isStripeConfigured()
  const stripeMode = getStripeMode()
  const stripeModeLabel = getStripeModeLabel(stripeMode)

  const hasRecurring = lineItems.some((i) => i.isRecurring)
  const chip = "inline-flex items-center rounded-full border border-foreground/15 bg-foreground/5 px-2.5 py-0.5 text-xs font-medium text-foreground/65"
  const sectionTitle = "text-[11px] font-semibold uppercase tracking-wider text-foreground/40"

  const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null)
  const timelineEvents: QuoteTimelineEvent[] = (
    [
      { key: "created", label: "Estimado creado", at: iso(quote.createdAt), icon: "created", tone: "neutral" },
      { key: "sent", label: "Marcado como enviado", at: iso(quote.sentAt), icon: "sent", tone: "info" },
      ...emailLogs.map(
        (log): QuoteTimelineEvent => ({
          key: `email-${log.id}`,
          label: "Correo enviado al cliente",
          at: iso(log.createdAt),
          icon: "email",
          tone: "info",
          detail: log.toEmail,
        })
      ),
      { key: "approved", label: "Aprobado por el cliente", at: iso(quote.approvedAt), icon: "approved", tone: "success" },
      { key: "signed", label: "Firmado", at: iso(quote.signedAt), icon: "signed", tone: "success" },
      { key: "rejected", label: "Rechazado por el cliente", at: iso(quote.rejectedAt), icon: "rejected", tone: "danger" },
      {
        key: "paid",
        label: "Pago recibido",
        at: iso(quote.paidAt),
        icon: "paid",
        tone: "success",
        detail: quote.paymentMethod,
      },
    ] satisfies QuoteTimelineEvent[]
  )
    .filter((e) => e.at)
    .sort((a, b) => (a.at! < b.at! ? -1 : a.at! > b.at! ? 1 : 0))

  const customerPhoneDigits = quote.customer.phone?.replace(/\D/g, "") ?? ""

  return (
    <section className="mx-auto max-w-6xl text-foreground">
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/estimados" className="text-sm text-foreground/55 transition hover:text-foreground">
          ← Volver a estimados
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/estimados/${quote.id}/preview`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/15 bg-background px-3 py-1.5 text-xs font-semibold text-foreground/70 transition hover:border-accent/40 hover:text-accent"
          >
            <Eye className="h-3.5 w-3.5" />
            Vista previa
          </Link>
          <Link
            href={`/dashboard/correos?quote=${quote.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/90"
          >
            <Send className="h-3.5 w-3.5" />
            {quote.status === "DRAFT" ? "Enviar al cliente" : "Reenviar correo"}
          </Link>
          <details className="relative">
            <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg border border-foreground/20 bg-background text-foreground/60 transition hover:bg-foreground/5">
              <MoreVertical className="h-4 w-4" />
            </summary>
            <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-foreground/12 bg-[#fdfcf8] p-2 shadow-lg">
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

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Estimado</p>
          <Link
            href={`/dashboard/clientes/${quote.customer.id}`}
            className="mt-1 inline-flex items-center gap-2 font-display text-3xl font-semibold transition hover:text-accent sm:text-4xl"
          >
            {customerName}
            <User className="h-4 w-4 shrink-0 text-foreground/30" />
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/55">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {propertyAddress}
            </span>
            {quote.customer.phone ? (
              <a href={`tel:${customerPhoneDigits}`} className="flex items-center gap-1.5 transition hover:text-accent">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {quote.customer.phone}
              </a>
            ) : null}
            {quote.customer.email ? (
              <a href={`mailto:${quote.customer.email}`} className="flex items-center gap-1.5 transition hover:text-accent">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {quote.customer.email}
              </a>
            ) : null}
          </div>
          {!quote.property ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Sin propiedad asignada — el tamaño del yard usa “{PLAN_TIER_LABEL[planTier]}” por defecto.
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${statusBadge(quote.status)}`}>
              {statusLabel(quote.status)}
            </span>
            <span className={chip}>{QUOTE_FREQUENCY_LABEL[frequency] ?? frequency}</span>
            <span className={chip}>{PLAN_TIER_LABEL[planTier]}</span>
            <span className={`${chip} font-mono text-foreground/40`}>#{quote.id.slice(0, 8)}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-foreground/12 bg-white/50 px-5 py-4 text-right">
          <p className={sectionTitle}>Total {hasRecurring ? "hoy" : ""}</p>
          <p className="mt-0.5 font-display text-3xl font-bold tabular-nums text-forest">${Number(quote.total).toFixed(2)}</p>
          <p className="text-[11px] text-foreground/40 tabular-nums">
            Sub ${Number(quote.subtotal).toFixed(2)} · Tax ${Number(quote.tax).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">

        {/* Left: services + line items */}
        <div className="space-y-4">
          <EstimadoQuoteServices
            quoteId={quote.id}
            initialFrequency={frequency}
            initialPlanTier={planTier}
            coreServices={coreServices}
            addonServices={addonServices}
            plans={planOptions}
            updateFrequencyAction={updateFrequencyAction}
            updatePlanTierAction={updatePlanTierAction}
            addItemAction={addItemAction}
            addCustomItemAction={addCustomItemAction}
            addPlanItemAction={addPlanItemAction}
          />

          {/* Line items (editable ticket) */}
          <EstimadoLineItems
            quoteId={quote.id}
            items={lineItems}
            optionGroups={optionGroups}
            subtotal={Number(quote.subtotal)}
            tax={Number(quote.tax)}
            total={Number(quote.total)}
            taxRatePercent={taxRatePercent}
            updateItemAction={updateItemAction}
            removeItemAction={removeItemAction}
          />

          {/* Option groups manager */}
          <div className="rounded-2xl border border-foreground/12 bg-white/50 p-4">
            <p className={sectionTitle}>Grupos de opciones</p>
            <p className="mt-1 text-xs text-foreground/45">
              Agrupa líneas como opciones a elegir (el cliente elige una). Marca cada línea como Opción y asígnala a un grupo en su menú ⚙︎.
            </p>
            {quote.optionGroups.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {quote.optionGroups.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-2 rounded-xl border border-foreground/12 bg-background px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{g.title}</p>
                      <p className="text-[11px] text-foreground/45">
                        {g.selectionType === "SINGLE_SELECT" ? "Elegir una" : "Elegir varias"}
                        {g.required ? " · obligatorio" : " · opcional"}
                      </p>
                    </div>
                    <form action={deleteOptionGroupAction}>
                      <input type="hidden" name="quoteId" value={quote.id} />
                      <input type="hidden" name="groupId" value={g.id} />
                      <button type="submit" className="text-xs text-rose-600 hover:underline">Eliminar</button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : null}
            <form action={createOptionGroupAction} className="mt-3 grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="quoteId" value={quote.id} />
              <input name="title" required placeholder="Ej. Elige tu plan de mantenimiento" className={`${ic} sm:col-span-2`} />
              <input name="description" placeholder="Descripción (opcional)" className={`${ic} sm:col-span-2`} />
              <select name="selectionType" className={ic}>
                <option value="SINGLE_SELECT">Elegir una</option>
                <option value="MULTI_SELECT">Elegir varias</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-foreground/65">
                <input type="checkbox" name="required" defaultChecked />
                Obligatorio
              </label>
              <button type="submit" className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:bg-foreground/85 sm:col-span-2">
                Crear grupo
              </button>
            </form>
          </div>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">
          {/* Estado */}
          <div className="rounded-2xl border border-foreground/12 bg-white/50 p-4">
            <p className={sectionTitle}>Estado del estimado</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
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

          {/* Actividad + firma */}
          <QuoteActivityTimeline
            events={timelineEvents}
            signatureData={quote.signatureData}
            signedAt={quote.signedAt?.toISOString() ?? null}
          />

          {/* Compartir */}
          <QuotePublicLinkPanel quoteId={quote.id} publicUrl={publicUrl} />

          {/* Pagos */}
          <div className="space-y-3">
            <p className={`${sectionTitle} px-1`}>Pagos</p>

            {/* Online payments toggle */}
            <div className={`rounded-2xl border p-4 ${quote.paymentsEnabled ? "border-foreground/12 bg-white/50" : "border-amber-400/40 bg-amber-50/50"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground/80">Pago en línea</p>
                  <p className="mt-0.5 text-xs text-foreground/55">
                    {quote.paymentsEnabled
                      ? "El cliente ve el checkout en el estimado."
                      : "El checkout está oculto para el cliente."}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    quote.paymentsEnabled ? "border-emerald-600/30 bg-emerald-50 text-emerald-700" : "border-amber-500/40 bg-amber-100 text-amber-800"
                  }`}
                >
                  {quote.paymentsEnabled ? "Activado" : "Desactivado"}
                </span>
              </div>
              <form action={togglePaymentsAction} className="mt-3">
                <input type="hidden" name="quoteId" value={quote.id} />
                <input type="hidden" name="paymentsEnabled" value={quote.paymentsEnabled ? "off" : "on"} />
                <button
                  type="submit"
                  className={`w-full rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    quote.paymentsEnabled
                      ? "border border-foreground/20 text-foreground/70 hover:bg-foreground/5"
                      : "bg-accent text-accent-foreground hover:bg-accent/90"
                  }`}
                >
                  {quote.paymentsEnabled ? "Deshabilitar pago en línea" : "Habilitar pago en línea"}
                </button>
              </form>
            </div>

            {quote.paymentsEnabled ? (
              <>
                <MercuryInvoicePanel
                  quoteId={quote.id}
                  quoteStatus={quote.status}
                  customerEmail={quote.customer.email}
                  payUrl={mercuryPayUrl}
                  invoiceStatus={quote.mercuryInvoiceStatus}
                  mercuryConfigured={mercuryConfigured}
                  mercuryTokenValid={mercuryTokenValid}
                />

                <StripeCheckoutPanel
                  quoteId={quote.id}
                  quoteStatus={quote.status}
                  publicUrl={publicUrl}
                  checkoutUrl={quote.stripeCheckoutUrl}
                  paymentStatus={quote.stripePaymentStatus}
                  stripeConfigured={stripeConfigured}
                  stripeModeLabel={stripeModeLabel}
                />
              </>
            ) : null}

            <ManualPaymentPanel
              quoteId={quote.id}
              quoteStatus={quote.status}
              total={Number(quote.total)}
              paidAt={quote.paidAt?.toISOString() ?? null}
              paymentMethod={quote.paymentMethod}
              paymentNote={quote.paymentNote}
              mercuryInvoiceStatus={quote.mercuryInvoiceStatus}
              stripePaymentStatus={quote.stripePaymentStatus}
            />
          </div>

          {/* Detalles */}
          <form action={updateQuoteAction} className="rounded-2xl border border-foreground/12 bg-white/50 p-4">
            <input type="hidden" name="id" value={quote.id} />
            <p className={sectionTitle}>Detalles</p>
            <div className="mt-2.5 space-y-3">
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
                <textarea name="notes" defaultValue={quote.notes ?? ""} rows={4} className={`${ic} resize-none`} />
              </label>
              <label className="flex items-start gap-2 text-sm text-foreground/70">
                <input type="checkbox" name="collectFirstCycleNow" defaultChecked={quote.collectFirstCycleNow} className="mt-0.5" />
                <span>
                  Cobrar el 1er ciclo recurrente hoy
                  <span className="block text-[11px] text-foreground/45">Suma el primer ciclo del plan elegido al total a pagar hoy.</span>
                </span>
              </label>
              <button type="submit" className="w-full rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:bg-foreground/85">
                Guardar cambios
              </button>
            </div>
          </form>

          {/* Pruebas */}
          <details className="rounded-2xl border border-foreground/10 bg-foreground/2 p-4">
            <summary className="cursor-pointer list-none text-xs font-semibold text-foreground/50">
              🧪 Pruebas: deshacer respuesta del cliente
            </summary>
            <p className="mt-2 text-[11px] leading-relaxed text-foreground/50">
              Regresa el estimado a <b>Enviado</b> y borra firma, aceptación/rechazo, pagos y la membresía
              auto-asignada, como si el cliente aún no hubiera respondido.
            </p>
            <form action={resetClientResponseAction} className="mt-2 flex flex-wrap items-center gap-2">
              <input type="hidden" name="quoteId" value={quote.id} />
              <label className="flex items-center gap-1.5 text-[11px] text-foreground/55">
                <input type="checkbox" name="confirmReset" />
                Confirmar
              </label>
              <button
                type="submit"
                className="rounded-lg border border-amber-500/40 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                Deshacer / Reset
              </button>
            </form>
          </details>
        </div>
      </div>
    </section>
  )
}

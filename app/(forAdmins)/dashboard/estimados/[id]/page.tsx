import { revalidatePath } from "next/cache"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { AlertTriangle, Eye, Mail, MapPin, MoreVertical, Phone, Send } from "lucide-react"

import { EstimadoLineItems, type EstimadoLineItem } from "@/components/ui/EstimadoLineItems"
import { EstimadoQuoteServices, type EstimadoServiceOption } from "@/components/ui/EstimadoQuoteServices"
import { QuoteActivityTimeline, type QuoteTimelineEvent } from "@/components/quotes/QuoteActivityTimeline"
import { MercuryInvoicePanel } from "@/components/quotes/MercuryInvoicePanel"
import { ManualPaymentPanel } from "@/components/quotes/ManualPaymentPanel"
import { StripeCheckoutPanel } from "@/components/quotes/StripeCheckoutPanel"
import { QuotePublicLinkPanel } from "@/components/quotes/QuotePublicLinkPanel"
import { QuoteStateRail, type RailStep } from "@/components/quotes/QuoteStateRail"
import { ActionBanner } from "@/components/ui/ActionBanner"
import { CopyButton } from "@/components/ui/CopyButton"
import { SubmitButton } from "@/components/ui/SubmitButton"
import {
  ActionError,
  requireAdmin,
  runAction,
  withError,
  withNotice,
} from "@/lib/admin-action"
import { requireAdminUser } from "@/lib/admin-session"
import { convertQuoteToJob } from "@/lib/job-lifecycle"
import { getTaxRatePercent, recalcQuoteTotals } from "@/lib/app-settings"
import { getMercuryPayUrl, hasValidMercuryTokenFormat, isMercuryConfigured } from "@/lib/mercury/config"
import { isStripeConfigured, getStripeMode, getStripeModeLabel } from "@/lib/stripe/config"
import { getPublicQuoteUrl } from "@/lib/quote-document"
import { assignMembershipFromQuoteIfNeeded } from "@/lib/quote-membership"
import { createOptionGroupAction, deleteOptionGroupAction } from "@/lib/quote-options-actions"
import { prisma } from "@/lib/prisma"
import { serviceCatalogPricingProps } from "@/lib/servicios-catalog-form"
import { QUOTE_FREQUENCY_LABEL, SERVICE_CATEGORY_LABEL } from "@/lib/quote-labels"
import { isQuoteExpired, jobStatus, quoteStatus, STATUS_CHIP } from "@/lib/status-ui"
import { inferPlanTierFromLotSqFt, PLAN_TIER_LABEL, type PlanTier } from "@/lib/service-pricing"

type Props = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ error?: string; ok?: string }>
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

export default async function EstimadoDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const banner = (await searchParams) ?? {}
  const detailPath = `/dashboard/estimados/${id}`

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

  /**
   * Records a status change WITHOUT erasing the other timestamps.
   *
   * The previous version wrote `sentAt: status === "SENT" ? now : null` for all
   * three date columns, so approving a quote that had already been sent set
   * `sentAt` back to null and the activity timeline permanently lost the "sent"
   * event. These columns are an event log, not mutually exclusive state: each is
   * stamped the first time it happens and then left alone.
   */
  async function changeStatusAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("quotes:write")
    if (!auth.ok) redirect(withError(detailPath, auth.code))

    const status = parseStr(formData.get("status"))
    const result = await runAction(
      auth.user,
      { action: `quote.status.${status || "unknown"}`, entityType: "Quote", entityId: parseStr(formData.get("quoteId")) },
      async () => {
        const quoteId = parseStr(formData.get("quoteId"))
        if (!quoteId || !["SENT", "APPROVED", "REJECTED", "DRAFT"].includes(status)) {
          throw new ActionError("datos")
        }

        const current = await prisma.quote.findUnique({
          where: { id: quoteId },
          select: { sentAt: true, approvedAt: true, rejectedAt: true },
        })
        if (!current) throw new ActionError("no_encontrado")

        const now = new Date()
        await prisma.quote.update({
          where: { id: quoteId },
          data: {
            status: status as "DRAFT" | "SENT" | "APPROVED" | "REJECTED",
            // Stamp on first occurrence; never clear what already happened.
            sentAt: status === "SENT" ? (current.sentAt ?? now) : current.sentAt,
            approvedAt: status === "APPROVED" ? (current.approvedAt ?? now) : current.approvedAt,
            rejectedAt: status === "REJECTED" ? (current.rejectedAt ?? now) : current.rejectedAt,
          },
        })
        if (status === "APPROVED") {
          await assignMembershipFromQuoteIfNeeded(prisma, quoteId)
        }
      }
    )
    if (!result.ok) redirect(withError(detailPath, result.code))

    revalidatePath(detailPath)
    revalidatePath("/dashboard/estimados")
    if (status === "APPROVED") revalidatePath("/dashboard/scheduling")
  }

  /**
   * Assigns (or moves) the property this estimate is for.
   *
   * `Quote.propertyId` is optional and used to only be settable on the create
   * form, so a quote created without one was stuck: the header warned that the
   * yard size was falling back to "Mediano" and the Operación panel refused to
   * build a job, with no control anywhere to fix either.
   *
   * The property must belong to this quote's customer, since the id arrives
   * from a form field.
   */
  async function assignQuotePropertyAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("quotes:write")
    if (!auth.ok) redirect(withError(detailPath, auth.code))

    const result = await runAction(
      auth.user,
      { action: "quote.assignProperty", entityType: "Quote", entityId: id },
      async () => {
        const propertyId = parseOptStr(formData.get("propertyId"))
        if (!propertyId) throw new ActionError("datos")

        const target = await prisma.quote.findUnique({
          where: { id },
          select: { customerId: true, archivedAt: true, publicToken: true },
        })
        if (!target || target.archivedAt) throw new ActionError("no_encontrado")

        const owned = await prisma.property.findFirst({
          where: { id: propertyId, customerId: target.customerId, archivedAt: null },
          select: { id: true },
        })
        if (!owned) throw new ActionError("no_encontrado")

        await prisma.quote.update({ where: { id }, data: { propertyId } })
        // Line prices are not recomputed on purpose: they were quoted at a
        // number the customer may already have seen. This only re-sums them.
        await recalcQuoteTotals(id)
        return target.publicToken
      }
    )
    if (!result.ok) redirect(withError(detailPath, result.code))

    revalidatePath(detailPath)
    revalidatePath(`${detailPath}/preview`)
    revalidatePath("/dashboard/estimados")
    // The public document shows the address, so its cache is stale now.
    if (result.value) revalidatePath(`/quote/${result.value}`)
  }

  /**
   * Turns an approved estimate into a scheduled job.
   *
   * Until now approving a quote produced a Job only when it carried a recurring
   * plan line. A one-time estimate, however large, ended at "approved" and the
   * admin had to re-pick the customer and the quote from two unlinked selects in
   * Scheduling. Idempotent: a second submit lands on the job that already exists.
   */
  async function convertQuoteToJobAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("scheduling:write")
    if (!auth.ok) redirect(withError(detailPath, auth.code))

    const result = await runAction(
      auth.user,
      { action: "quote.convertToJob", entityType: "Quote", entityId: parseStr(formData.get("quoteId")) },
      async () => {
        const quoteId = parseStr(formData.get("quoteId"))
        if (!quoteId) throw new ActionError("datos")
        const scheduledAtRaw = parseStr(formData.get("scheduledAt"))
        if (!scheduledAtRaw) throw new ActionError("datos")
        const employeeId = parseOptStr(formData.get("employeeId"))
        return convertQuoteToJob(quoteId, {
          scheduledAt: new Date(scheduledAtRaw),
          title: parseOptStr(formData.get("title")),
          employeeIds: employeeId ? [employeeId] : [],
        })
      }
    )
    if (!result.ok) redirect(withError(detailPath, result.code))

    revalidatePath(detailPath)
    revalidatePath("/dashboard/scheduling")
    revalidatePath("/dashboard")
    redirect(
      withNotice("/dashboard/scheduling", result.value.created ? "trabajo_creado" : "trabajo_existente")
    )
  }

  /**
   * Archives instead of deleting. A quote is a financial record: the old version
   * hard-deleted it (cascading to QuoteItem and QuoteOptionGroup) whenever it was
   * unpaid, discarding the signature and acceptance snapshot with it.
   */
  async function archiveQuoteAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("archive")
    if (!auth.ok) redirect(withError(detailPath, auth.code))

    const result = await runAction(
      auth.user,
      { action: "quote.archive", entityType: "Quote", entityId: parseStr(formData.get("id")) },
      async () => {
        const quoteId = parseStr(formData.get("id"))
        if (!quoteId || formData.get("confirmDelete") !== "on") throw new ActionError("datos")
        await prisma.quote.update({ where: { id: quoteId }, data: { archivedAt: new Date() } })
      }
    )
    if (!result.ok) redirect(withError(detailPath, result.code))

    revalidatePath("/dashboard/estimados")
    redirect(withNotice("/dashboard/estimados", "archivado"))
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

  const [quote, services, plans, taxRatePercent, emailLogs, existingJob, employees] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            // Needed by the property picker below.
            properties: {
              where: { archivedAt: null },
              select: { id: true, label: true, street: true, city: true, lotSizeSqFt: true },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        property: { select: { id: true, street: true, city: true, lotSizeSqFt: true } },
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
      where: { active: true, archivedAt: null },
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
    prisma.job.findFirst({
      where: { quoteId: id },
      select: { id: true, status: true, scheduledAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 200,
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

  const statusLabel = (s: string) => quoteStatus(s).label

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

  // ── Masthead + state rail ────────────────────────────────────────────────
  const quoteRef = `EST-${quote.id.slice(0, 8).toUpperCase()}`
  const [dollars, cents] = Number(quote.total).toFixed(2).split(".")
  const isExpired = isQuoteExpired(quote.status, quote.validUntil)
  const fmtShort = (d: Date) =>
    new Intl.DateTimeFormat("es-US", { day: "numeric", month: "short" }).format(d)

  const answered = quote.approvedAt ?? quote.rejectedAt
  const wasRejected = quote.status === "REJECTED"

  /**
   * Where the estimate actually is, decided once.
   *
   * The rail's "current" node and the action button both read this, so they can
   * never disagree — an earlier version derived them separately and ended up
   * highlighting Cobro while the button offered to create the job.
   */
  const nextStep: "sent" | "answered" | "job" | "paid" | null = wasRejected
    ? null
    : quote.status === "DRAFT"
      ? "sent"
      : quote.status === "SENT"
        ? "answered"
        : quote.status === "APPROVED" && !existingJob
          ? "job"
          : quote.status === "APPROVED" && !quote.paidAt
            ? "paid"
            : null

  const stepState = (key: string, done: boolean): RailStep["state"] =>
    done ? "done" : nextStep === key ? "current" : "future"

  /**
   * The milestones in the order the business actually works: the customer
   * approves, you schedule the visit, you do it, then you collect. Each node is
   * backed by a real column, so a node without a date means that stage has not
   * happened.
   */
  const railSteps: RailStep[] = [
    { key: "created", label: "Creado", at: quote.createdAt.toISOString(), state: "done" },
    {
      key: "sent",
      label: "Enviado",
      at: iso(quote.sentAt),
      pending: "sin enviar",
      state: stepState("sent", Boolean(quote.sentAt)),
    },
    {
      key: "answered",
      label: wasRejected ? "Rechazado" : "Respuesta",
      at: iso(answered),
      pending: "esperando",
      state: wasRejected ? "failed" : stepState("answered", Boolean(answered)),
    },
    {
      key: "job",
      label: "Trabajo",
      at: existingJob ? existingJob.scheduledAt.toISOString() : null,
      pending: "sin programar",
      state: wasRejected ? "future" : stepState("job", Boolean(existingJob)),
    },
    {
      key: "paid",
      label: "Cobro",
      at: iso(quote.paidAt),
      pending: "pendiente",
      state: wasRejected ? "future" : stepState("paid", Boolean(quote.paidAt)),
    },
  ]

  /** The single next move. Same source of truth as the rail's current node. */
  const railAction: React.ComponentProps<typeof QuoteStateRail>["action"] =
    nextStep === "sent"
      ? {
          label: "Enviar al cliente",
          hint: "Abre el redactor de correo con este estimado adjunto.",
          href: `/dashboard/correos?quote=${quote.id}`,
        }
      : nextStep === "answered"
        ? {
            label: "Registrar respuesta",
            hint: isExpired
              ? "Venció, así que el cliente ya no puede aceptarlo desde el enlace público."
              : "El cliente puede aceptarlo desde el enlace. Márcalo aquí si respondió por teléfono.",
            href: "#estado-manual",
          }
        : nextStep === "job"
          ? {
              label: "Crear el trabajo",
              hint: quote.propertyId
                ? "Programa la visita con los servicios de este estimado."
                : "Primero asigna una propiedad más abajo.",
              href: "#operacion",
            }
          : nextStep === "paid"
            ? {
                label: "Registrar el cobro",
                hint: "El trabajo ya está programado. Falta marcar el pago.",
                href: "#cobro",
              }
            : undefined

  return (
    <section className="text-foreground">
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/estimados" className="text-sm text-foreground/55 transition hover:text-foreground">
          ← Volver a estimados
        </Link>
        <ActionBanner error={banner.error} notice={banner.ok} className="w-full order-last" />
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
            <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-foreground/12 bg-admin-popover p-2 shadow-lg">
              <form action={archiveQuoteAction}>
                <input type="hidden" name="id" value={quote.id} />
                <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground/60 hover:bg-foreground/5">
                  <input type="checkbox" name="confirmDelete" />
                  Confirmar archivado
                </label>
                <button
                  type="submit"
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-amber-700 transition hover:bg-amber-50"
                >
                  Archivar estimado
                </button>
                <p className="px-3 pt-1 text-[10px] leading-snug text-foreground/40">
                  Se oculta del listado. Firma, pagos e historial se conservan.
                </p>
              </form>
            </div>
          </details>
        </div>
      </div>

      {/* Masthead.
          The content area of this panel is cream on cream, which flattens every
          page into one field of pale rectangles. Pulling the shell's own forest
          surface onto this page gives the two facts that matter — how much, and
          where is it — somewhere to land. */}
      <div className="overflow-hidden rounded-3xl bg-forest text-cream">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <Link
                href={`/dashboard/clientes/${quote.customer.id}`}
                className="inline-block font-display text-3xl font-semibold leading-tight text-cream underline-offset-8 transition hover:text-terra-on-dark hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terra-on-dark sm:text-4xl"
              >
                {customerName}
              </Link>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cream/55">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {propertyAddress}
                </span>
                {quote.customer.phone ? (
                  <a href={`tel:${customerPhoneDigits}`} className="flex items-center gap-1.5 transition hover:text-cream">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {quote.customer.phone}
                  </a>
                ) : null}
                {quote.customer.email ? (
                  <a href={`mailto:${quote.customer.email}`} className="flex items-center gap-1.5 transition hover:text-cream">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {quote.customer.email}
                  </a>
                ) : null}
              </div>
            </div>

            <CopyButton
              value={quoteRef}
              label={quoteRef}
              copiedLabel="Copiado"
              title="Copiar referencia del estimado"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-cream/15 px-2.5 py-1.5 font-mono text-xs tracking-wide text-cream/55 transition hover:border-cream/30 hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra-on-dark"
            />
          </div>

              {/* Terms of the quote sit with the customer, not between the
                  amount and the rail: those two belong side by side. */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center rounded-full bg-cream/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-cream/70">
                  {QUOTE_FREQUENCY_LABEL[frequency] ?? frequency}
                </span>
                <span className="inline-flex items-center rounded-full bg-cream/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-cream/70">
                  Yard {PLAN_TIER_LABEL[planTier]}
                </span>
                {isExpired ? (
                  <span className="inline-flex items-center rounded-full bg-terra-on-dark/20 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-terra-on-dark-hover">
                    Venció el {quote.validUntil ? fmtShort(quote.validUntil) : "—"}
                  </span>
                ) : null}
              </div>

          {/* The amount anchors the block; the rail below is the hero. Cents sit
              at lower contrast so the dollars read first at a glance. */}
          <div className="mt-6 flex flex-wrap items-end gap-x-5 gap-y-1">
            <p className="font-display text-[2.75rem] leading-[0.9] font-bold tabular-nums tracking-tight text-cream sm:text-6xl">
              <span className="text-cream/50">$</span>
              {dollars}
              <span className="text-cream/45">.{cents}</span>
            </p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 pb-1 text-xs text-cream/45">
              {hasRecurring ? (
                <span className="rounded-full bg-cream/10 px-2 py-0.5 font-semibold tracking-wide text-cream/70">
                  a pagar hoy
                </span>
              ) : null}
              <span className="tabular-nums">Subtotal ${Number(quote.subtotal).toFixed(2)}</span>
              <span className="tabular-nums">Impuesto ${Number(quote.tax).toFixed(2)}</span>
            </div>
          </div>

          <QuoteStateRail steps={railSteps} action={railAction} />
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
          <div className="rounded-2xl border border-foreground/12 bg-card p-4">
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
              <button type="submit" className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-forest/90 sm:col-span-2">
                Crear grupo
              </button>
            </form>
          </div>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">
          {/* Estado manual.
              The rail carries the forward move; this is the correction path for
              when the customer answers by phone, or when a status was set by
              mistake. Demoted to a disclosure so it stops competing with the
              rail for the same job. */}
          <details id="estado-manual" className="group scroll-mt-28 rounded-2xl border border-foreground/12 bg-card p-4 open:pb-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
              <span className={sectionTitle}>Estado</span>
              <span className="flex items-center gap-2">
                <span className={`${STATUS_CHIP} ${quoteStatus(quote.status).badge}`}>
                  {quoteStatus(quote.status).label}
                </span>
                <span className="text-xs font-medium text-accent underline-offset-2 group-hover:underline group-open:hidden">
                  Corregir
                </span>
              </span>
            </summary>
            <p className="mt-3 text-xs leading-snug text-foreground/50">
              Úsalo solo para corregir. Las fechas ya registradas no se borran.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {(["DRAFT", "SENT", "APPROVED", "REJECTED"] as const).map((s) => (
                <form key={s} action={changeStatusAction}>
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    type="submit"
                    disabled={quote.status === s}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      quote.status === s
                        ? "cursor-default border-accent/60 bg-accent/20 text-accent"
                        : "border-foreground/20 text-foreground/70 hover:bg-foreground/5"
                    }`}
                  >
                    {statusLabel(s)}
                  </button>
                </form>
              ))}
            </div>
          </details>

          {/* Propiedad: se puede asignar y cambiar en cualquier momento */}
          <div
            className={`rounded-2xl border p-4 ${
              quote.propertyId ? "border-foreground/12 bg-card" : "border-amber-400/45 bg-amber-50"
            }`}
          >
            <p className={sectionTitle}>Propiedad</p>

            {quote.property ? (
              <p className="mt-1.5 text-sm font-medium text-foreground/80">
                {quote.property.street}, {quote.property.city}
                <span className="mt-0.5 block text-[11px] font-normal text-foreground/45">
                  {quote.property.lotSizeSqFt
                    ? `Lote ${quote.property.lotSizeSqFt.toLocaleString("es-US")} sqft`
                    : "Sin tamaño de lote registrado"}
                </span>
              </p>
            ) : (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-amber-900">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Sin asignar. El tamaño del yard cae en “{PLAN_TIER_LABEL[planTier]}” por defecto y no
                se puede crear el trabajo.
              </p>
            )}

            {quote.customer.properties.length === 0 ? (
              <div className="mt-3">
                <p className="text-xs text-foreground/55">
                  {quote.customer.firstName} no tiene propiedades registradas todavía.
                </p>
                <Link
                  href={`/dashboard/clientes/${quote.customer.id}/propiedades/nueva`}
                  className="mt-2 inline-flex rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm font-semibold transition hover:border-accent/40 hover:text-accent"
                >
                  Crear una propiedad
                </Link>
              </div>
            ) : (
              <form action={assignQuotePropertyAction} className="mt-3 space-y-2">
                <select
                  name="propertyId"
                  required
                  defaultValue={quote.propertyId ?? ""}
                  aria-label="Propiedad del estimado"
                  className={ic}
                >
                  <option value="" disabled>
                    Seleccionar propiedad…
                  </option>
                  {quote.customer.properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label ? `${p.label} · ` : ""}
                      {p.street}, {p.city}
                    </option>
                  ))}
                </select>
                <SubmitButton
                  pendingLabel="Guardando…"
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    quote.propertyId
                      ? "border border-foreground/20 text-foreground/70 hover:bg-foreground/5"
                      : "bg-accent text-accent-foreground hover:bg-accent/90"
                  }`}
                >
                  {quote.propertyId ? "Cambiar propiedad" : "Asignar propiedad"}
                </SubmitButton>
                {quote.status !== "DRAFT" ? (
                  <p className="text-[11px] leading-snug text-foreground/50">
                    Este estimado ya salió al cliente: cambiar la propiedad también cambia la
                    dirección que ve en el documento público.
                  </p>
                ) : null}
                <Link
                  href={`/dashboard/clientes/${quote.customer.id}/propiedades/nueva`}
                  className="block text-[11px] text-foreground/45 underline-offset-2 hover:text-foreground hover:underline"
                >
                  Registrar otra propiedad para este cliente
                </Link>
              </form>
            )}
          </div>

          {/* Convertir en trabajo: el puente que faltaba entre venta y operación */}
          {quote.status === "APPROVED" ? (
            <div id="operacion" className="scroll-mt-28 rounded-2xl border border-accent/35 bg-accent/8 p-4">
              <p className={sectionTitle}>Operación</p>
              {existingJob ? (
                <div className="mt-2">
                  <p className="text-sm text-foreground/70">
                    Ya existe un trabajo para este estimado.
                  </p>
                  <Link
                    href="/dashboard/scheduling"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm font-semibold transition hover:border-accent/40 hover:text-accent"
                  >
                    Ver en scheduling
                    <span className={`${STATUS_CHIP} ${jobStatus(existingJob.status).badge}`}>
                      {jobStatus(existingJob.status).label}
                    </span>
                  </Link>
                </div>
              ) : !quote.propertyId ? (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Asigna una propiedad en el panel de arriba para poder crear el trabajo.
                </p>
              ) : (
                <form action={convertQuoteToJobAction} className="mt-2.5 space-y-2.5">
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <label className="grid gap-1">
                    <span className={lbl}>Fecha y hora de la visita</span>
                    <input name="scheduledAt" type="datetime-local" required className={ic} />
                  </label>
                  <label className="grid gap-1">
                    <span className={lbl}>Asignar a (opcional)</span>
                    <select name="employeeId" className={ic} defaultValue="">
                      <option value="">Sin asignar</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <SubmitButton
                    pendingLabel="Creando trabajo…"
                    className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
                  >
                    Convertir en trabajo
                  </SubmitButton>
                  <p className="text-[11px] leading-snug text-foreground/50">
                    Crea una visita con los {quote.items.filter((i) => i.serviceId).length} servicios
                    de este estimado como tareas.
                  </p>
                </form>
              )}
            </div>
          ) : null}

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
            <p className={`${sectionTitle} scroll-mt-28 px-1`} id="cobro">Cobro</p>

            {/* Online payments toggle */}
            <div className={`rounded-2xl border p-4 ${quote.paymentsEnabled ? "border-foreground/12 bg-card" : "border-amber-400/40 bg-amber-50/50"}`}>
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
          <form action={updateQuoteAction} className="rounded-2xl border border-foreground/12 bg-card p-4">
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
              <button type="submit" className="w-full rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-forest/90">
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

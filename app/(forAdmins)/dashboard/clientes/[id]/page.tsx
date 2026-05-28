import { notFound } from "next/navigation"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { EditDialog } from "@/components/ui/EditDialog"
import { PhoneInput } from "@/components/ui/PhoneInput"
import { PropertiesDialog } from "@/components/ui/PropertiesDialog"
import { CustomerActionsMenu } from "@/components/ui/CustomerActionsMenu"
import { assignMembershipWithSchedule } from "@/lib/membership-plan-assign"
import { parsePhoneRequired } from "@/lib/phone-format"
import { parseOptPositiveInt } from "@/lib/form-parse"

// ── helpers ────────────────────────────────────────────────────
function parseStr(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : ""
}
function parseOptStr(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null
  const s = v.trim()
  return s || null
}
function parseOptInt(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null
  const n = parseInt(v.trim(), 10)
  return Number.isFinite(n) ? n : null
}
function parseDifficulty(v: FormDataEntryValue | null): "EASY" | "MEDIUM" | "HARD" | null {
  const s = typeof v === "string" ? v.trim() : ""
  return s === "EASY" || s === "MEDIUM" || s === "HARD" ? s : null
}
function titleCase(s: string) { return s.replace(/\b\w/g, (c) => c.toUpperCase()) }
function sentenceCase(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
function fmtDate(d: Date | null | undefined) {
  if (!d) return "—"
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d)
}
function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)
}

// ── constants ──────────────────────────────────────────────────
const DIFFICULTY_LABEL: Record<string, string> = { EASY: "Fácil", MEDIUM: "Moderado", HARD: "Difícil" }
const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: "text-emerald-500",
  MEDIUM: "text-amber-500",
  HARD: "text-rose-500",
}
const QUOTE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
}
const QUOTE_STATUS_BADGE: Record<string, string> = {
  DRAFT: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  SENT: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  APPROVED: "border-emerald-600/30 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-500/30 bg-rose-50 text-rose-600",
}
const JOB_STATUS_BADGE: Record<string, string> = {
  SCHEDULED: "border-blue-800 bg-blue-700 text-white",
  IN_PROGRESS: "border-amber-700 bg-amber-600 text-white",
  COMPLETED: "border-emerald-800 bg-emerald-700 text-white",
  CANCELLED: "border-rose-800 bg-rose-700 text-white",
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // ── server actions ─────────────────────────────────────────
  async function updateCustomerAction(formData: FormData) {
    "use server"
    const cId = parseStr(formData.get("id"))
    const firstName = titleCase(parseStr(formData.get("firstName")))
    const lastName = titleCase(parseStr(formData.get("lastName")))
    const phone = parsePhoneRequired(formData.get("phone"))
    if (!cId || !firstName || !lastName || !phone) return
    const rawNotes = parseOptStr(formData.get("notes"))
    await prisma.customer.update({
      where: { id: cId },
      data: {
        firstName,
        lastName,
        phone,
        email: parseOptStr(formData.get("email")),
        notes: rawNotes ? sentenceCase(rawNotes) : null,
        difficulty: parseDifficulty(formData.get("difficulty")),
      },
    })
    revalidatePath("/dashboard/clientes")
    revalidatePath(`/dashboard/clientes/${cId}`)
  }

  async function toggleCustomerActiveAction(formData: FormData) {
    "use server"
    const cId = parseStr(formData.get("id"))
    const nextActive = formData.get("nextActive") === "true"
    if (!cId) return
    await prisma.customer.update({ where: { id: cId }, data: { isActive: nextActive } })
    revalidatePath("/dashboard/clientes")
    revalidatePath(`/dashboard/clientes/${cId}`)
  }

  async function deleteCustomerAction(formData: FormData) {
    "use server"
    const cId = parseStr(formData.get("id"))
    const confirmed = formData.get("confirmDelete") === "on"
    if (!cId || !confirmed) return
    try {
      await prisma.customer.delete({ where: { id: cId } })
    } catch {
      await prisma.customer.update({ where: { id: cId }, data: { isActive: false } })
    }
    revalidatePath("/dashboard/clientes")
  }

  async function createPropertyAction(formData: FormData) {
    "use server"
    const customerId = parseStr(formData.get("customerId"))
    const street = parseStr(formData.get("street"))
    const city = parseStr(formData.get("city"))
    const zipCode = parseStr(formData.get("zipCode"))
    if (!customerId || !street || !city || !zipCode) return
    await prisma.property.create({
      data: {
        customerId,
        street,
        city,
        zipCode,
        state: parseStr(formData.get("state")) || "NJ",
        label: parseOptStr(formData.get("label")),
        accessNotes: parseOptStr(formData.get("accessNotes")),
        lotSizeSqFt: parseOptPositiveInt(formData.get("lotSizeSqFt")),
        flowerBedsCount: parseOptPositiveInt(formData.get("flowerBedsCount")),
        shrubsCount: parseOptPositiveInt(formData.get("shrubsCount")),
        treesCount: parseOptPositiveInt(formData.get("treesCount")),
        turfAreaSqFt: parseOptPositiveInt(formData.get("turfAreaSqFt")),
        bedsAreaSqFt: parseOptPositiveInt(formData.get("bedsAreaSqFt")),
        hardscapeAreaSqFt: parseOptPositiveInt(formData.get("hardscapeAreaSqFt")),
        yardFront: formData.get("yardFront") === "on",
        yardBack: formData.get("yardBack") === "on",
        yardSides: formData.get("yardSides") === "on",
        jobDifficulty: parseDifficulty(formData.get("jobDifficulty")),
        estimatedDurationMin: parseOptInt(formData.get("estimatedDurationMin")),
      },
    })
    revalidatePath("/dashboard/clientes")
    revalidatePath(`/dashboard/clientes/${id}`)
  }

  async function updatePropertyAction(formData: FormData) {
    "use server"
    const pId = parseStr(formData.get("id"))
    const street = parseStr(formData.get("street"))
    const city = parseStr(formData.get("city"))
    const zipCode = parseStr(formData.get("zipCode"))
    if (!pId || !street || !city || !zipCode) return
    await prisma.property.update({
      where: { id: pId },
      data: {
        street,
        city,
        zipCode,
        state: parseStr(formData.get("state")) || "NJ",
        label: parseOptStr(formData.get("label")),
        accessNotes: parseOptStr(formData.get("accessNotes")),
        lotSizeSqFt: parseOptPositiveInt(formData.get("lotSizeSqFt")),
        flowerBedsCount: parseOptPositiveInt(formData.get("flowerBedsCount")),
        shrubsCount: parseOptPositiveInt(formData.get("shrubsCount")),
        treesCount: parseOptPositiveInt(formData.get("treesCount")),
        turfAreaSqFt: parseOptPositiveInt(formData.get("turfAreaSqFt")),
        bedsAreaSqFt: parseOptPositiveInt(formData.get("bedsAreaSqFt")),
        hardscapeAreaSqFt: parseOptPositiveInt(formData.get("hardscapeAreaSqFt")),
        yardFront: formData.get("yardFront") === "on",
        yardBack: formData.get("yardBack") === "on",
        yardSides: formData.get("yardSides") === "on",
        jobDifficulty: parseDifficulty(formData.get("jobDifficulty")),
        estimatedDurationMin: parseOptInt(formData.get("estimatedDurationMin")),
      },
    })
    revalidatePath("/dashboard/clientes")
    revalidatePath(`/dashboard/clientes/${id}`)
  }

  async function deletePropertyAction(formData: FormData) {
    "use server"
    const pId = parseStr(formData.get("id"))
    const confirmed = formData.get("confirmDelete") === "on"
    if (!pId || !confirmed) return
    await prisma.property.delete({ where: { id: pId } })
    revalidatePath("/dashboard/clientes")
    revalidatePath(`/dashboard/clientes/${id}`)
  }

  async function assignPlanToCustomerAction(formData: FormData) {
    "use server"
    const customerId = parseStr(formData.get("customerId"))
    const planId = parseStr(formData.get("planId"))
    const startWeekRaw = parseStr(formData.get("startWeek"))
    const weekday = parseInt(String(formData.get("preferredWeekday") ?? ""), 10)
    if (!customerId || !planId) return
    if (startWeekRaw !== "THIS_WEEK" && startWeekRaw !== "NEXT_WEEK") return
    if (!Number.isFinite(weekday) || weekday < 1 || weekday > 7) return
    const propertyId = parseStr(formData.get("propertyId")) || null
    await assignMembershipWithSchedule(prisma, {
      customerId,
      planId,
      propertyId,
      startWeek: startWeekRaw,
      preferredWeekday: weekday,
      preferredTime: parseOptStr(formData.get("preferredTime")),
      notes: parseOptStr(formData.get("notes")),
    })
    revalidatePath("/dashboard/clientes")
    revalidatePath(`/dashboard/clientes/${customerId}`)
    revalidatePath("/dashboard/servicios")
    revalidatePath("/dashboard/scheduling")
  }

  // ── data ───────────────────────────────────────────────────
  const [customer, quotes, recentJobs, plans] = await Promise.all([
    prisma.customer.findUnique({
      where: { id },
      include: {
        properties: { orderBy: { createdAt: "asc" } },
        memberships: {
          include: {
            plan: true,
            property: { select: { street: true, city: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.quote.findMany({
      where: { customerId: id },
      include: {
        property: { select: { street: true, city: true } },
        items: { include: { service: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.job.findMany({
      where: {
        property: { customerId: id },
        status: { in: ["COMPLETED", "CANCELLED"] },
      },
      include: {
        property: { select: { street: true, city: true } },
        assignments: {
          include: { employee: { select: { firstName: true, lastName: true } } },
        },
        items: { include: { service: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: "desc" },
      take: 30,
    }),
    prisma.membershipPlan.findMany({
      where: { active: true },
      orderBy: [{ tier: "asc" }, { monthlyPrice: "asc" }],
    }),
  ])

  if (!customer) notFound()

  const activeMembership = customer.memberships.find((m) => m.status === "ACTIVE") ?? null
  const assignableProperties = customer.properties.filter(
    (p) => p.id !== activeMembership?.propertyId,
  )

  // billing calcs
  const approvedQuotes = quotes.filter((q) => q.status === "APPROVED")
  const sentQuotes = quotes.filter((q) => q.status === "SENT")
  const totalBilled = approvedQuotes.reduce((sum, q) => sum + Number(q.total), 0)
  const completedJobsCount = recentJobs.filter((j) => j.status === "COMPLETED").length

  const ic = "rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

  return (
    <section className="mx-auto max-w-5xl text-foreground">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground"
      >
        ← Clientes
      </Link>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display-family)] text-3xl font-semibold sm:text-4xl">
            {customer.firstName} {customer.lastName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/60">
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                customer.isActive
                  ? "border-emerald-600/30 bg-emerald-50 text-emerald-700"
                  : "border-rose-500/30 bg-rose-50 text-rose-600"
              }`}
            >
              {customer.isActive ? "Activo" : "Inactivo"}
            </span>
            {customer.difficulty && (
              <span
                className={`text-xs font-bold uppercase tracking-wider ${DIFFICULTY_COLOR[customer.difficulty] ?? ""}`}
              >
                ● {DIFFICULTY_LABEL[customer.difficulty]}
              </span>
            )}
            <span>{customer.phone}</span>
            {customer.email && <span>{customer.email}</span>}
          </div>
          {customer.notes && (
            <p className="mt-1.5 text-sm text-foreground/45 italic">"{customer.notes}"</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <EditDialog
            label="Editar"
            action={updateCustomerAction}
            triggerClassName="rounded-md border border-foreground/20 px-3 py-1.5 text-sm font-medium hover:bg-foreground/5"
          >
            <input type="hidden" name="id" value={customer.id} />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1">
                <span className={lbl}>Nombre</span>
                <input name="firstName" defaultValue={customer.firstName} required className={ic} />
              </label>
              <label className="grid gap-1">
                <span className={lbl}>Apellido</span>
                <input name="lastName" defaultValue={customer.lastName} required className={ic} />
              </label>
              <label className="grid gap-1">
                <span className={lbl}>Teléfono</span>
                <PhoneInput defaultValue={customer.phone} required className={ic} />
              </label>
              <label className="grid gap-1">
                <span className={lbl}>Email</span>
                <input name="email" type="email" defaultValue={customer.email ?? ""} className={ic} />
              </label>
              <label className="grid gap-1">
                <span className={lbl}>Dificultad del cliente</span>
                <select name="difficulty" defaultValue={customer.difficulty ?? ""} className={ic}>
                  <option value="">Sin especificar</option>
                  <option value="EASY">Fácil</option>
                  <option value="MEDIUM">Moderado</option>
                  <option value="HARD">Difícil</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className={lbl}>Notas</span>
                <input name="notes" defaultValue={customer.notes ?? ""} className={ic} />
              </label>
              <button
                type="submit"
                className="rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background transition hover:bg-foreground/85 md:col-span-2"
              >
                Guardar cambios
              </button>
            </div>
          </EditDialog>
          <CustomerActionsMenu
            customerId={customer.id}
            isActive={customer.isActive}
            toggleCustomerActiveAction={toggleCustomerActiveAction}
            deleteCustomerAction={deleteCustomerAction}
          />
        </div>
      </div>

      {/* Stats strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total facturado" value={fmtMoney(totalBilled)} />
        <StatCard
          label="Presupuestos abiertos"
          value={String(sentQuotes.length)}
          sub={`${quotes.length} total`}
        />
        <StatCard label="Visitas completadas" value={String(completedJobsCount)} />
        <StatCard
          label="Membresía"
          value={activeMembership ? activeMembership.plan.tier : "—"}
          sub={
            activeMembership
              ? `$${activeMembership.plan.monthlyPrice.toString()}/mes`
              : "Sin plan activo"
          }
          highlight={!!activeMembership}
        />
      </div>

      {/* Properties */}
      <div className="mt-8 rounded-xl border border-foreground/10 bg-background p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display-family)] text-lg font-semibold">
              Propiedades
            </h2>
            <p className="text-sm text-foreground/55">
              {customer.properties.length === 0
                ? "Sin propiedades registradas."
                : `${customer.properties.length} propiedad${customer.properties.length !== 1 ? "es" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/clientes/${customer.id}/propiedades/nueva`}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
            >
              + Nueva propiedad
            </Link>
            <PropertiesDialog
              customerName={`${customer.firstName} ${customer.lastName}`}
              customerId={customer.id}
              properties={customer.properties}
              updatePropertyAction={updatePropertyAction}
              deletePropertyAction={deletePropertyAction}
              createPropertyAction={createPropertyAction}
              allowCreate={false}
            />
          </div>
        </div>

        {customer.properties.length > 0 && (
          <div className="mt-4 space-y-2">
            {customer.properties.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-foreground/8 bg-foreground/3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sm">
                    {p.label ? (
                      <><span className="text-foreground/50">{p.label} · </span>{p.street}</>
                    ) : p.street}
                    , {p.city} {p.state}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/45">{p.zipCode}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  {(p.flowerBedsCount ?? 0) > 0 ? (
                    <span className="rounded border border-foreground/15 bg-foreground/3 px-1.5 py-0.5 font-semibold text-foreground/60">
                      Camas: {p.flowerBedsCount}
                    </span>
                  ) : null}
                  {(p.shrubsCount ?? 0) > 0 ? (
                    <span className="rounded border border-foreground/15 bg-foreground/3 px-1.5 py-0.5 font-semibold text-foreground/60">
                      Arbustos: {p.shrubsCount}
                    </span>
                  ) : null}
                  {(p.treesCount ?? 0) > 0 ? (
                    <span className="rounded border border-foreground/15 bg-foreground/3 px-1.5 py-0.5 font-semibold text-foreground/60">
                      Árboles: {p.treesCount}
                    </span>
                  ) : null}
                  {(p.turfAreaSqFt ?? 0) > 0 ? (
                    <span className="rounded border border-foreground/15 bg-foreground/3 px-1.5 py-0.5 font-semibold text-foreground/60">
                      Césped: {p.turfAreaSqFt!.toLocaleString()} sqft
                    </span>
                  ) : null}
                  {(p.bedsAreaSqFt ?? 0) > 0 ? (
                    <span className="rounded border border-foreground/15 bg-foreground/3 px-1.5 py-0.5 font-semibold text-foreground/60">
                      Camas sqft: {p.bedsAreaSqFt!.toLocaleString()} sqft
                    </span>
                  ) : null}
                  {(p.hardscapeAreaSqFt ?? 0) > 0 ? (
                    <span className="rounded border border-foreground/15 bg-foreground/3 px-1.5 py-0.5 font-semibold text-foreground/60">
                      Hardscape: {p.hardscapeAreaSqFt!.toLocaleString()} sqft
                    </span>
                  ) : null}
                  {p.yardFront ? (
                    <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                      Frente
                    </span>
                  ) : null}
                  {p.yardBack ? (
                    <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                      Patio
                    </span>
                  ) : null}
                  {p.yardSides ? (
                    <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                      Laterales
                    </span>
                  ) : null}
                  {p.jobDifficulty && (
                    <span
                      className={`rounded border px-1.5 py-0.5 font-bold uppercase tracking-wide ${
                        p.jobDifficulty === "EASY"
                          ? "border-emerald-300/40 bg-emerald-50/60 text-emerald-600"
                          : p.jobDifficulty === "MEDIUM"
                            ? "border-amber-300/40 bg-amber-50/60 text-amber-600"
                            : "border-rose-300/40 bg-rose-50/60 text-rose-600"
                      }`}
                    >
                      {DIFFICULTY_LABEL[p.jobDifficulty]}
                    </span>
                  )}
                  {(p.estimatedDurationMin ?? 0) > 0 && (
                    <span className="text-foreground/45">~{p.estimatedDurationMin} min</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Membership */}
      <div className="mt-4 rounded-xl border border-foreground/10 bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display-family)] text-lg font-semibold">
              Membresía
            </h2>
            {activeMembership ? (
              <div className="mt-2 space-y-1 text-sm">
                <p className="font-semibold">{activeMembership.plan.name}</p>
                <p className="text-foreground/60">
                  {activeMembership.plan.tier} · ${activeMembership.plan.monthlyPrice.toString()}/mes
                  · {activeMembership.plan.visitsPerMonth} visitas/mes
                </p>
                {activeMembership.property && (
                  <p className="text-foreground/50 text-xs">
                    Propiedad: {activeMembership.property.street}, {activeMembership.property.city}
                  </p>
                )}
                <p className="text-foreground/40 text-xs">
                  Desde {fmtDate(activeMembership.startsAt)}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-foreground/50">Sin plan activo.</p>
            )}
          </div>

          {plans.length > 0 && (
            <EditDialog
              label={activeMembership ? "Cambiar plan" : "Asignar plan"}
              action={assignPlanToCustomerAction}
              triggerClassName="rounded-md border border-primary/35 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/18"
            >
              <input type="hidden" name="customerId" value={customer.id} />
              <label className="grid gap-1">
                <span className={lbl}>Plan de membresía</span>
                <select name="planId" required className={ic}>
                  <option value="">Selecciona un plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {plan.tier} (${plan.monthlyPrice.toString()}/mes)
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 grid gap-1">
                <span className={lbl}>Primera semana</span>
                <select name="startWeek" required className={ic}>
                  <option value="THIS_WEEK">Esta semana</option>
                  <option value="NEXT_WEEK">Próxima semana</option>
                </select>
              </label>
              <label className="mt-3 grid gap-1">
                <span className={lbl}>Día de visita</span>
                <select name="preferredWeekday" required className={ic} defaultValue="2">
                  <option value="1">Lunes</option>
                  <option value="2">Martes</option>
                  <option value="3">Miércoles</option>
                  <option value="4">Jueves</option>
                  <option value="5">Viernes</option>
                  <option value="6">Sábado</option>
                  <option value="7">Domingo</option>
                </select>
              </label>
              <label className="mt-3 grid gap-1">
                <span className={lbl}>Hora de visita</span>
                <input name="preferredTime" placeholder="Ej. 9:00 AM" className={ic} />
              </label>
              {assignableProperties.length === 0 ? (
                <p className="mt-3 text-xs text-amber-600">
                  Sin propiedad disponible — agrega una dirección primero.
                </p>
              ) : assignableProperties.length === 1 ? (
                <input type="hidden" name="propertyId" value={assignableProperties[0]!.id} />
              ) : (
                <label className="mt-3 grid gap-1">
                  <span className={lbl}>Propiedad a programar</span>
                  <select name="propertyId" required className={ic} defaultValue="">
                    <option value="" disabled>Selecciona una propiedad…</option>
                    {assignableProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {(p.label ? `${p.label} · ` : "") + `${p.street}, ${p.city}`}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="mt-3 grid gap-1">
                <span className={lbl}>Notas</span>
                <input name="notes" placeholder="Opcional" className={ic} />
              </label>
              <p className="mt-3 text-xs text-foreground/40">
                Si ya tenía un plan activo, se cancelará y quedará este como vigente.
              </p>
              <button
                type="submit"
                className="mt-4 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
              >
                Guardar asignación
              </button>
            </EditDialog>
          )}
        </div>
      </div>

      {/* Billing */}
      <div className="mt-4 rounded-xl border border-foreground/10 bg-background p-5">
        <h2 className="font-[family-name:var(--font-display-family)] text-lg font-semibold">
          Facturación
        </h2>
        <p className="mt-0.5 text-sm text-foreground/55">
          Presupuestos y historial de visitas del cliente.
        </p>

        {/* Quotes */}
        <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-foreground/45">
          Presupuestos
        </h3>
        {quotes.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/45">Sin presupuestos registrados.</p>
        ) : (
          <div className="mt-2 overflow-hidden rounded-lg border border-foreground/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-foreground/8 bg-foreground/3">
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                      Fecha
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                      Propiedad
                    </th>
                    <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                      Items
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                      Estado
                    </th>
                    <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr
                      key={q.id}
                      className="border-b border-foreground/6 last:border-b-0 hover:bg-foreground/2"
                    >
                      <td className="px-4 py-2.5 text-foreground/70">
                        {fmtDate(q.createdAt)}
                        <span className="ml-2 text-[10px] text-foreground/35">
                          #{q.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-foreground/70">
                        {q.property
                          ? `${q.property.street}, ${q.property.city}`
                          : <span className="text-foreground/35">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-center tabular-nums text-foreground/60">
                        {q.items.length}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${QUOTE_STATUS_BADGE[q.status] ?? ""}`}
                        >
                          {QUOTE_STATUS_LABEL[q.status] ?? q.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                        {fmtMoney(Number(q.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {approvedQuotes.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-foreground/10 bg-foreground/3">
                      <td
                        colSpan={4}
                        className="px-4 py-2 text-right text-xs font-semibold text-foreground/50"
                      >
                        Total aprobado
                      </td>
                      <td className="px-4 py-2 text-right font-bold tabular-nums text-emerald-600">
                        {fmtMoney(totalBilled)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* Visit history */}
        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-foreground/45">
          Historial de visitas
        </h3>
        {recentJobs.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/45">Sin visitas completadas o canceladas.</p>
        ) : (
          <div className="mt-2 overflow-hidden rounded-lg border border-foreground/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-foreground/8 bg-foreground/3">
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                      Fecha
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                      Trabajo
                    </th>
                    <th className="hidden px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/40 md:table-cell">
                      Propiedad
                    </th>
                    <th className="hidden px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/40 md:table-cell">
                      Equipo
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((job) => {
                    const crew = job.assignments.length
                      ? job.assignments
                          .map((a) => `${a.employee.firstName} ${a.employee.lastName}`)
                          .join(", ")
                      : "—"
                    return (
                      <tr
                        key={job.id}
                        className="border-b border-foreground/6 last:border-b-0 hover:bg-foreground/2"
                      >
                        <td className="px-4 py-2.5 text-foreground/70">
                          {fmtDate(job.scheduledAt)}
                        </td>
                        <td className="px-4 py-2.5 font-medium">{job.title}</td>
                        <td className="hidden px-4 py-2.5 text-foreground/60 md:table-cell">
                          {job.property.street}, {job.property.city}
                        </td>
                        <td className="hidden px-4 py-2.5 text-foreground/55 md:table-cell">
                          {crew}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${JOB_STATUS_BADGE[job.status] ?? ""}`}
                          >
                            {job.status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ── sub-component ──────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-primary/30 bg-primary/8"
          : "border-foreground/10 bg-background"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-bold tabular-nums ${highlight ? "text-primary" : ""}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-foreground/45">{sub}</p>}
    </div>
  )
}

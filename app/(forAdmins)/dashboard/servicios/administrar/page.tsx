import Link from "next/link"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ActionBanner } from "@/components/ui/ActionBanner"
import { ActionError, requireAdmin, runAction, withError } from "@/lib/admin-action"
import { AssignPlanCustomerPropertyFields } from "@/components/ui/AssignPlanCustomerPropertyFields"
import { ServiceCatalogPricingFields } from "@/components/ui/ServiceCatalogPricingFields"
import { assignMembershipWithSchedule } from "@/lib/membership-plan-assign"
import { serviceCatalogPricingFromForm } from "@/lib/servicios-catalog-form"

function parseDecimal(input: FormDataEntryValue | null): number | null {
  if (typeof input !== "string") return null
  const raw = input.trim()
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function parseString(input: FormDataEntryValue | null): string | null {
  if (typeof input !== "string") return null
  const value = input.trim()
  return value || null
}

function parseIncludes(input: FormDataEntryValue | null): string[] {
  if (typeof input !== "string") return []
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function SectionHeader({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
        {n}
      </span>
      <div>
        <h2 className="font-display text-lg font-semibold leading-tight">{title}</h2>
        <p className="mt-0.5 text-xs text-foreground/50">{hint}</p>
      </div>
    </div>
  )
}

const PAGE = "/dashboard/servicios/administrar"

type AdministrarPageProps = {
  searchParams?: Promise<{ error?: string; ok?: string }>
}

export default async function AdministrarCatalogoPage({ searchParams }: AdministrarPageProps) {
  const banner = (await searchParams) ?? {}

  async function createServiceAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("catalog:write")
    if (!auth.ok) redirect(withError(PAGE, auth.code))

    const result = await runAction(
      auth.user,
      { action: "service.create", entityType: "ServiceCatalog" },
      async () => {
        const name = String(formData.get("name") ?? "").trim()
        const slug = String(formData.get("slug") ?? "").trim()
        const category = String(formData.get("category") ?? "CORE")
        if (!name || !slug) throw new ActionError("datos")
        await prisma.serviceCatalog.create({
          data: {
            name, slug,
            category: category as "CORE" | "ADD_ON" | "CLEANUP",
            description: parseString(formData.get("description")),
            details: parseString(formData.get("details")),
            pricingUnit: parseString(formData.get("pricingUnit")),
            ...serviceCatalogPricingFromForm(formData),
            memberDiscount: parseDecimal(formData.get("memberDiscount")),
            includes: parseIncludes(formData.get("includes")),
            estimatedMinutes: Number(formData.get("estimatedMinutes") ?? 0) || null,
            active: formData.get("active") === "on",
          },
        })
      }
    )
    if (!result.ok) redirect(withError(PAGE, result.code))

    revalidatePath("/dashboard/servicios")
    revalidatePath(PAGE)
    redirect("/dashboard/servicios")
  }

  async function createPlanAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("catalog:write")
    if (!auth.ok) redirect(withError(PAGE, auth.code))

    const result = await runAction(
      auth.user,
      { action: "plan.create", entityType: "MembershipPlan" },
      async () => {
        const name = String(formData.get("name") ?? "").trim()
        const slug = String(formData.get("slug") ?? "").trim()
        const tier = String(formData.get("tier") ?? "SMALL")
        const monthlyPrice = parseDecimal(formData.get("monthlyPrice"))
        if (!name || !slug || monthlyPrice === null) throw new ActionError("datos")
        await prisma.membershipPlan.create({
          data: {
            name, slug,
            tier: tier as "SMALL" | "MEDIUM" | "LARGE",
            description: parseString(formData.get("description")),
            monthlyPrice,
            visitsPerMonth: Number(formData.get("visitsPerMonth") ?? 4) || 4,
            addOnDiscount: parseDecimal(formData.get("addOnDiscount")) ?? 0,
            priorityScheduling: formData.get("priorityScheduling") === "on",
            benefits: parseIncludes(formData.get("benefits")),
            active: formData.get("active") === "on",
          },
        })
      }
    )
    if (!result.ok) redirect(withError(PAGE, result.code))

    revalidatePath("/dashboard/servicios")
    revalidatePath(PAGE)
    redirect("/dashboard/servicios")
  }

  async function assignPlanAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("customers:write")
    if (!auth.ok) redirect(withError(PAGE, auth.code))

    const result = await runAction(
      auth.user,
      { action: "membership.assign", entityType: "Customer", entityId: String(formData.get("customerId") ?? "") },
      async () => {
        const customerId = String(formData.get("customerId") ?? "")
        const planId = String(formData.get("planId") ?? "")
        const propertyIdRaw = String(formData.get("propertyId") ?? "").trim()
        const startWeekRaw = String(formData.get("startWeek") ?? "").trim()
        const weekday = Number.parseInt(String(formData.get("preferredWeekday") ?? ""), 10)
        if (!customerId || !planId) throw new ActionError("datos")
        if (startWeekRaw !== "THIS_WEEK" && startWeekRaw !== "NEXT_WEEK") throw new ActionError("datos")
        if (!Number.isFinite(weekday) || weekday < 1 || weekday > 7) throw new ActionError("datos")

        // The property must belong to the customer being assigned; both ids
        // arrive from the same form and were never cross-checked.
        if (propertyIdRaw) {
          const owned = await prisma.property.findFirst({
            where: { id: propertyIdRaw, customerId, archivedAt: null },
            select: { id: true },
          })
          if (!owned) throw new ActionError("no_encontrado")
        }

        await assignMembershipWithSchedule(prisma, {
          customerId,
          planId,
          propertyId: propertyIdRaw || null,
          startWeek: startWeekRaw,
          preferredWeekday: weekday,
          preferredTime: parseString(formData.get("preferredTime")),
          notes: parseString(formData.get("notes")),
        })
      }
    )
    if (!result.ok) redirect(withError(PAGE, result.code))

    revalidatePath("/dashboard/servicios")
    revalidatePath("/dashboard/clientes")
    revalidatePath("/dashboard/scheduling")
    redirect("/dashboard/servicios")
  }

  const [plans, customers] = await Promise.all([
    prisma.membershipPlan.findMany({
      where: { active: true, isCustom: false },
      orderBy: [{ tier: "asc" }, { monthlyPrice: "asc" }],
    }),
    prisma.customer.findMany({
      // Archived customers must not reappear in pickers.
      where: { isActive: true, archivedAt: null },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 300,
      include: {
        properties: {
          where: { archivedAt: null },
          orderBy: { createdAt: "asc" },
          select: { id: true, label: true, street: true, city: true },
        },
      },
    }),
  ])

  const assignPlanCustomers = customers.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    properties: c.properties.map((p) => ({ id: p.id, label: p.label, street: p.street, city: p.city })),
  }))

  const ic = "rounded-lg border border-foreground/20 bg-white/60 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

  return (
    <section className="text-foreground">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/servicios" className="text-sm text-foreground/55 transition hover:text-foreground">
          ← Volver a servicios
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <ActionBanner error={banner.error} notice={banner.ok} />
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin catalog</p>
            <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Administrar catálogo</h1>
            <p className="mt-2 max-w-2xl text-sm text-foreground/55">
              Crea servicios y add-ons, define planes de membresía y asigna planes a clientes con su horario preferido.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* 1 · Nuevo servicio */}
        <section className="rounded-2xl border border-foreground/12 bg-background p-6 xl:col-span-2">
          <SectionHeader n={1} title="Nuevo servicio o add-on" hint="Define nombre, categoría, precios y detalle." />
          <form action={createServiceAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1">
              <span className={lbl}>Nombre</span>
              <input name="name" required placeholder="Ej. Lawn Maintenance" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Slug</span>
              <input name="slug" required placeholder="lawn-maintenance" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Categoría</span>
              <select name="category" className={ic}>
                <option value="CORE">Core (principal)</option>
                <option value="ADD_ON">Add-on (complemento)</option>
                <option value="CLEANUP">Cleanup (limpieza)</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Unidad de precio</span>
              <input name="pricingUnit" placeholder="por visita" className={ic} />
            </label>

            <ServiceCatalogPricingFields />

            <label className="grid gap-1">
              <span className={lbl}>Descuento miembros %</span>
              <input name="memberDiscount" type="number" min="0" step="0.01" placeholder="15" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Minutos estimados</span>
              <input name="estimatedMinutes" type="number" min="0" step="1" placeholder="30" className={ic} />
            </label>
            <label className="grid gap-1 md:col-span-2">
              <span className={lbl}>Descripción corta</span>
              <input name="description" placeholder="Aparece bajo el nombre" className={ic} />
            </label>
            <label className="grid gap-1 md:col-span-2">
              <span className={lbl}>Detalle (icono i)</span>
              <textarea name="details" rows={3} placeholder="Explicación completa que se muestra al tocar el icono (i)" className={ic} />
            </label>
            <label className="grid gap-1 md:col-span-2">
              <span className={lbl}>Incluye (uno por línea)</span>
              <textarea name="includes" rows={4} placeholder={"Mowing\nTrimming\nBlower cleanup"} className={ic} />
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/65 md:col-span-2">
              <input type="checkbox" name="active" defaultChecked />
              Activo
            </label>
            <button type="submit" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 md:col-span-2">
              Guardar servicio
            </button>
          </form>
        </section>

        {/* 2 · Nuevo plan */}
        <section className="rounded-2xl border border-foreground/12 bg-background p-6">
          <SectionHeader n={2} title="Nuevo plan" hint="Membresía mensual con beneficios." />
          <form action={createPlanAction} className="mt-5 grid gap-4">
            <label className="grid gap-1">
              <span className={lbl}>Nombre</span>
              <input name="name" required placeholder="Membership Medium" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Slug</span>
              <input name="slug" required placeholder="membership-medium" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Tier</span>
              <select name="tier" className={ic}>
                <option value="SMALL">Small</option>
                <option value="MEDIUM">Medium</option>
                <option value="LARGE">Large</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Precio mensual</span>
              <input name="monthlyPrice" required type="number" min="0" step="0.01" placeholder="300" className={ic} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className={lbl}>Visitas/mes</span>
                <input name="visitsPerMonth" type="number" min="1" step="1" defaultValue={4} className={ic} />
              </label>
              <label className="grid gap-1">
                <span className={lbl}>Desc. add-ons %</span>
                <input name="addOnDiscount" type="number" min="0" step="0.01" defaultValue={15} className={ic} />
              </label>
            </div>
            <label className="grid gap-1">
              <span className={lbl}>Descripción</span>
              <input name="description" placeholder="Descripción del plan" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Beneficios (uno por línea)</span>
              <textarea name="benefits" rows={4} placeholder={"Weekly service\nPriority scheduling\n15% add-on discount"} className={ic} />
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/65">
              <input type="checkbox" name="priorityScheduling" defaultChecked />
              Priority scheduling
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/65">
              <input type="checkbox" name="active" defaultChecked />
              Activo
            </label>
            <button type="submit" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90">
              Guardar plan
            </button>
          </form>
        </section>
      </div>

      {/* 3 · Asignar plan */}
      <section className="mt-6 rounded-2xl border border-foreground/12 bg-background p-6">
        <SectionHeader n={3} title="Asignar plan a cliente" hint="Define el plan y horario preferido del cliente." />
        {plans.length === 0 ? (
          <p className="mt-5 rounded-lg border border-dashed border-foreground/20 px-4 py-6 text-sm text-foreground/50">
            Primero crea un plan en la sección 2 para poder asignarlo.
          </p>
        ) : (
          <form action={assignPlanAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <AssignPlanCustomerPropertyFields customers={assignPlanCustomers} ic={ic} lbl={lbl} />
            <label className="grid gap-1 md:col-span-2">
              <span className={lbl}>Plan</span>
              <select name="planId" required className={ic}>
                <option value="">Selecciona un plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} (${plan.monthlyPrice.toString()}/mes)
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Primera semana</span>
              <select name="startWeek" required className={ic}>
                <option value="THIS_WEEK">Esta semana</option>
                <option value="NEXT_WEEK">Próxima semana</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Día de visita (semanal)</span>
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
            <label className="grid gap-1 md:col-span-2">
              <span className={lbl}>Hora</span>
              <input name="preferredTime" placeholder="Ej. 9:00 o 2:30 PM" className={ic} />
            </label>
            <label className="grid gap-1 md:col-span-2">
              <span className={lbl}>Notas</span>
              <input name="notes" placeholder="Notas internas" className={ic} />
            </label>
            <p className="text-xs text-foreground/50 md:col-span-2">
              Si el cliente tiene varias direcciones, elige en cuál programar las visitas. Con una sola dirección se usa
              automáticamente. Las visitas se crean en Scheduling (una por semana según el plan).
            </p>
            <button type="submit" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 md:col-span-2">
              Asignar plan
            </button>
          </form>
        )}
      </section>
    </section>
  )
}

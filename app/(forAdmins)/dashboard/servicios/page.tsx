import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { AssignPlanCustomerPropertyFields } from "@/components/ui/AssignPlanCustomerPropertyFields"
import { EditDialog } from "@/components/ui/EditDialog"
import { assignMembershipWithSchedule } from "@/lib/membership-plan-assign"

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

export default async function ServiciosAdminPage() {
  async function createServiceAction(formData: FormData) {
    "use server"
    const name = String(formData.get("name") ?? "").trim()
    const slug = String(formData.get("slug") ?? "").trim()
    const category = String(formData.get("category") ?? "CORE")
    if (!name || !slug) return
    await prisma.serviceCatalog.create({
      data: {
        name, slug,
        category: category as "CORE" | "ADD_ON" | "CLEANUP",
        description: parseString(formData.get("description")),
        pricingUnit: parseString(formData.get("pricingUnit")),
        defaultPrice: parseDecimal(formData.get("defaultPrice")),
        smallPrice: parseDecimal(formData.get("smallPrice")),
        mediumPrice: parseDecimal(formData.get("mediumPrice")),
        largePrice: parseDecimal(formData.get("largePrice")),
        startingAtPrice: parseDecimal(formData.get("startingAtPrice")),
        maxRangePrice: parseDecimal(formData.get("maxRangePrice")),
        memberDiscount: parseDecimal(formData.get("memberDiscount")),
        includes: parseIncludes(formData.get("includes")),
        estimatedMinutes: Number(formData.get("estimatedMinutes") ?? 0) || null,
        active: formData.get("active") === "on",
      },
    })
    revalidatePath("/dashboard/servicios")
  }

  async function updateServiceAction(formData: FormData) {
    "use server"
    const id = String(formData.get("id") ?? "")
    if (!id) return
    const name = String(formData.get("name") ?? "").trim()
    const slug = String(formData.get("slug") ?? "").trim()
    const category = String(formData.get("category") ?? "CORE")
    if (!name || !slug) return
    await prisma.serviceCatalog.update({
      where: { id },
      data: {
        name, slug,
        category: category as "CORE" | "ADD_ON" | "CLEANUP",
        description: parseString(formData.get("description")),
        pricingUnit: parseString(formData.get("pricingUnit")),
        defaultPrice: parseDecimal(formData.get("defaultPrice")),
        smallPrice: parseDecimal(formData.get("smallPrice")),
        mediumPrice: parseDecimal(formData.get("mediumPrice")),
        largePrice: parseDecimal(formData.get("largePrice")),
        startingAtPrice: parseDecimal(formData.get("startingAtPrice")),
        maxRangePrice: parseDecimal(formData.get("maxRangePrice")),
        memberDiscount: parseDecimal(formData.get("memberDiscount")),
        includes: parseIncludes(formData.get("includes")),
        estimatedMinutes: Number(formData.get("estimatedMinutes") ?? 0) || null,
        active: formData.get("active") === "on",
      },
    })
    revalidatePath("/dashboard/servicios")
  }

  async function toggleServiceActiveAction(formData: FormData) {
    "use server"
    const id = String(formData.get("id") ?? "")
    const nextActive = String(formData.get("nextActive") ?? "") === "true"
    if (!id) return
    await prisma.serviceCatalog.update({ where: { id }, data: { active: nextActive } })
    revalidatePath("/dashboard/servicios")
  }

  async function deleteServiceAction(formData: FormData) {
    "use server"
    const id = String(formData.get("id") ?? "")
    const confirmDelete = String(formData.get("confirmDelete") ?? "") === "on"
    if (!id || !confirmDelete) return
    try {
      await prisma.serviceCatalog.delete({ where: { id } })
    } catch {
      await prisma.serviceCatalog.update({ where: { id }, data: { active: false } })
    }
    revalidatePath("/dashboard/servicios")
  }

  async function createPlanAction(formData: FormData) {
    "use server"
    const name = String(formData.get("name") ?? "").trim()
    const slug = String(formData.get("slug") ?? "").trim()
    const tier = String(formData.get("tier") ?? "SMALL")
    const monthlyPrice = parseDecimal(formData.get("monthlyPrice"))
    if (!name || !slug || monthlyPrice === null) return
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
    revalidatePath("/dashboard/servicios")
  }

  async function updatePlanAction(formData: FormData) {
    "use server"
    const id = String(formData.get("id") ?? "")
    if (!id) return
    const name = String(formData.get("name") ?? "").trim()
    const slug = String(formData.get("slug") ?? "").trim()
    const tier = String(formData.get("tier") ?? "SMALL")
    const monthlyPrice = parseDecimal(formData.get("monthlyPrice"))
    if (!name || !slug || monthlyPrice === null) return
    await prisma.membershipPlan.update({
      where: { id },
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
    revalidatePath("/dashboard/servicios")
  }

  async function assignPlanAction(formData: FormData) {
    "use server"
    const customerId = String(formData.get("customerId") ?? "")
    const planId = String(formData.get("planId") ?? "")
    const propertyIdRaw = String(formData.get("propertyId") ?? "").trim()
    const startWeekRaw = String(formData.get("startWeek") ?? "").trim()
    const weekday = Number.parseInt(String(formData.get("preferredWeekday") ?? ""), 10)
    if (!customerId || !planId) return
    if (startWeekRaw !== "THIS_WEEK" && startWeekRaw !== "NEXT_WEEK") return
    if (!Number.isFinite(weekday) || weekday < 1 || weekday > 7) return

    await assignMembershipWithSchedule(prisma, {
      customerId,
      planId,
      propertyId: propertyIdRaw || null,
      startWeek: startWeekRaw,
      preferredWeekday: weekday,
      preferredTime: parseString(formData.get("preferredTime")),
      notes: parseString(formData.get("notes")),
    })
    revalidatePath("/dashboard/servicios")
    revalidatePath("/dashboard/clientes")
    revalidatePath("/dashboard/scheduling")
  }

  const [services, plans, customers, activeMemberships] = await Promise.all([
    prisma.serviceCatalog.findMany({
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.membershipPlan.findMany({
      where: { active: true },
      orderBy: [{ tier: "asc" }, { monthlyPrice: "asc" }],
    }),
    prisma.customer.findMany({
      where: { isActive: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 300,
      include: {
        properties: {
          orderBy: { createdAt: "asc" },
          select: { id: true, label: true, street: true, city: true },
        },
      },
    }),
    prisma.customerMembership.findMany({
      where: { status: "ACTIVE" },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        plan: { select: { name: true, monthlyPrice: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  const assignPlanCustomers = customers.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    properties: c.properties.map((p) => ({
      id: p.id,
      label: p.label,
      street: p.street,
      city: p.city,
    })),
  }))

  const coreServices = services.filter((s) => s.category === "CORE")
  const addOnServices = services.filter((s) => s.category === "ADD_ON")
  const cleanupServices = services.filter((s) => s.category === "CLEANUP")
  const lawnBase = services.find((s) => s.slug === "lawn-maintenance")

  const ic = "rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

  const statusBadge = (active: boolean) =>
    `shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
      active
        ? "border-emerald-600/30 bg-emerald-50 text-emerald-700"
        : "border-rose-500/30 bg-rose-50 text-rose-600"
    }`

  return (
    <section className="mx-auto max-w-7xl text-foreground">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin catalog</p>
          <h1 className="mt-1 font-(family-name:--font-display-family) text-3xl font-semibold sm:text-4xl">
            Servicios y planes
      </h1>
          <p className="mt-2 text-sm text-foreground/55">
            Gestiona servicios, precios, add-ons, membresías y asignaciones.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {services.filter((s) => s.active).length} activos
          </span>
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {plans.length} planes
          </span>
          <span className="rounded-full border border-primary/30 bg-primary/8 px-3 py-1 font-semibold text-primary">
            {activeMemberships.length} miembros
          </span>
        </div>
      </div>

      {/* ── PRICING COMPARISON ─────────────────────────────────── */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-forest text-cream">
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-moss-light">Comparativa de precios</p>
              <h2 className="mt-0.5 font-(family-name:--font-display-family) text-xl font-semibold">
                Membresía vs. Sin membresía
              </h2>
            </div>
            <span className="rounded-full border border-moss/40 bg-moss/20 px-3 py-1 text-xs font-semibold text-moss-light">
              4 visitas / mes
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {(
              [
                { label: "Small", perVisit: lawnBase?.smallPrice, plan: plans.find((p) => p.tier === "SMALL") },
                { label: "Medium", perVisit: lawnBase?.mediumPrice, plan: plans.find((p) => p.tier === "MEDIUM") },
                { label: "Large", perVisit: lawnBase?.largePrice, plan: plans.find((p) => p.tier === "LARGE") },
              ] as const
            ).map(({ label, perVisit, plan }) => {
              const pv = perVisit ? Number(perVisit) : null
              const monthly = pv ? pv * 4 : null
              const memberPrice = plan ? Number(plan.monthlyPrice) : null
              const savings = monthly && memberPrice ? monthly - memberPrice : null
              return (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-sm font-semibold text-cream/65">{label} yard</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-black/30 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-cream/40">Sin plan</p>
                      <p className="mt-2 text-2xl font-bold">{pv ? `$${pv}` : "—"}</p>
                      <p className="text-[11px] text-cream/40">por visita</p>
                      <p className="mt-2 text-xs text-cream/50">~{monthly ? `$${monthly}` : "—"}/mes</p>
                      <p className="mt-0.5 text-[10px] text-cream/30">0% add-ons</p>
                    </div>
                    <div className="rounded-lg border border-moss/35 bg-moss/15 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-moss-light">Miembro</p>
                      <p className="mt-2 text-2xl font-bold">{memberPrice ? `$${memberPrice}` : "—"}</p>
                      <p className="text-[11px] text-moss-light/70">por mes</p>
                      {savings !== null && savings > 0 && (
                        <p className="mt-2 text-xs font-bold text-moss-light">−${savings}/mes</p>
                      )}
                      <p className="mt-0.5 text-[10px] text-moss-light/70">15% add-ons</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── SERVICE CATALOG ────────────────────────────────────── */}
      <div className="mt-10">
        <h2 className="font-(family-name:--font-display-family) text-2xl font-semibold">Catálogo de servicios</h2>
        <p className="mt-1 text-sm text-foreground/50">
          {services.filter((s) => s.active).length} activos · {services.length} total
        </p>

        {/* CORE */}
        {coreServices.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
                Core
              </span>
              <span className="text-xs text-foreground/40">{coreServices.length} servicios</span>
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {coreServices.map((service) => {
                const inc = Array.isArray(service.includes) ? (service.includes as string[]) : []
                return (
                  <article key={service.id} className="rounded-xl border border-foreground/12 bg-white/50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-(family-name:--font-display-family) text-lg font-semibold leading-snug">
                            {service.name}
                          </h3>
                          <span className={statusBadge(service.active)}>
                            {service.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        {service.description && (
                          <p className="mt-0.5 text-sm text-foreground/50">{service.description}</p>
                        )}
                      </div>
                      <details className="relative shrink-0">
                        <summary className="cursor-pointer list-none rounded-md border border-foreground/15 px-2 py-1 text-sm transition hover:bg-foreground/8">
                          ···
                        </summary>
                        <div className="absolute right-0 z-10 mt-1 w-52 rounded-lg border border-foreground/12 bg-[#fdfcf8] p-1.5 shadow-xl">
                          <form action={toggleServiceActiveAction}>
                            <input type="hidden" name="id" value={service.id} />
                            <input type="hidden" name="nextActive" value={service.active ? "false" : "true"} />
                            <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-foreground/5">
                              {service.active ? "Desactivar" : "Activar"}
                            </button>
                          </form>
                          <div className="my-1 h-px bg-foreground/8" />
                          <form action={deleteServiceAction}>
                            <input type="hidden" name="id" value={service.id} />
                            <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs text-foreground/50 transition hover:bg-foreground/5">
                              <input type="checkbox" name="confirmDelete" />
                              Confirmar eliminación
                            </label>
                            <button type="submit" className="mt-0.5 w-full rounded-md px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50">
                              Eliminar
                            </button>
                          </form>
                        </div>
                      </details>
                    </div>

                    {(service.smallPrice || service.mediumPrice || service.largePrice) && (
                      <div className="mt-4 grid grid-cols-3 divide-x divide-foreground/10 overflow-hidden rounded-lg border border-foreground/12">
                        {[
                          { label: "Small", value: service.smallPrice },
                          { label: "Medium", value: service.mediumPrice },
                          { label: "Large", value: service.largePrice },
                        ].map(({ label, value }) => (
                          <div key={label} className="py-3 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">{label}</p>
                            <p className="mt-1 text-xl font-bold">{value ? `$${value.toString()}` : "—"}</p>
                            {service.pricingUnit && (
                              <p className="text-[10px] text-foreground/35">{service.pricingUnit}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {service.startingAtPrice && !service.smallPrice && (
                      <div className="mt-4 flex items-baseline gap-2 rounded-lg border border-foreground/12 px-4 py-3">
                        <span className="text-xs uppercase tracking-wider text-foreground/40">Desde</span>
                        <span className="text-2xl font-bold">${service.startingAtPrice.toString()}</span>
                        {service.maxRangePrice && (
                          <span className="text-sm text-foreground/50">hasta ${service.maxRangePrice.toString()}</span>
                        )}
                        {service.pricingUnit && (
                          <span className="ml-auto text-xs text-foreground/35">{service.pricingUnit}</span>
                        )}
                      </div>
                    )}

                    {inc.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                        {inc.map((item) => (
                          <li key={item} className="flex items-center gap-1.5 text-sm text-foreground/60">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4">
                      <EditDialog label="Editar servicio" action={updateServiceAction}>
                        <input type="hidden" name="id" value={service.id} />
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Nombre</span>
                            <input name="name" defaultValue={service.name} required className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Slug</span>
                            <input name="slug" defaultValue={service.slug} required className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Categoría</span>
                            <select name="category" defaultValue={service.category} className={ic}>
                              <option value="CORE">Core</option>
                              <option value="ADD_ON">Add-on</option>
                              <option value="CLEANUP">Cleanup</option>
                            </select>
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Unidad de precio</span>
                            <input name="pricingUnit" defaultValue={service.pricingUnit ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Precio Small</span>
                            <input name="smallPrice" type="number" step="0.01" defaultValue={service.smallPrice?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Precio Medium</span>
                            <input name="mediumPrice" type="number" step="0.01" defaultValue={service.mediumPrice?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Precio Large</span>
                            <input name="largePrice" type="number" step="0.01" defaultValue={service.largePrice?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Precio base</span>
                            <input name="defaultPrice" type="number" step="0.01" defaultValue={service.defaultPrice?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Desde</span>
                            <input name="startingAtPrice" type="number" step="0.01" defaultValue={service.startingAtPrice?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Hasta</span>
                            <input name="maxRangePrice" type="number" step="0.01" defaultValue={service.maxRangePrice?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Descuento miembros %</span>
                            <input name="memberDiscount" type="number" step="0.01" defaultValue={service.memberDiscount?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Minutos estimados</span>
                            <input name="estimatedMinutes" type="number" step="1" defaultValue={service.estimatedMinutes ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1 md:col-span-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Descripción</span>
                            <input name="description" defaultValue={service.description ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1 md:col-span-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Incluye (uno por línea)</span>
                            <textarea name="includes" rows={3} defaultValue={inc.join("\n")} className={ic} />
                          </label>
                          <label className="flex items-center gap-2 text-sm text-foreground/65 md:col-span-2">
                            <input type="checkbox" name="active" defaultChecked={service.active} />
                            Active
                          </label>
                          <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background transition hover:bg-foreground/85 md:col-span-2">
                            Guardar cambios
                          </button>
                        </div>
                      </EditDialog>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}

        {/* CLEANUP */}
        {cleanupServices.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-foreground/20 bg-foreground/6 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-foreground/55">
                Cleanup
              </span>
              <span className="text-xs text-foreground/40">{cleanupServices.length} servicios</span>
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {cleanupServices.map((service) => {
                const inc = Array.isArray(service.includes) ? (service.includes as string[]) : []
                return (
                  <article key={service.id} className="rounded-xl border border-foreground/12 bg-white/50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-(family-name:--font-display-family) text-lg font-semibold leading-snug">
                            {service.name}
                          </h3>
                          <span className={statusBadge(service.active)}>
                            {service.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        {service.description && (
                          <p className="mt-0.5 text-sm text-foreground/50">{service.description}</p>
                        )}
                      </div>
                      <details className="relative shrink-0">
                        <summary className="cursor-pointer list-none rounded-md border border-foreground/15 px-2 py-1 text-sm transition hover:bg-foreground/8">
                          ···
                        </summary>
                        <div className="absolute right-0 z-10 mt-1 w-52 rounded-lg border border-foreground/12 bg-[#fdfcf8] p-1.5 shadow-xl">
                          <form action={toggleServiceActiveAction}>
                            <input type="hidden" name="id" value={service.id} />
                            <input type="hidden" name="nextActive" value={service.active ? "false" : "true"} />
                            <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-foreground/5">
                              {service.active ? "Desactivar" : "Activar"}
                            </button>
                          </form>
                          <div className="my-1 h-px bg-foreground/8" />
                          <form action={deleteServiceAction}>
                            <input type="hidden" name="id" value={service.id} />
                            <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs text-foreground/50 transition hover:bg-foreground/5">
                              <input type="checkbox" name="confirmDelete" />
                              Confirmar eliminación
                            </label>
                            <button type="submit" className="mt-0.5 w-full rounded-md px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50">
                              Eliminar
                            </button>
                          </form>
                        </div>
                      </details>
                    </div>

                    {(service.smallPrice || service.mediumPrice || service.largePrice) && (
                      <div className="mt-4 grid grid-cols-3 divide-x divide-foreground/10 overflow-hidden rounded-lg border border-foreground/12">
                        {[
                          { label: "Small", value: service.smallPrice },
                          { label: "Medium", value: service.mediumPrice },
                          { label: "Large", value: service.largePrice },
                        ].map(({ label, value }) => (
                          <div key={label} className="py-3 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">{label}</p>
                            <p className="mt-1 text-xl font-bold">{value ? `$${value.toString()}` : "—"}</p>
                            {service.pricingUnit && (
                              <p className="text-[10px] text-foreground/35">{service.pricingUnit}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {service.startingAtPrice && !service.smallPrice && (
                      <div className="mt-4 flex items-baseline gap-2 rounded-lg border border-foreground/12 px-4 py-3">
                        <span className="text-xs uppercase tracking-wider text-foreground/40">Desde</span>
                        <span className="text-2xl font-bold">${service.startingAtPrice.toString()}</span>
                        {service.maxRangePrice && (
                          <span className="text-sm text-foreground/50">hasta ${service.maxRangePrice.toString()}</span>
                        )}
                        {service.pricingUnit && (
                          <span className="ml-auto text-xs text-foreground/35">{service.pricingUnit}</span>
                        )}
                      </div>
                    )}

                    {inc.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                        {inc.map((item) => (
                          <li key={item} className="flex items-center gap-1.5 text-sm text-foreground/60">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4">
                      <EditDialog label="Editar servicio" action={updateServiceAction}>
                        <input type="hidden" name="id" value={service.id} />
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Nombre</span>
                            <input name="name" defaultValue={service.name} required className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Slug</span>
                            <input name="slug" defaultValue={service.slug} required className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Categoría</span>
                            <select name="category" defaultValue={service.category} className={ic}>
                              <option value="CORE">Core</option>
                              <option value="ADD_ON">Add-on</option>
                              <option value="CLEANUP">Cleanup</option>
                            </select>
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Unidad de precio</span>
                            <input name="pricingUnit" defaultValue={service.pricingUnit ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Precio Small</span>
                            <input name="smallPrice" type="number" step="0.01" defaultValue={service.smallPrice?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Precio Medium</span>
                            <input name="mediumPrice" type="number" step="0.01" defaultValue={service.mediumPrice?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Precio Large</span>
                            <input name="largePrice" type="number" step="0.01" defaultValue={service.largePrice?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Precio base</span>
                            <input name="defaultPrice" type="number" step="0.01" defaultValue={service.defaultPrice?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Desde</span>
                            <input name="startingAtPrice" type="number" step="0.01" defaultValue={service.startingAtPrice?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Hasta</span>
                            <input name="maxRangePrice" type="number" step="0.01" defaultValue={service.maxRangePrice?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Descuento miembros %</span>
                            <input name="memberDiscount" type="number" step="0.01" defaultValue={service.memberDiscount?.toString() ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Minutos estimados</span>
                            <input name="estimatedMinutes" type="number" step="1" defaultValue={service.estimatedMinutes ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1 md:col-span-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Descripción</span>
                            <input name="description" defaultValue={service.description ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1 md:col-span-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Incluye (uno por línea)</span>
                            <textarea name="includes" rows={3} defaultValue={inc.join("\n")} className={ic} />
                          </label>
                          <label className="flex items-center gap-2 text-sm text-foreground/65 md:col-span-2">
                            <input type="checkbox" name="active" defaultChecked={service.active} />
                            Active
                          </label>
                          <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background transition hover:bg-foreground/85 md:col-span-2">
                            Guardar cambios
                          </button>
                        </div>
                      </EditDialog>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}

        {/* ADD_ONS */}
        {addOnServices.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-accent/30 bg-accent/8 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-accent">
                Add-ons
              </span>
              <span className="text-xs text-foreground/40">{addOnServices.length} add-ons</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {addOnServices.map((service) => (
                <article key={service.id} className="rounded-xl border border-foreground/12 bg-white/50 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <span className={`mt-1 inline-block ${statusBadge(service.active)}`}>
                        {service.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <details className="relative shrink-0">
                      <summary className="cursor-pointer list-none rounded-md border border-foreground/15 px-1.5 py-0.5 text-xs transition hover:bg-foreground/8">
                        ···
                      </summary>
                      <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-foreground/12 bg-[#fdfcf8] p-1.5 shadow-xl">
                        <form action={toggleServiceActiveAction}>
                          <input type="hidden" name="id" value={service.id} />
                          <input type="hidden" name="nextActive" value={service.active ? "false" : "true"} />
                          <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-foreground/5">
                            {service.active ? "Desactivar" : "Activar"}
                          </button>
                        </form>
                        <div className="my-1 h-px bg-foreground/8" />
                        <form action={deleteServiceAction}>
                          <input type="hidden" name="id" value={service.id} />
                          <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs text-foreground/50 transition hover:bg-foreground/5">
                            <input type="checkbox" name="confirmDelete" />
                            Confirmar eliminación
                          </label>
                          <button type="submit" className="mt-0.5 w-full rounded-md px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50">
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </details>
                  </div>

                  <div className="mt-3 rounded-lg border border-foreground/12 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Rango de precio</p>
                    <p className="mt-1 text-lg font-bold">
                      ${service.startingAtPrice?.toString() ?? service.defaultPrice?.toString() ?? "—"}
                      {service.maxRangePrice && (
                        <span className="text-sm font-normal text-foreground/50"> – ${service.maxRangePrice.toString()}</span>
                      )}
                    </p>
                    {service.pricingUnit && (
                      <p className="text-[10px] text-foreground/35">{service.pricingUnit}</p>
                    )}
                  </div>

                  {service.memberDiscount && (
                    <div className="mt-2 flex items-center gap-2 rounded-md border border-primary/25 bg-primary/6 px-3 py-2">
                      <span className="text-xs text-foreground/50">Descuento miembros</span>
                      <span className="ml-auto text-sm font-bold text-primary">−{service.memberDiscount.toString()}%</span>
                    </div>
                  )}

                  <div className="mt-3">
                    <EditDialog label="Editar" action={updateServiceAction}>
                      <input type="hidden" name="id" value={service.id} />
                      <div className="grid gap-3">
                        <label className="grid gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Nombre</span>
                          <input name="name" defaultValue={service.name} required className={ic} />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Slug</span>
                          <input name="slug" defaultValue={service.slug} required className={ic} />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Categoría</span>
                          <select name="category" defaultValue={service.category} className={ic}>
                            <option value="CORE">Core</option>
                            <option value="ADD_ON">Add-on</option>
                            <option value="CLEANUP">Cleanup</option>
                          </select>
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Unidad</span>
                          <input name="pricingUnit" defaultValue={service.pricingUnit ?? ""} className={ic} />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Desde</span>
                          <input name="startingAtPrice" type="number" step="0.01" defaultValue={service.startingAtPrice?.toString() ?? ""} className={ic} />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Hasta</span>
                          <input name="maxRangePrice" type="number" step="0.01" defaultValue={service.maxRangePrice?.toString() ?? ""} className={ic} />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Descuento miembros %</span>
                          <input name="memberDiscount" type="number" step="0.01" defaultValue={service.memberDiscount?.toString() ?? ""} className={ic} />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Descripción</span>
                          <input name="description" defaultValue={service.description ?? ""} className={ic} />
                        </label>
                        <label className="flex items-center gap-2 text-sm text-foreground/65">
                          <input type="checkbox" name="active" defaultChecked={service.active} />
                          Active
                        </label>
                        <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background transition hover:bg-foreground/85">
                          Guardar
                        </button>
                      </div>
                    </EditDialog>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── PLANS + ASSIGNMENTS ─────────────────────────────────── */}
      <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_320px]">

        <div>
          <h2 className="font-(family-name:--font-display-family) text-2xl font-semibold">Planes activos</h2>
          {plans.length === 0 ? (
            <p className="mt-3 text-sm text-foreground/50">No hay planes registrados todavía.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {plans.map((plan) => {
                const benefits = Array.isArray(plan.benefits)
                  ? (plan.benefits as Array<string | { name: string; description?: string }>)
                  : []
                return (
                  <article key={plan.id} className="flex flex-col rounded-xl border border-white/10 bg-forest p-5 text-cream">
                    <p className="text-xs font-bold uppercase tracking-widest text-moss-light">{plan.tier}</p>
                    <p className="mt-1 font-(family-name:--font-display-family) text-lg font-semibold">{plan.name}</p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${plan.monthlyPrice.toString()}</span>
                      <span className="text-sm text-cream/45">/mes</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-cream/50">
                      <span>{plan.visitsPerMonth} visitas/mes</span>
                      <span>·</span>
                      <span>{Number(plan.addOnDiscount)}% add-ons</span>
                      {plan.priorityScheduling && <><span>·</span><span>Prioridad</span></>}
                    </div>
                    {benefits.length > 0 && (
                      <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-4">
                        {benefits.map((b, i) => {
                          const label = typeof b === "string" ? b : b.name
                          const desc = typeof b === "object" && b.description ? b.description : null
                          return (
                            <li key={i} className="flex items-start gap-2 text-sm text-cream/65">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-moss-light" />
                              {desc ? `${label} — ${desc}` : label}
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    <div className="mt-4">
                      <EditDialog label="Editar plan" action={updatePlanAction} variant="dark">
                        <input type="hidden" name="id" value={plan.id} />
                        <div className="grid gap-3">
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Nombre</span>
                            <input name="name" defaultValue={plan.name} required className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Slug</span>
                            <input name="slug" defaultValue={plan.slug} required className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Tier</span>
                            <select name="tier" defaultValue={plan.tier} className={ic}>
                              <option value="SMALL">Small</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="LARGE">Large</option>
                            </select>
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Precio mensual</span>
                            <input name="monthlyPrice" type="number" step="0.01" defaultValue={plan.monthlyPrice.toString()} required className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Visitas por mes</span>
                            <input name="visitsPerMonth" type="number" min="1" defaultValue={plan.visitsPerMonth} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Descuento add-ons %</span>
                            <input name="addOnDiscount" type="number" step="0.01" defaultValue={Number(plan.addOnDiscount)} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Descripción</span>
                            <input name="description" defaultValue={plan.description ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Benefits (uno por línea)</span>
                            <textarea
                              name="benefits"
                              rows={3}
                              defaultValue={benefits.map((b) => typeof b === "string" ? b : b.name).join("\n")}
                              className={ic}
                            />
                          </label>
                          <label className="flex items-center gap-2 text-sm text-foreground/65">
                            <input type="checkbox" name="priorityScheduling" defaultChecked={plan.priorityScheduling} />
                            Priority scheduling
                          </label>
                          <label className="flex items-center gap-2 text-sm text-foreground/65">
                            <input type="checkbox" name="active" defaultChecked={plan.active} />
                            Active
                          </label>
                          <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background transition hover:bg-foreground/85">
                            Guardar plan
                          </button>
                        </div>
                      </EditDialog>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-(family-name:--font-display-family) text-2xl font-semibold">Asignaciones</h2>
          <p className="mt-1 text-sm text-foreground/50">Clientes con plan activo</p>
          {activeMemberships.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/45">Sin asignaciones activas todavía.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {activeMemberships.map((m) => (
                <article key={m.id} className="rounded-lg border border-foreground/12 bg-white/50 p-3">
                  <p className="font-medium">{m.customer.firstName} {m.customer.lastName}</p>
                  <p className="text-sm text-foreground/55">{m.plan.name} · ${Number(m.plan.monthlyPrice)}/mo</p>
                  {(m.preferredDay || m.preferredTime) && (
                    <p className="mt-1 text-xs text-foreground/40">
                      {[m.preferredDay, m.preferredTime].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ADMIN FORMS ────────────────────────────────────────── */}
      <div className="mt-10 border-t border-foreground/10 pt-8">
        <details>
          <summary className="inline-flex cursor-pointer select-none items-center gap-3 rounded-lg border border-foreground/15 px-4 py-2.5 text-sm font-semibold text-foreground/60 transition hover:bg-foreground/5">
            Administrar catálogo
            <span className="text-xs font-normal text-foreground/35">agregar servicios · planes · asignaciones</span>
          </summary>

          <div className="mt-5 grid gap-6 xl:grid-cols-3">
            <section className="rounded-xl border border-foreground/10 bg-background p-5 xl:col-span-2">
              <h3 className="font-(family-name:--font-display-family) text-lg font-semibold">Nuevo servicio o add-on</h3>
              <form action={createServiceAction} className="mt-4 grid gap-3 md:grid-cols-2">
                <input name="name" required placeholder="Service name" className={ic} />
                <input name="slug" required placeholder="slug-ejemplo" className={ic} />
                <select name="category" className={ic}>
                  <option value="CORE">Core</option>
                  <option value="ADD_ON">Add-on</option>
                  <option value="CLEANUP">Cleanup</option>
                </select>
                <input name="pricingUnit" placeholder="per visit" className={ic} />
                <input name="smallPrice" type="number" min="0" step="0.01" placeholder="Small price" className={ic} />
                <input name="mediumPrice" type="number" min="0" step="0.01" placeholder="Medium price" className={ic} />
                <input name="largePrice" type="number" min="0" step="0.01" placeholder="Large price" className={ic} />
                <input name="defaultPrice" type="number" min="0" step="0.01" placeholder="Default/base price" className={ic} />
                <input name="startingAtPrice" type="number" min="0" step="0.01" placeholder="Starting at (optional)" className={ic} />
                <input name="maxRangePrice" type="number" min="0" step="0.01" placeholder="Max range (optional)" className={ic} />
                <input name="memberDiscount" type="number" min="0" step="0.01" placeholder="Member discount %" className={ic} />
                <input name="estimatedMinutes" type="number" min="0" step="1" placeholder="Estimated minutes" className={ic} />
                <input name="description" placeholder="Description" className={`${ic} md:col-span-2`} />
                <textarea name="includes" rows={4} placeholder={"Includes (one per line)\nMowing\nTrimming\nBlower cleanup"} className={`${ic} md:col-span-2`} />
                <label className="flex items-center gap-2 text-sm text-foreground/65 md:col-span-2">
                  <input type="checkbox" name="active" defaultChecked />
                  Active
                </label>
                <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 md:col-span-2">
                  Guardar servicio
                </button>
              </form>
            </section>

            <section className="rounded-xl border border-foreground/10 bg-background p-5">
              <h3 className="font-(family-name:--font-display-family) text-lg font-semibold">Nuevo plan</h3>
              <form action={createPlanAction} className="mt-4 grid gap-3">
                <input name="name" required placeholder="Plan name" className={ic} />
                <input name="slug" required placeholder="plan-slug" className={ic} />
                <select name="tier" className={ic}>
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
                </select>
                <input name="monthlyPrice" required type="number" min="0" step="0.01" placeholder="Monthly price" className={ic} />
                <input name="visitsPerMonth" type="number" min="1" step="1" defaultValue={4} className={ic} />
                <input name="addOnDiscount" type="number" min="0" step="0.01" defaultValue={15} placeholder="Add-on discount %" className={ic} />
                <input name="description" placeholder="Description" className={ic} />
                <textarea name="benefits" rows={4} placeholder={"Benefits (one per line)\nWeekly service\nPriority scheduling\n15% add-on discount"} className={ic} />
                <label className="flex items-center gap-2 text-sm text-foreground/65">
                  <input type="checkbox" name="priorityScheduling" defaultChecked />
                  Priority scheduling
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground/65">
                  <input type="checkbox" name="active" defaultChecked />
                  Active
                </label>
                <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90">
                  Guardar plan
                </button>
              </form>
            </section>
          </div>

          <section className="mt-4 rounded-xl border border-foreground/10 bg-background p-5">
            <h3 className="font-(family-name:--font-display-family) text-lg font-semibold">Asignar plan a cliente</h3>
            <p className="mt-1 text-sm text-foreground/50">Define el plan y horario preferido del cliente.</p>
            <form action={assignPlanAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <AssignPlanCustomerPropertyFields customers={assignPlanCustomers} ic={ic} lbl={lbl} />
              <select name="planId" required className={`${ic} md:col-span-2`}>
                <option value="">Select plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} (${plan.monthlyPrice.toString()}/mo)
                  </option>
                ))}
              </select>
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
                <input name="notes" placeholder="Notes" className={ic} />
              </label>
              <p className="text-xs text-foreground/50 md:col-span-2">
                Si el cliente tiene varias direcciones, elige en cuál programar las visitas. Con una sola dirección se
                usa automáticamente. Las visitas se crean en Scheduling (una por semana según el plan).
              </p>
              <button
                type="submit"
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 md:col-span-2"
              >
                Asignar plan
              </button>
            </form>
          </section>
        </details>
      </div>

    </section>
  )
}

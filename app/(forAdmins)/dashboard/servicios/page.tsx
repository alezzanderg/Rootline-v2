import Link from "next/link"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { AutoCloseDetails } from "@/components/ui/AutoCloseDetails"
import { EditDialog } from "@/components/ui/EditDialog"
import { ServiceCatalogPriceDisplay } from "@/components/ui/ServiceCatalogPriceDisplay"
import { ServiceCatalogPricingFields } from "@/components/ui/ServiceCatalogPricingFields"
import { ServiceInfoHint } from "@/components/ui/ServiceInfoHint"
import { serviceCatalogFieldsProps, serviceCatalogPricingFromForm, serviceCatalogPricingProps } from "@/lib/servicios-catalog-form"

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
        details: parseString(formData.get("details")),
        pricingUnit: parseString(formData.get("pricingUnit")),
        ...serviceCatalogPricingFromForm(formData),
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

  const [services, plans, activeMemberships] = await Promise.all([
    prisma.serviceCatalog.findMany({
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.membershipPlan.findMany({
      where: { active: true, isCustom: false },
      orderBy: [{ tier: "asc" }, { monthlyPrice: "asc" }],
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

  const coreServices = services.filter((s) => s.category === "CORE")
  const addOnServices = services.filter((s) => s.category === "ADD_ON")
  const cleanupServices = services.filter((s) => s.category === "CLEANUP")
  const lawnBase = services.find((s) => s.slug === "lawn-maintenance")

  const ic = "rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"

  const statusBadge = (active: boolean) =>
    `shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
      active
        ? "border-emerald-600/30 bg-emerald-50 text-emerald-700"
        : "border-rose-500/30 bg-rose-50 text-rose-600"
    }`

  return (
    <section className="mx-auto max-w-7xl text-foreground">
      <AutoCloseDetails />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin catalog</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
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
              <h2 className="mt-0.5 font-display text-xl font-semibold">
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold">Catálogo de servicios</h2>
            <p className="mt-1 text-sm text-foreground/50">
              {services.filter((s) => s.active).length} activos · {services.length} total
            </p>
          </div>
          <Link
            href="/dashboard/servicios/administrar"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
          >
            <span className="text-base leading-none">+</span>
            Administrar catálogo
          </Link>
        </div>

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
                          <h3 className="font-display text-lg font-semibold leading-snug">
                            {service.name}
                          </h3>
                          {service.details && <ServiceInfoHint text={service.details} />}
                          <span className={statusBadge(service.active)}>
                            {service.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        {service.description && (
                          <p className="mt-0.5 text-sm text-foreground/50">{service.description}</p>
                        )}
                      </div>
                      <details data-autoclose className="relative shrink-0">
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

                    <ServiceCatalogPriceDisplay {...serviceCatalogPricingProps(service)} />

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
                          <ServiceCatalogPricingFields service={serviceCatalogFieldsProps(service)} />
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
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Detalle (icono i)</span>
                            <textarea name="details" rows={3} defaultValue={service.details ?? ""} placeholder="Explicación completa que se muestra al tocar el icono (i)" className={ic} />
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
                          <h3 className="font-display text-lg font-semibold leading-snug">
                            {service.name}
                          </h3>
                          {service.details && <ServiceInfoHint text={service.details} />}
                          <span className={statusBadge(service.active)}>
                            {service.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        {service.description && (
                          <p className="mt-0.5 text-sm text-foreground/50">{service.description}</p>
                        )}
                      </div>
                      <details data-autoclose className="relative shrink-0">
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

                    <ServiceCatalogPriceDisplay {...serviceCatalogPricingProps(service)} />

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
                          <ServiceCatalogPricingFields service={serviceCatalogFieldsProps(service)} />
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
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Detalle (icono i)</span>
                            <textarea name="details" rows={3} defaultValue={service.details ?? ""} placeholder="Explicación completa que se muestra al tocar el icono (i)" className={ic} />
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
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold">{service.name}</h3>
                        {service.details && <ServiceInfoHint text={service.details} />}
                      </div>
                      <span className={`mt-1 inline-block ${statusBadge(service.active)}`}>
                        {service.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <details data-autoclose className="relative shrink-0">
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

                  <ServiceCatalogPriceDisplay {...serviceCatalogPricingProps(service)} />

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
                        <ServiceCatalogPricingFields service={serviceCatalogFieldsProps(service)} />
                        <label className="grid gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Descuento miembros %</span>
                          <input name="memberDiscount" type="number" step="0.01" defaultValue={service.memberDiscount?.toString() ?? ""} className={ic} />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Descripción</span>
                          <input name="description" defaultValue={service.description ?? ""} className={ic} />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Detalle (icono i)</span>
                          <textarea name="details" rows={3} defaultValue={service.details ?? ""} placeholder="Explicación completa que se muestra al tocar el icono (i)" className={ic} />
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
          <h2 className="font-display text-2xl font-semibold">Planes activos</h2>
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
                    <p className="mt-1 font-display text-lg font-semibold">{plan.name}</p>
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
          <h2 className="font-display text-2xl font-semibold">Asignaciones</h2>
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

    </section>
  )
}

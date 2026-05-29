import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { EditDialog } from "@/components/ui/EditDialog"

const UNITS: Array<{ value: string; label: string }> = [
  { value: "UNIT", label: "Unidad" },
  { value: "BAG", label: "Bolsa" },
  { value: "LB", label: "Libra" },
  { value: "KG", label: "Kg" },
  { value: "LITER", label: "Litro" },
  { value: "GALLON", label: "Galón" },
]

function parseStr(input: FormDataEntryValue | null): string {
  return typeof input === "string" ? input.trim() : ""
}

function parseOptStr(input: FormDataEntryValue | null): string | null {
  if (typeof input !== "string") return null
  const v = input.trim()
  return v || null
}

function parseDecimal(input: FormDataEntryValue | null): number | null {
  if (typeof input !== "string") return null
  const raw = input.trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function optionalSupplierId(raw: string): string | null {
  if (!raw || raw === "none") return null
  return raw
}

function grossMarginPct(retail: { toString(): string } | null, cost: { toString(): string } | null): string | null {
  if (!retail || !cost) return null
  const r = Number(retail.toString())
  const c = Number(cost.toString())
  if (!Number.isFinite(r) || !Number.isFinite(c) || r <= 0) return null
  return `${(((r - c) / r) * 100).toFixed(1)} %`
}

export default async function ProductosPage() {
  async function createSupplierAction(formData: FormData) {
    "use server"
    const name = parseStr(formData.get("name"))
    if (!name) return
    await prisma.supplier.create({
      data: {
        name,
        contactName: parseOptStr(formData.get("contactName")),
        phone: parseOptStr(formData.get("phone")),
        email: parseOptStr(formData.get("email")),
        website: parseOptStr(formData.get("website")),
        notes: parseOptStr(formData.get("notes")),
        active: formData.get("active") === "on",
      },
    })
    revalidatePath("/dashboard/productos")
  }

  async function updateSupplierAction(formData: FormData) {
    "use server"
    const id = parseStr(formData.get("id"))
    const name = parseStr(formData.get("name"))
    if (!id || !name) return
    await prisma.supplier.update({
      where: { id },
      data: {
        name,
        contactName: parseOptStr(formData.get("contactName")),
        phone: parseOptStr(formData.get("phone")),
        email: parseOptStr(formData.get("email")),
        website: parseOptStr(formData.get("website")),
        notes: parseOptStr(formData.get("notes")),
        active: formData.get("active") === "on",
      },
    })
    revalidatePath("/dashboard/productos")
  }

  async function createProductAction(formData: FormData) {
    "use server"
    const name = parseStr(formData.get("name"))
    if (!name) return
    const unit = parseStr(formData.get("unit")) || "UNIT"
    await prisma.product.create({
      data: {
        name,
        sku: parseOptStr(formData.get("sku")),
        unit: unit as "UNIT" | "BAG" | "LB" | "KG" | "LITER" | "GALLON",
        stockQty: parseDecimal(formData.get("stockQty")) ?? 0,
        reorderLevel: parseDecimal(formData.get("reorderLevel")) ?? 0,
        unitCost: parseDecimal(formData.get("unitCost")),
        retailPrice: parseDecimal(formData.get("retailPrice")),
        supplierId: optionalSupplierId(parseStr(formData.get("supplierId"))),
        active: formData.get("active") === "on",
      },
    })
    revalidatePath("/dashboard/productos")
  }

  async function updateProductAction(formData: FormData) {
    "use server"
    const id = parseStr(formData.get("id"))
    const name = parseStr(formData.get("name"))
    if (!id || !name) return
    const unit = parseStr(formData.get("unit")) || "UNIT"
    await prisma.product.update({
      where: { id },
      data: {
        name,
        sku: parseOptStr(formData.get("sku")),
        unit: unit as "UNIT" | "BAG" | "LB" | "KG" | "LITER" | "GALLON",
        stockQty: parseDecimal(formData.get("stockQty")) ?? 0,
        reorderLevel: parseDecimal(formData.get("reorderLevel")) ?? 0,
        unitCost: parseDecimal(formData.get("unitCost")),
        retailPrice: parseDecimal(formData.get("retailPrice")),
        supplierId: optionalSupplierId(parseStr(formData.get("supplierId"))),
        active: formData.get("active") === "on",
      },
    })
    revalidatePath("/dashboard/productos")
  }

  async function logSupplierPriceAction(formData: FormData) {
    "use server"
    const productId = parseStr(formData.get("productId"))
    const supplierId = parseStr(formData.get("supplierId"))
    const unitCost = parseDecimal(formData.get("unitCost"))
    if (!productId || !supplierId || unitCost === null) return

    await prisma.supplierPriceLog.create({
      data: {
        productId,
        supplierId,
        unitCost,
        note: parseOptStr(formData.get("note")),
      },
    })

    if (formData.get("syncProduct") === "on") {
      await prisma.product.update({
        where: { id: productId },
        data: {
          unitCost,
          supplierId,
        },
      })
    }
    revalidatePath("/dashboard/productos")
  }

  const [suppliers, products, priceLogs] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { supplier: { select: { id: true, name: true } } },
    }),
    prisma.supplierPriceLog.findMany({
      take: 50,
      orderBy: { recordedAt: "desc" },
      include: {
        product: { select: { name: true, sku: true } },
        supplier: { select: { name: true } },
      },
    }),
  ])

  const lowStock = products.filter(
    (p) => p.active && Number(p.stockQty) <= Number(p.reorderLevel) && Number(p.reorderLevel) > 0
  )

  const ic =
    "w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"
  const card = "rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5"
  const listWrap = "overflow-hidden rounded-2xl border border-foreground/12 bg-background"

  return (
    <section className="mx-auto max-w-4xl text-foreground">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Productos e inventario</h1>
          <p className="mt-2 text-sm text-foreground/55">
            Inventario, precios, proveedores e historial de costos. Vista optimizada para móvil.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {products.filter((p) => p.active).length} activos
          </span>
          {lowStock.length > 0 ? (
            <span className="rounded-full border border-amber-500/35 bg-amber-50/80 px-3 py-1 font-medium text-amber-800">
              {lowStock.length} stock bajo
            </span>
          ) : null}
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {suppliers.filter((s) => s.active).length} proveedores
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <section className={card}>
          <h2 className="font-display text-lg font-semibold">Proveedores</h2>
          <p className="mt-1 text-sm text-foreground/55">Catálogo de proveedores para asociar productos y registrar precios.</p>

          <form action={createSupplierAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 sm:col-span-2">
              <span className={lbl}>Nombre</span>
              <input name="name" required placeholder="Ej. Green Valley Supply" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Contacto</span>
              <input name="contactName" placeholder="Nombre del contacto" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Teléfono</span>
              <input name="phone" placeholder="(732) …" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Email</span>
              <input name="email" type="email" placeholder="orders@…" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Sitio web</span>
              <input name="website" placeholder="https://…" className={ic} />
            </label>
            <label className="grid gap-1 sm:col-span-2">
              <span className={lbl}>Notas</span>
              <input name="notes" placeholder="Condiciones, cuenta cliente…" className={ic} />
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/75 sm:col-span-2">
              <input type="checkbox" name="active" defaultChecked />
              Activo
            </label>
            <button
              type="submit"
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 sm:col-span-2"
            >
              Agregar proveedor
            </button>
          </form>

          <div className={`mt-6 md:hidden ${listWrap}`}>
            {suppliers.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-foreground/45">No hay proveedores todavía.</p>
            ) : (
              <ul className="divide-y divide-foreground/10">
                {suppliers.map((s) => (
                  <li key={s.id} className="px-4 py-3.5 sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{s.name}</p>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            s.active
                              ? "border-emerald-600/30 bg-emerald-50 text-emerald-700"
                              : "border-foreground/20 bg-foreground/8 text-foreground/50"
                          }`}
                        >
                          {s.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <EditDialog
                        label="Editar"
                        action={updateSupplierAction}
                        triggerClassName="shrink-0 rounded-xl border border-foreground/15 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
                      >
                        <input type="hidden" name="id" value={s.id} />
                        <div className="grid gap-3">
                          <label className="grid gap-1">
                            <span className={lbl}>Nombre</span>
                            <input name="name" required defaultValue={s.name} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Contacto</span>
                            <input name="contactName" defaultValue={s.contactName ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Teléfono</span>
                            <input name="phone" defaultValue={s.phone ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Email</span>
                            <input name="email" type="email" defaultValue={s.email ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Sitio web</span>
                            <input name="website" defaultValue={s.website ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Notas</span>
                            <input name="notes" defaultValue={s.notes ?? ""} className={ic} />
                          </label>
                          <label className="flex items-center gap-2 text-sm text-foreground/75">
                            <input type="checkbox" name="active" defaultChecked={s.active} />
                            Activo
                          </label>
                          <button type="submit" className="rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background">
                            Guardar
                          </button>
                        </div>
                      </EditDialog>
                    </div>
                    <p className="mt-2 text-xs text-foreground/55">
                      {[s.contactName, s.phone, s.email].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-foreground/12 md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-foreground/10 bg-foreground/4">
                  <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                    Proveedor
                  </th>
                  <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                    Contacto
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-sm text-foreground/45">
                      No hay proveedores todavía.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} className="border-b border-foreground/8 last:border-b-0">
                      <td className="px-3 py-2 align-middle">
                        <p className="font-medium">{s.name}</p>
                        <span
                          className={`text-[10px] font-semibold uppercase ${s.active ? "text-emerald-400/90" : "text-foreground/40"}`}
                        >
                          {s.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="max-w-[200px] px-3 py-2 align-middle text-xs text-foreground/65">
                        {[s.contactName, s.phone, s.email].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        <EditDialog
                          label="Editar"
                          action={updateSupplierAction}
                          triggerClassName="rounded-md border border-foreground/15 px-2 py-1 text-xs hover:bg-foreground/5"
                        >
                          <input type="hidden" name="id" value={s.id} />
                          <div className="grid gap-3">
                            <label className="grid gap-1">
                              <span className={lbl}>Nombre</span>
                              <input name="name" required defaultValue={s.name} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Contacto</span>
                              <input name="contactName" defaultValue={s.contactName ?? ""} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Teléfono</span>
                              <input name="phone" defaultValue={s.phone ?? ""} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Email</span>
                              <input name="email" type="email" defaultValue={s.email ?? ""} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Sitio web</span>
                              <input name="website" defaultValue={s.website ?? ""} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Notas</span>
                              <input name="notes" defaultValue={s.notes ?? ""} className={ic} />
                            </label>
                            <label className="flex items-center gap-2 text-sm text-foreground/75">
                              <input type="checkbox" name="active" defaultChecked={s.active} />
                              Activo
                            </label>
                            <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background">
                              Guardar
                            </button>
                          </div>
                        </EditDialog>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={card}>
          <h2 className="font-display text-lg font-semibold">Registrar precio de proveedor</h2>
          <p className="mt-1 text-sm text-foreground/55">
            Guarda una cotización o factura; opcionalmente actualiza el costo actual del producto.
          </p>
          <form action={logSupplierPriceAction} className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <span className={lbl}>Producto</span>
              <select name="productId" required className={ic}>
                <option value="">Selecciona producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.sku ? ` (${p.sku})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Proveedor</span>
              <select name="supplierId" required className={ic}>
                <option value="">Selecciona proveedor</option>
                {suppliers.filter((s) => s.active).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Costo unitario (USD)</span>
              <input name="unitCost" type="number" min="0" step="0.01" required className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Nota</span>
              <input name="note" placeholder="Factura #, fecha cotización…" className={ic} />
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/75">
              <input type="checkbox" name="syncProduct" defaultChecked />
              Actualizar costo y proveedor en la ficha del producto
            </label>
            <button
              type="submit"
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
            >
              Registrar precio
            </button>
          </form>
        </section>

        <section className={card}>
          <h2 className="font-display text-lg font-semibold">Inventario</h2>
          <p className="mt-1 text-sm text-foreground/55">
            Precio de venta al cliente vs costo; margen bruto = (venta − costo) / venta.
          </p>

        <p className="mt-4 text-sm font-semibold text-foreground/80">Nuevo producto</p>
        <form action={createProductAction} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 lg:col-span-2">
            <span className={lbl}>Nombre</span>
            <input name="name" required placeholder="Mulch premium" className={ic} />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>SKU</span>
            <input name="sku" placeholder="Opcional" className={ic} />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Unidad</span>
            <select name="unit" className={ic}>
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Stock</span>
            <input name="stockQty" type="number" min="0" step="0.01" defaultValue={0} className={ic} />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Reorden</span>
            <input name="reorderLevel" type="number" min="0" step="0.01" defaultValue={0} className={ic} />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Costo unit.</span>
            <input name="unitCost" type="number" min="0" step="0.01" placeholder="USD" className={ic} />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Precio venta</span>
            <input name="retailPrice" type="number" min="0" step="0.01" placeholder="USD" className={ic} />
          </label>
          <label className="grid gap-1 lg:col-span-2">
            <span className={lbl}>Proveedor preferido</span>
            <select name="supplierId" className={ic}>
              <option value="none">— Ninguno —</option>
              {suppliers.filter((s) => s.active).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground/75 lg:col-span-2">
            <input type="checkbox" name="active" defaultChecked />
            Activo
          </label>
          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 sm:col-span-2 lg:col-span-4"
          >
            Agregar producto
          </button>
        </form>

        <div className={`mt-6 md:hidden ${listWrap}`}>
          {products.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-display text-lg font-semibold text-foreground/40">No hay productos</p>
              <p className="mt-1 text-sm text-foreground/35">Usa el formulario de arriba.</p>
            </div>
          ) : (
            <ul className="divide-y divide-foreground/10">
              {products.map((p) => {
                const margin = grossMarginPct(p.retailPrice, p.unitCost)
                const low =
                  p.active && Number(p.stockQty) <= Number(p.reorderLevel) && Number(p.reorderLevel) > 0

                return (
                  <li key={p.id} className={`px-4 py-3.5 sm:px-5 ${low ? "bg-amber-50/50" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{p.name}</p>
                        <p className="mt-0.5 text-xs text-foreground/50">
                          {UNITS.find((u) => u.value === p.unit)?.label ?? p.unit}
                          {p.sku ? ` · ${p.sku}` : ""}
                        </p>
                      </div>
                      <EditDialog
                        label="Editar"
                        action={updateProductAction}
                        triggerClassName="shrink-0 rounded-xl border border-foreground/15 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
                      >
                        <input type="hidden" name="id" value={p.id} />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="grid gap-1 sm:col-span-2">
                            <span className={lbl}>Nombre</span>
                            <input name="name" required defaultValue={p.name} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>SKU</span>
                            <input name="sku" defaultValue={p.sku ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Unidad</span>
                            <select name="unit" defaultValue={p.unit} className={ic}>
                              {UNITS.map((u) => (
                                <option key={u.value} value={u.value}>
                                  {u.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Stock</span>
                            <input
                              name="stockQty"
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={p.stockQty.toString()}
                              className={ic}
                            />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Reorden</span>
                            <input
                              name="reorderLevel"
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={p.reorderLevel.toString()}
                              className={ic}
                            />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Costo unit.</span>
                            <input
                              name="unitCost"
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={p.unitCost?.toString() ?? ""}
                              className={ic}
                            />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Precio venta</span>
                            <input
                              name="retailPrice"
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={p.retailPrice?.toString() ?? ""}
                              className={ic}
                            />
                          </label>
                          <label className="grid gap-1 sm:col-span-2">
                            <span className={lbl}>Proveedor</span>
                            <select name="supplierId" defaultValue={p.supplierId ?? "none"} className={ic}>
                              <option value="none">— Ninguno —</option>
                              {suppliers
                                .filter((s) => s.active || s.id === p.supplierId)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                    {!s.active ? " (inactivo)" : ""}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <label className="flex items-center gap-2 text-sm text-foreground/75 sm:col-span-2">
                            <input type="checkbox" name="active" defaultChecked={p.active} />
                            Activo
                          </label>
                          <button
                            type="submit"
                            className="rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background sm:col-span-2"
                          >
                            Guardar producto
                          </button>
                        </div>
                      </EditDialog>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <dt className="text-foreground/45">Stock</dt>
                        <dd className="font-medium tabular-nums">
                          {p.stockQty.toString()}
                          {low ? <span className="ml-1 text-amber-700">bajo</span> : null}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-foreground/45">Margen</dt>
                        <dd className="font-medium tabular-nums text-accent">{margin ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-foreground/45">Costo</dt>
                        <dd className="tabular-nums">{p.unitCost != null ? `$${p.unitCost.toString()}` : "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-foreground/45">Venta</dt>
                        <dd className="tabular-nums">
                          {p.retailPrice != null ? `$${p.retailPrice.toString()}` : "—"}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-foreground/45">Proveedor</dt>
                        <dd className="truncate">{p.supplier?.name ?? "—"}</dd>
                      </div>
                    </dl>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-foreground/12 md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/10 bg-foreground/4">
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                  Producto
                </th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">SKU</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                  Stock
                </th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Costo</th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Venta</th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                  Margen
                </th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                  Proveedor
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                  Editar
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-foreground/45">
                    No hay productos. Usa el formulario de arriba.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const margin = grossMarginPct(p.retailPrice, p.unitCost)
                  const low =
                    p.active && Number(p.stockQty) <= Number(p.reorderLevel) && Number(p.reorderLevel) > 0

                  return (
                    <tr key={p.id} className={`border-b border-foreground/8 last:border-b-0 ${low ? "bg-amber-500/10" : ""}`}>
                      <td className="px-3 py-2 align-middle">
                        <p className="font-medium">{p.name}</p>
                        <span className="text-[10px] text-foreground/45">{UNITS.find((u) => u.value === p.unit)?.label ?? p.unit}</span>
                      </td>
                      <td className="px-3 py-2 align-middle text-foreground/70">{p.sku ?? "—"}</td>
                      <td className="px-3 py-2 text-center align-middle tabular-nums">
                        {p.stockQty.toString()}
                        {low ? <span className="ml-1 text-[10px] font-semibold text-amber-300">bajo</span> : null}
                      </td>
                      <td className="px-3 py-2 align-middle tabular-nums">
                        {p.unitCost != null ? `$${p.unitCost.toString()}` : "—"}
                      </td>
                      <td className="px-3 py-2 align-middle tabular-nums">
                        {p.retailPrice != null ? `$${p.retailPrice.toString()}` : "—"}
                      </td>
                      <td className="px-3 py-2 align-middle font-medium tabular-nums text-accent">{margin ?? "—"}</td>
                      <td className="max-w-[140px] truncate px-3 py-2 align-middle text-xs text-foreground/65">
                        {p.supplier?.name ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        <EditDialog
                          label="Editar"
                          action={updateProductAction}
                          triggerClassName="rounded-md border border-foreground/15 px-2 py-1 text-xs hover:bg-foreground/5"
                        >
                          <input type="hidden" name="id" value={p.id} />
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="grid gap-1 md:col-span-2">
                              <span className={lbl}>Nombre</span>
                              <input name="name" required defaultValue={p.name} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>SKU</span>
                              <input name="sku" defaultValue={p.sku ?? ""} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Unidad</span>
                              <select name="unit" defaultValue={p.unit} className={ic}>
                                {UNITS.map((u) => (
                                  <option key={u.value} value={u.value}>
                                    {u.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Stock</span>
                              <input name="stockQty" type="number" min="0" step="0.01" defaultValue={p.stockQty.toString()} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Reorden</span>
                              <input name="reorderLevel" type="number" min="0" step="0.01" defaultValue={p.reorderLevel.toString()} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Costo unit.</span>
                              <input name="unitCost" type="number" min="0" step="0.01" defaultValue={p.unitCost?.toString() ?? ""} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Precio venta</span>
                              <input name="retailPrice" type="number" min="0" step="0.01" defaultValue={p.retailPrice?.toString() ?? ""} className={ic} />
                            </label>
                            <label className="grid gap-1 md:col-span-2">
                              <span className={lbl}>Proveedor</span>
                              <select name="supplierId" defaultValue={p.supplierId ?? "none"} className={ic}>
                                <option value="none">— Ninguno —</option>
                                {suppliers
                                  .filter((s) => s.active || s.id === p.supplierId)
                                  .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                    {!s.active ? " (inactivo)" : ""}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-foreground/75 md:col-span-2">
                              <input type="checkbox" name="active" defaultChecked={p.active} />
                              Activo
                            </label>
                            <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background md:col-span-2">
                              Guardar producto
                            </button>
                          </div>
                        </EditDialog>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        </section>

        <section className={card}>
        <h2 className="font-display text-lg font-semibold">Historial de precios (proveedor)</h2>
        <p className="mt-1 text-sm text-foreground/55">Últimos registros de costo por producto y proveedor.</p>

        <div className={`mt-4 md:hidden ${listWrap}`}>
          {priceLogs.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-foreground/45">
              Aún no hay registros. Usa «Registrar precio de proveedor».
            </p>
          ) : (
            <ul className="divide-y divide-foreground/10">
              {priceLogs.map((log) => (
                <li key={log.id} className="px-4 py-3.5 sm:px-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{log.product.name}</p>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">${log.unitCost.toString()}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-foreground/50">{log.supplier.name}</p>
                  <p className="mt-2 text-[11px] text-foreground/45">
                    {log.recordedAt.toLocaleString("es-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  {log.note ? <p className="mt-1 text-xs text-foreground/55">{log.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-foreground/12 md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/10 bg-foreground/4">
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Fecha</th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Producto</th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Proveedor</th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Costo</th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Nota</th>
              </tr>
            </thead>
            <tbody>
              {priceLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-foreground/45">
                    Aún no hay registros. Usa «Registrar precio de proveedor».
                  </td>
                </tr>
              ) : (
                priceLogs.map((log) => (
                  <tr key={log.id} className="border-b border-foreground/8 last:border-b-0">
                    <td className="whitespace-nowrap px-3 py-2 align-middle text-xs text-foreground/70">
                      {log.recordedAt.toLocaleString("es-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className="font-medium">{log.product.name}</span>
                      {log.product.sku ? <span className="text-xs text-foreground/45"> · {log.product.sku}</span> : null}
                    </td>
                    <td className="px-3 py-2 align-middle">{log.supplier.name}</td>
                    <td className="px-3 py-2 align-middle tabular-nums font-medium">${log.unitCost.toString()}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 align-middle text-xs text-foreground/55">{log.note ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </section>
      </div>
    </section>
  )
}

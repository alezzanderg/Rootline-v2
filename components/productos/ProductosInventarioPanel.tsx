"use client"

import { EditDialog } from "@/components/ui/EditDialog"
import { createProductAction, updateProductAction } from "@/app/(forAdmins)/dashboard/productos/_actions"

const UNITS: Array<{ value: string; label: string }> = [
  { value: "UNIT", label: "Unidad" },
  { value: "BAG", label: "Bolsa" },
  { value: "LB", label: "Libra" },
  { value: "KG", label: "Kg" },
  { value: "LITER", label: "Litro" },
  { value: "GALLON", label: "Galón" },
]

const ic =
  "w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"
const listWrap = "overflow-hidden rounded-2xl border border-foreground/12 bg-background"

function grossMarginPct(
  retail: { toString(): string } | null,
  cost: { toString(): string } | null
): string | null {
  if (!retail || !cost) return null
  const r = Number(retail.toString())
  const c = Number(cost.toString())
  if (!Number.isFinite(r) || !Number.isFinite(c) || r <= 0) return null
  return `${(((r - c) / r) * 100).toFixed(1)} %`
}

type ProductWithSupplier = {
  id: string
  name: string
  sku: string | null
  unit: string
  stockQty: number
  reorderLevel: number
  unitCost: number | null
  retailPrice: number | null
  supplierId: string | null
  active: boolean
  supplier: { id: string; name: string } | null
}

export function ProductosInventarioPanel({
  products,
  suppliers,
}: {
  products: ProductWithSupplier[]
  suppliers: { id: string; name: string; active: boolean }[]
}) {
  const primaryBtn =
    "rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <EditDialog label="Nuevo producto" action={createProductAction} triggerClassName={primaryBtn}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 sm:col-span-2">
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
            <label className="grid gap-1 sm:col-span-2">
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
            <label className="flex items-center gap-2 text-sm text-foreground/75 sm:col-span-2">
              <input type="checkbox" name="active" defaultChecked />
              Activo
            </label>
            <button type="submit" className={`${primaryBtn} sm:col-span-2`}>
              Agregar producto
            </button>
          </div>
        </EditDialog>
      </div>

      <div className={`md:hidden ${listWrap}`}>
        {products.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-display text-lg font-semibold text-foreground/40">No hay productos</p>
            <p className="mt-1 text-sm text-foreground/35">Usa el botón «Nuevo producto».</p>
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

      <div className="hidden overflow-x-auto rounded-2xl border border-foreground/12 md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 bg-foreground/4">
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Producto</th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">SKU</th>
              <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Stock</th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Costo</th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Venta</th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Margen</th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Proveedor</th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Editar</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-foreground/45">
                  No hay productos. Usa el botón «Nuevo producto».
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
                    <td className="px-3 py-2 align-middle tabular-nums">{p.unitCost != null ? `$${p.unitCost.toString()}` : "—"}</td>
                    <td className="px-3 py-2 align-middle tabular-nums">{p.retailPrice != null ? `$${p.retailPrice.toString()}` : "—"}</td>
                    <td className="px-3 py-2 align-middle font-medium tabular-nums text-accent">{margin ?? "—"}</td>
                    <td className="max-w-[140px] truncate px-3 py-2 align-middle text-xs text-foreground/65">{p.supplier?.name ?? "—"}</td>
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
    </div>
  )
}

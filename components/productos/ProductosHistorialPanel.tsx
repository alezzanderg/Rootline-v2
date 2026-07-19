"use client"

import { EditDialog } from "@/components/ui/EditDialog"
import { logSupplierPriceAction } from "@/app/(forAdmins)/dashboard/productos/_actions"

const ic =
  "w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"
const listWrap = "overflow-hidden rounded-2xl border border-foreground/12 bg-background"

type LogWithRelations = {
  id: string
  unitCost: number
  note: string | null
  recordedAt: Date
  product: { name: string; sku: string | null }
  supplier: { name: string }
}

export function ProductosHistorialPanel({
  priceLogs,
  products,
  suppliers,
}: {
  priceLogs: LogWithRelations[]
  products: { id: string; name: string; sku: string | null }[]
  suppliers: { id: string; name: string; active: boolean }[]
}) {
  const primaryBtn =
    "rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <EditDialog
          label="Registrar precio de proveedor"
          action={logSupplierPriceAction}
          triggerClassName="inline-flex items-center gap-1.5 rounded-xl border border-foreground/15 px-4 py-2.5 text-sm font-medium text-foreground/75 transition hover:bg-foreground/5"
        >
          <div className="grid gap-3">
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
            <button type="submit" className={primaryBtn}>
              Registrar precio
            </button>
          </div>
        </EditDialog>
      </div>

      <div className={`md:hidden ${listWrap}`}>
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

      <div className="hidden overflow-x-auto rounded-2xl border border-foreground/12 md:block">
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
    </div>
  )
}

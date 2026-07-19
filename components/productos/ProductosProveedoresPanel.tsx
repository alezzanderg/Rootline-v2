"use client"

import { EditDialog } from "@/components/ui/EditDialog"
import { createSupplierAction, updateSupplierAction } from "@/app/(forAdmins)/dashboard/productos/_actions"

const ic =
  "w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"
const listWrap = "overflow-hidden rounded-2xl border border-foreground/12 bg-background"

export function ProductosProveedoresPanel({
  suppliers,
}: {
  suppliers: {
    id: string
    name: string
    contactName: string | null
    phone: string | null
    email: string | null
    website: string | null
    notes: string | null
    active: boolean
  }[]
}) {
  const primaryBtn =
    "rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <EditDialog
          label="Nuevo proveedor"
          action={createSupplierAction}
          triggerClassName="inline-flex items-center gap-1.5 rounded-xl border border-foreground/15 px-4 py-2.5 text-sm font-medium text-foreground/75 transition hover:bg-foreground/5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
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
            <button type="submit" className={`${primaryBtn} sm:col-span-2`}>
              Agregar proveedor
            </button>
          </div>
        </EditDialog>
      </div>

      <div className={`md:hidden ${listWrap}`}>
        {suppliers.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-foreground/45">
            No hay proveedores todavía. Usa el botón «Nuevo proveedor».
          </p>
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

      <div className="hidden overflow-x-auto rounded-2xl border border-foreground/12 md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 bg-foreground/4">
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Proveedor</th>
              <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Contacto</th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/45">Acción</th>
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
                    <span className={`text-[10px] font-semibold uppercase ${s.active ? "text-emerald-400/90" : "text-foreground/40"}`}>
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
    </div>
  )
}

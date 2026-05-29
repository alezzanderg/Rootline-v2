import { revalidatePath } from "next/cache"

import { EditDialog } from "@/components/ui/EditDialog"
import { prisma } from "@/lib/prisma"

const CATEGORIES = [
  "Cortadora (Mower)",
  "Bordeadora (Trimmer)",
  "Sopladora (Blower)",
  "Bordeadora de filo (Edger)",
  "Podadora de setos",
  "Motosierra (Chainsaw)",
  "Fumigador (Sprayer)",
  "Remolque (Trailer)",
  "Otro",
]

const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "ASSIGNED", label: "Asignado" },
  { value: "MAINTENANCE", label: "En mantenimiento" },
  { value: "OUT_OF_SERVICE", label: "Fuera de servicio" },
] as const

function statusBadgeCls(status: string) {
  return (
    {
      AVAILABLE: "border-emerald-500/35 bg-emerald-50 text-emerald-700",
      ASSIGNED: "border-blue-400/40 bg-blue-50 text-blue-700",
      MAINTENANCE: "border-amber-400/40 bg-amber-50 text-amber-800",
      OUT_OF_SERVICE: "border-rose-400/40 bg-rose-50 text-rose-600",
    }[status] ?? "border-foreground/20 bg-foreground/8 text-foreground/60"
  )
}

function statusLabel(status: string) {
  return (
    {
      AVAILABLE: "Disponible",
      ASSIGNED: "Asignado",
      MAINTENANCE: "En mantenimiento",
      OUT_OF_SERVICE: "Fuera de servicio",
    }[status] ?? status
  )
}

function fmtDate(d: Date | null) {
  if (!d) return null
  return d.toLocaleDateString("es-US", { month: "short", day: "numeric", year: "numeric" })
}

function toInputDate(d: Date | null) {
  if (!d) return ""
  return d.toISOString().slice(0, 10)
}

function maintenanceAlert(next: Date | null): "overdue" | "soon" | null {
  if (!next) return null
  const now = new Date()
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  if (next < now) return "overdue"
  if (next <= in7) return "soon"
  return null
}

function parseStr(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : ""
}
function parseOptStr(v: FormDataEntryValue | null) {
  if (typeof v !== "string") return null
  const s = v.trim()
  return s || null
}
function parseOptDate(v: FormDataEntryValue | null) {
  const s = parseOptStr(v)
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

export default async function HerramientasPage() {
  async function addToolAction(formData: FormData) {
    "use server"
    const name = parseStr(formData.get("name"))
    if (!name) return
    const statusRaw = parseStr(formData.get("status"))
    const status =
      statusRaw === "AVAILABLE" ||
      statusRaw === "ASSIGNED" ||
      statusRaw === "MAINTENANCE" ||
      statusRaw === "OUT_OF_SERVICE"
        ? statusRaw
        : "AVAILABLE"
    await prisma.tool.create({
      data: {
        name,
        category: parseOptStr(formData.get("category")),
        serialNumber: parseOptStr(formData.get("serialNumber")),
        status,
        purchaseDate: parseOptDate(formData.get("purchaseDate")),
        nextMaintenance: parseOptDate(formData.get("nextMaintenance")),
        maintenanceNotes: parseOptStr(formData.get("maintenanceNotes")),
      },
    })
    revalidatePath("/dashboard/herramientas")
  }

  async function updateToolAction(formData: FormData) {
    "use server"
    const id = parseStr(formData.get("id"))
    if (!id) return
    const statusRaw = parseStr(formData.get("status"))
    const status =
      statusRaw === "AVAILABLE" ||
      statusRaw === "ASSIGNED" ||
      statusRaw === "MAINTENANCE" ||
      statusRaw === "OUT_OF_SERVICE"
        ? statusRaw
        : "AVAILABLE"
    await prisma.tool.update({
      where: { id },
      data: {
        name: parseStr(formData.get("name")),
        category: parseOptStr(formData.get("category")),
        serialNumber: parseOptStr(formData.get("serialNumber")),
        status,
        purchaseDate: parseOptDate(formData.get("purchaseDate")),
        lastMaintenance: parseOptDate(formData.get("lastMaintenance")),
        nextMaintenance: parseOptDate(formData.get("nextMaintenance")),
        maintenanceNotes: parseOptStr(formData.get("maintenanceNotes")),
      },
    })
    revalidatePath("/dashboard/herramientas")
  }

  async function updateStatusAction(formData: FormData) {
    "use server"
    const id = parseStr(formData.get("toolId"))
    const statusRaw = parseStr(formData.get("status"))
    if (!id) return
    const status =
      statusRaw === "AVAILABLE" ||
      statusRaw === "ASSIGNED" ||
      statusRaw === "MAINTENANCE" ||
      statusRaw === "OUT_OF_SERVICE"
        ? statusRaw
        : "AVAILABLE"
    const data: Record<string, unknown> = { status }
    if (status === "MAINTENANCE") data.lastMaintenance = new Date()
    await prisma.tool.update({ where: { id }, data })
    revalidatePath("/dashboard/herramientas")
  }

  const tools = await prisma.tool.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  })

  const counts = {
    total: tools.length,
    available: tools.filter((t) => t.status === "AVAILABLE").length,
    assigned: tools.filter((t) => t.status === "ASSIGNED").length,
    maintenance: tools.filter((t) => t.status === "MAINTENANCE").length,
    outOfService: tools.filter((t) => t.status === "OUT_OF_SERVICE").length,
    maintenanceDue: tools.filter((t) => maintenanceAlert(t.nextMaintenance) !== null).length,
  }

  const ic =
    "w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"
  const card = "rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5"
  const listWrap = "overflow-hidden rounded-2xl border border-foreground/12 bg-background"

  return (
    <section className="mx-auto max-w-4xl text-foreground">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Herramientas</h1>
          <p className="mt-2 text-sm text-foreground/55">
            Equipos, estado, mantenimiento y asignaciones.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {counts.total} total
          </span>
          {counts.available > 0 && (
            <span className="rounded-full border border-emerald-500/35 bg-emerald-50/80 px-3 py-1 font-medium text-emerald-700">
              {counts.available} disponibles
            </span>
          )}
          {counts.maintenance > 0 && (
            <span className="rounded-full border border-amber-400/40 bg-amber-50/80 px-3 py-1 font-medium text-amber-800">
              {counts.maintenance} en mantenimiento
            </span>
          )}
          {counts.maintenanceDue > 0 && (
            <span className="rounded-full border border-rose-400/40 bg-rose-50/80 px-3 py-1 font-medium text-rose-600">
              {counts.maintenanceDue} mantenimiento pendiente
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Add tool */}
        <section className={card}>
          <h2 className="font-display text-lg font-semibold">Nueva herramienta</h2>
          <p className="mt-1 text-sm text-foreground/55">
            Registra un equipo nuevo en el inventario.
          </p>
          <form action={addToolAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 sm:col-span-2">
              <span className={lbl}>Nombre *</span>
              <input name="name" required placeholder="Ej. Honda HRX217 Mower" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Categoría</span>
              <select name="category" className={ic}>
                <option value="">— Sin categoría —</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Número de serie</span>
              <input name="serialNumber" placeholder="Opcional" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Estado inicial</span>
              <select name="status" className={ic}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Fecha de compra</span>
              <input name="purchaseDate" type="date" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Próximo mantenimiento</span>
              <input name="nextMaintenance" type="date" className={ic} />
            </label>
            <label className="grid gap-1 sm:col-span-2">
              <span className={lbl}>Notas de mantenimiento</span>
              <input name="maintenanceNotes" placeholder="Tipo de aceite, filtro, intervalo…" className={ic} />
            </label>
            <button
              type="submit"
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 sm:col-span-2"
            >
              Agregar herramienta
            </button>
          </form>
        </section>

        {/* Mobile list */}
        <div className={`md:hidden ${listWrap}`}>
          {tools.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-display text-lg font-semibold text-foreground/40">Sin herramientas</p>
              <p className="mt-1 text-sm text-foreground/35">Usa el formulario de arriba.</p>
            </div>
          ) : (
            <ul className="divide-y divide-foreground/10">
              {tools.map((t) => {
                const alert = maintenanceAlert(t.nextMaintenance)
                return (
                  <li
                    key={t.id}
                    className={`px-4 py-4 sm:px-5 ${alert === "overdue" ? "bg-rose-50/40" : alert === "soon" ? "bg-amber-50/40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug">{t.name}</p>
                        {t.category ? (
                          <p className="mt-0.5 text-xs text-foreground/50">{t.category}</p>
                        ) : null}
                      </div>
                      <EditDialog
                        label="Editar"
                        action={updateToolAction}
                        triggerClassName="shrink-0 rounded-xl border border-foreground/15 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
                      >
                        <input type="hidden" name="id" value={t.id} />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="grid gap-1 sm:col-span-2">
                            <span className={lbl}>Nombre *</span>
                            <input name="name" required defaultValue={t.name} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Categoría</span>
                            <select name="category" defaultValue={t.category ?? ""} className={ic}>
                              <option value="">— Sin categoría —</option>
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Número de serie</span>
                            <input name="serialNumber" defaultValue={t.serialNumber ?? ""} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Estado</span>
                            <select name="status" defaultValue={t.status} className={ic}>
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Fecha de compra</span>
                            <input name="purchaseDate" type="date" defaultValue={toInputDate(t.purchaseDate)} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Último mantenimiento</span>
                            <input name="lastMaintenance" type="date" defaultValue={toInputDate(t.lastMaintenance)} className={ic} />
                          </label>
                          <label className="grid gap-1">
                            <span className={lbl}>Próximo mantenimiento</span>
                            <input name="nextMaintenance" type="date" defaultValue={toInputDate(t.nextMaintenance)} className={ic} />
                          </label>
                          <label className="grid gap-1 sm:col-span-2">
                            <span className={lbl}>Notas de mantenimiento</span>
                            <textarea
                              name="maintenanceNotes"
                              rows={3}
                              defaultValue={t.maintenanceNotes ?? ""}
                              className={`${ic} resize-none`}
                            />
                          </label>
                          <button
                            type="submit"
                            className="rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background sm:col-span-2"
                          >
                            Guardar
                          </button>
                        </div>
                      </EditDialog>
                    </div>

                    {/* Status pills */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map((s) => (
                        <form key={s.value} action={updateStatusAction}>
                          <input type="hidden" name="toolId" value={t.id} />
                          <input type="hidden" name="status" value={s.value} />
                          <button
                            type="submit"
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition ${
                              t.status === s.value
                                ? statusBadgeCls(s.value)
                                : "border-foreground/15 text-foreground/45 hover:border-foreground/30 hover:text-foreground/65"
                            }`}
                          >
                            {s.label}
                          </button>
                        </form>
                      ))}
                    </div>

                    {/* Maintenance info */}
                    {(t.nextMaintenance || t.serialNumber) ? (
                      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
                        {t.serialNumber ? (
                          <div>
                            <dt className="inline text-foreground/45">S/N: </dt>
                            <dd className="inline font-mono text-foreground/65">{t.serialNumber}</dd>
                          </div>
                        ) : null}
                        {t.nextMaintenance ? (
                          <div>
                            <dt className="inline text-foreground/45">Próx. mant.: </dt>
                            <dd
                              className={`inline font-medium ${
                                alert === "overdue"
                                  ? "text-rose-600"
                                  : alert === "soon"
                                    ? "text-amber-700"
                                    : "text-foreground/65"
                              }`}
                            >
                              {fmtDate(t.nextMaintenance)}
                              {alert === "overdue" ? " · vencido" : alert === "soon" ? " · pronto" : ""}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-2xl border border-foreground/12 md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/10 bg-foreground/4">
                {["Herramienta", "Estado", "S/N", "Próx. mantenimiento", "Notas", ""].map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-sm text-foreground/45">
                    No hay herramientas. Usa el formulario de arriba.
                  </td>
                </tr>
              ) : (
                tools.map((t) => {
                  const alert = maintenanceAlert(t.nextMaintenance)
                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-foreground/8 last:border-b-0 ${
                        alert === "overdue"
                          ? "bg-rose-500/5"
                          : alert === "soon"
                            ? "bg-amber-500/5"
                            : ""
                      }`}
                    >
                      <td className="px-3 py-2.5 align-middle">
                        <p className="font-medium">{t.name}</p>
                        {t.category ? (
                          <p className="text-[11px] text-foreground/45">{t.category}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeCls(t.status)}`}
                          >
                            {statusLabel(t.status)}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {STATUS_OPTIONS.filter((s) => s.value !== t.status).map((s) => (
                              <form key={s.value} action={updateStatusAction}>
                                <input type="hidden" name="toolId" value={t.id} />
                                <input type="hidden" name="status" value={s.value} />
                                <button
                                  type="submit"
                                  className="rounded border border-foreground/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-foreground/45 transition hover:border-foreground/30 hover:text-foreground/65"
                                >
                                  {s.label}
                                </button>
                              </form>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-middle font-mono text-xs text-foreground/55">
                        {t.serialNumber ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        {t.nextMaintenance ? (
                          <span
                            className={`text-xs font-medium ${
                              alert === "overdue"
                                ? "text-rose-600"
                                : alert === "soon"
                                  ? "text-amber-700"
                                  : "text-foreground/65"
                            }`}
                          >
                            {fmtDate(t.nextMaintenance)}
                            {alert === "overdue" ? " · vencido" : alert === "soon" ? " · pronto" : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-foreground/35">—</span>
                        )}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 align-middle text-xs text-foreground/55">
                        {t.maintenanceNotes ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right align-middle">
                        <EditDialog
                          label="Editar"
                          action={updateToolAction}
                          triggerClassName="rounded-md border border-foreground/15 px-2 py-1 text-xs hover:bg-foreground/5"
                        >
                          <input type="hidden" name="id" value={t.id} />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="grid gap-1 sm:col-span-2">
                              <span className={lbl}>Nombre *</span>
                              <input name="name" required defaultValue={t.name} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Categoría</span>
                              <select name="category" defaultValue={t.category ?? ""} className={ic}>
                                <option value="">— Sin categoría —</option>
                                {CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Número de serie</span>
                              <input name="serialNumber" defaultValue={t.serialNumber ?? ""} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Estado</span>
                              <select name="status" defaultValue={t.status} className={ic}>
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Fecha de compra</span>
                              <input name="purchaseDate" type="date" defaultValue={toInputDate(t.purchaseDate)} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Último mantenimiento</span>
                              <input name="lastMaintenance" type="date" defaultValue={toInputDate(t.lastMaintenance)} className={ic} />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Próximo mantenimiento</span>
                              <input name="nextMaintenance" type="date" defaultValue={toInputDate(t.nextMaintenance)} className={ic} />
                            </label>
                            <label className="grid gap-1 sm:col-span-2">
                              <span className={lbl}>Notas de mantenimiento</span>
                              <textarea
                                name="maintenanceNotes"
                                rows={3}
                                defaultValue={t.maintenanceNotes ?? ""}
                                className={`${ic} resize-none`}
                              />
                            </label>
                            <button
                              type="submit"
                              className="rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background sm:col-span-2"
                            >
                              Guardar
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
    </section>
  )
}

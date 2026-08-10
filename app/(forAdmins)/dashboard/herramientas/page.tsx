import Link from "next/link"
import { ExternalLink, Pencil, Plus } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { updateToolStatusAction } from "@/lib/tools-actions"
import {
  TOOL_STATUS_OPTIONS,
  fmtMoney,
  fmtToolDate,
  maintenanceAlert,
  readSpecs,
  statusBadgeCls,
  statusLabel,
} from "@/lib/tools-shared"
import type { Prisma } from "@/lib/generated/prisma/client"

function Fact({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">{label}</dt>
      <dd className={`truncate text-sm font-medium ${tone ?? "text-foreground/75"}`}>{value}</dd>
    </div>
  )
}

function SpecsView({ specs }: { specs: Prisma.JsonValue | null }) {
  const rows = readSpecs(specs)
  if (rows.length === 0) return null
  return (
    <details className="mt-3 text-xs">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md border border-foreground/15 px-2 py-0.5 text-[11px] font-medium text-foreground/55 transition hover:bg-foreground/5">
        Ficha técnica ({rows.length})
      </summary>
      <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {rows.map((s, i) => (
          <div key={i} className="flex justify-between gap-3 border-b border-foreground/8 py-0.5">
            <dt className="text-foreground/45">{s.label}</dt>
            <dd className="text-right font-medium text-foreground/70">{s.value || "—"}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

export default async function HerramientasPage() {
  const tools = await prisma.tool.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  })

  const counts = {
    total: tools.length,
    available: tools.filter((t) => t.status === "AVAILABLE").length,
    maintenance: tools.filter((t) => t.status === "MAINTENANCE").length,
    maintenanceDue: tools.filter((t) => maintenanceAlert(t.nextMaintenance) !== null).length,
  }

  return (
    <section className="text-foreground">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Herramientas</h1>
          <p className="mt-2 text-sm text-foreground/55">Equipos, estado, mantenimiento y ficha técnica.</p>
        </div>
        <Link
          href="/dashboard/herramientas/nueva"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          Nueva herramienta
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">{counts.total} total</span>
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

      {/* Cards */}
      {tools.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-foreground/20 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-foreground/40">Sin herramientas</p>
          <p className="mt-1 text-sm text-foreground/40">Agrega tu primer equipo al inventario.</p>
          <Link
            href="/dashboard/herramientas/nueva"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            Nueva herramienta
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {tools.map((t) => {
            const alert = maintenanceAlert(t.nextMaintenance)
            const sub = [t.brand, t.model].filter(Boolean).join(" ")
            const maintTone =
              alert === "overdue" ? "text-rose-600" : alert === "soon" ? "text-amber-700" : "text-foreground/75"
            return (
              <article
                key={t.id}
                className={`flex flex-col rounded-2xl border bg-background p-5 ${
                  alert === "overdue"
                    ? "border-rose-300/50"
                    : alert === "soon"
                      ? "border-amber-300/50"
                      : "border-foreground/12"
                }`}
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold leading-snug">{t.name}</h2>
                    <p className="mt-0.5 text-xs text-foreground/50">
                      {[t.category, sub].filter(Boolean).join(" · ") || "Sin categoría"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeCls(t.status)}`}
                  >
                    {statusLabel(t.status)}
                  </span>
                </div>

                {/* Facts */}
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  {t.sku ? <Fact label="SKU" value={<span className="font-mono">{t.sku}</span>} /> : null}
                  {t.serialNumber ? <Fact label="N° serie" value={<span className="font-mono">{t.serialNumber}</span>} /> : null}
                  {t.engine ? <Fact label="Motor" value={t.engine} /> : null}
                  {t.fuelType ? <Fact label="Energía" value={t.fuelType} /> : null}
                  {fmtMoney(t.purchasePrice) ? <Fact label="Compra" value={fmtMoney(t.purchasePrice)} /> : null}
                  {t.purchaseDate ? <Fact label="Comprado" value={fmtToolDate(t.purchaseDate)} /> : null}
                  {t.maintenanceFrequency ? <Fact label="Frecuencia mant." value={t.maintenanceFrequency} /> : null}
                  {t.nextMaintenance ? (
                    <Fact
                      label="Próx. mant."
                      tone={maintTone}
                      value={`${fmtToolDate(t.nextMaintenance)}${
                        alert === "overdue" ? " · vencido" : alert === "soon" ? " · pronto" : ""
                      }`}
                    />
                  ) : null}
                </dl>

                {t.maintenanceNotes ? (
                  <p className="mt-3 rounded-lg bg-foreground/3 px-3 py-2 text-xs text-foreground/55">{t.maintenanceNotes}</p>
                ) : null}

                <SpecsView specs={t.specs} />

                {/* Footer */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-foreground/8 pt-4">
                  <div className="flex flex-wrap gap-1">
                    {TOOL_STATUS_OPTIONS.map((s) => (
                      <form key={s.value} action={updateToolStatusAction}>
                        <input type="hidden" name="toolId" value={t.id} />
                        <input type="hidden" name="status" value={s.value} />
                        <button
                          type="submit"
                          disabled={t.status === s.value}
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
                  <div className="ml-auto flex items-center gap-2">
                    {t.purchaseUrl ? (
                      <a
                        href={t.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Comprar
                      </a>
                    ) : null}
                    <Link
                      href={`/dashboard/herramientas/${t.id}/editar`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-semibold text-foreground/70 transition hover:bg-foreground/5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

"use client"

import { useState } from "react"

import { MoneyInput } from "@/components/ui/MoneyInput"
import { ReceiptInput } from "@/components/ui/ReceiptInput"
import {
  EXPENSE_CATEGORIES,
  OPERATING_TYPES,
  OPERATING_TYPE_META,
  toInputDate,
  type OperatingTxnType,
} from "@/lib/operating-shared"

export type PartnerOption = { id: string; name: string }
/** Encoded value: "quote:<id>" or "job:<id>". */
export type ProjectOption = { value: string; label: string; group: string }

export type TransactionInitial = {
  id?: string
  type?: OperatingTxnType
  amount?: number | null
  occurredAt?: Date | null
  description?: string | null
  category?: string | null
  vendor?: string | null
  invoiceNumber?: string | null
  receiptUrl?: string | null
  partnerId?: string | null
  jobId?: string | null
  quoteId?: string | null
}

const ic =
  "w-full rounded-xl border border-foreground/20 bg-white/60 px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

export function OperatingTransactionForm({
  action,
  partners,
  projects,
  initial,
  submitLabel = "Registrar movimiento",
}: {
  action: (formData: FormData) => Promise<void>
  partners: PartnerOption[]
  projects: ProjectOption[]
  initial?: TransactionInitial
  submitLabel?: string
}) {
  const [type, setType] = useState<OperatingTxnType>(initial?.type ?? "COMPANY_EXPENSE")
  const meta = OPERATING_TYPE_META[type]

  const selectedProject = initial?.quoteId
    ? `quote:${initial.quoteId}`
    : initial?.jobId
      ? `job:${initial.jobId}`
      : ""
  const projectGroups = [...new Set(projects.map((p) => p.group))]

  return (
    <form action={action} className="grid gap-5">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {/* Type selector */}
      <fieldset className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
          Tipo de movimiento
        </legend>
        <input type="hidden" name="type" value={type} />
        <div className="grid gap-2 sm:grid-cols-2">
          {OPERATING_TYPES.map((t) => {
            const m = OPERATING_TYPE_META[t]
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                  type === t
                    ? "border-accent/60 bg-accent/15 text-accent"
                    : "border-foreground/15 text-foreground/70 hover:bg-foreground/5"
                }`}
              >
                <span className="block">{m.label}</span>
                <span className={`mt-0.5 inline-block text-[10px] font-semibold uppercase tracking-wider ${m.direction === "in" ? "text-emerald-600" : "text-rose-600"}`}>
                  {m.direction === "in" ? "Entrada" : "Salida"}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">Detalles</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className={lbl}>Monto (USD) *</span>
            <MoneyInput
              name="amount"
              required
              defaultValue={initial?.amount != null ? String(initial.amount) : ""}
              className={ic}
            />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Fecha</span>
            <input name="occurredAt" type="date" defaultValue={toInputDate(initial?.occurredAt) || toInputDate(new Date())} className={ic} />
          </label>

          {meta.needsPartner ? (
            <label className="grid gap-1 sm:col-span-2">
              <span className={lbl}>Socio *</span>
              <select name="partnerId" required defaultValue={initial?.partnerId ?? ""} className={ic}>
                <option value="">Selecciona un socio</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {meta.needsJob ? (
            <label className="grid gap-1 sm:col-span-2">
              <span className={lbl}>Proyecto (estimado / trabajo) *</span>
              {projects.length === 0 ? (
                <span className="rounded-xl border border-dashed border-amber-400/40 bg-amber-50/50 px-3 py-2.5 text-xs text-amber-800">
                  No hay estimados ni trabajos para vincular. Crea un estimado primero.
                </span>
              ) : (
                <select name="project" required defaultValue={selectedProject} className={ic}>
                  <option value="">Selecciona un proyecto</option>
                  {projectGroups.map((g) => (
                    <optgroup key={g} label={g}>
                      {projects
                        .filter((p) => p.group === g)
                        .map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </label>
          ) : null}

          {meta.isExpense ? (
            <>
              <label className="grid gap-1">
                <span className={lbl}>Categoría</span>
                <select name="category" defaultValue={initial?.category ?? ""} className={ic}>
                  <option value="">— Sin categoría —</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className={lbl}>Proveedor / vendor</span>
                <input name="vendor" defaultValue={initial?.vendor ?? ""} placeholder="Ej. Home Depot" className={ic} />
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className={lbl}>N° de factura / referencia</span>
                <input name="invoiceNumber" defaultValue={initial?.invoiceNumber ?? ""} placeholder="Opcional" className={ic} />
              </label>
            </>
          ) : null}

          <label className="grid gap-1 sm:col-span-2">
            <span className={lbl}>Descripción / nota</span>
            <input name="description" defaultValue={initial?.description ?? ""} placeholder="Detalle del movimiento" className={ic} />
          </label>

          <div className="grid gap-1 sm:col-span-2">
            <span className={lbl}>Recibo (imagen, opcional)</span>
            <ReceiptInput defaultValue={initial?.receiptUrl ?? ""} />
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        className="w-fit rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
      >
        {submitLabel}
      </button>
    </form>
  )
}

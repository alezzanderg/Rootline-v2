"use client"

import { useState, useTransition } from "react"

import {
  selectQuoteOptionAction,
  toggleQuoteAddonAction,
  updateItemOptionsAction,
} from "@/lib/quote-options-actions"

export type EstimadoLineType = "REQUIRED" | "OPTION" | "ADDON"
export type EstimadoRecurringInterval = "WEEKLY" | "EVERY_4_WEEKS" | "MONTHLY" | "QUARTERLY" | "YEARLY"

export type EstimadoOptionGroup = {
  id: string
  title: string
  selectionType: "SINGLE_SELECT" | "MULTI_SELECT"
  required: boolean
}

export type EstimadoLineItem = {
  id: string
  name: string
  isRecurring: boolean
  isAddOn: boolean
  categoryLabel: string
  quantity: number
  unitPrice: number
  lineTotal: number
  description: string | null
  lineType: EstimadoLineType
  optionGroupId: string | null
  isSelected: boolean
  selectedByDefault: boolean
  taxable: boolean
  recommended: boolean
  badgeLabel: string | null
  recurringInterval: EstimadoRecurringInterval | null
}

const cell =
  "w-full rounded-lg border border-foreground/15 bg-white px-2 py-1.5 text-sm tabular-nums outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
const sel = "rounded-lg border border-foreground/15 bg-white px-2 py-1.5 text-sm outline-none focus:border-accent"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/35"

const INTERVALS: [EstimadoRecurringInterval, string][] = [
  ["WEEKLY", "Semanal"],
  ["EVERY_4_WEEKS", "Cada 4 semanas"],
  ["MONTHLY", "Mensual"],
  ["QUARTERLY", "Trimestral"],
  ["YEARLY", "Anual"],
]

const LINE_TYPE_BADGE: Record<EstimadoLineType, string> = {
  REQUIRED: "border-foreground/15 bg-foreground/5 text-foreground/55",
  OPTION: "border-blue-300/40 bg-blue-50 text-blue-700",
  ADDON: "border-violet-300/40 bg-violet-50/80 text-violet-700",
}
const LINE_TYPE_LABEL: Record<EstimadoLineType, string> = {
  REQUIRED: "Requerido",
  OPTION: "Opción",
  ADDON: "Add-on",
}

function LineRow({
  quoteId,
  item,
  optionGroups,
  updateItemAction,
  removeItemAction,
}: {
  quoteId: string
  item: EstimadoLineItem
  optionGroups: EstimadoOptionGroup[]
  updateItemAction: (formData: FormData) => Promise<void>
  removeItemAction: (formData: FormData) => Promise<void>
}) {
  const [qty, setQty] = useState(String(item.quantity))
  const [price, setPrice] = useState(item.unitPrice.toFixed(2))
  const [desc, setDesc] = useState(item.description ?? "")
  const [isPending, startTransition] = useTransition()

  const q = Number(qty)
  const p = Number(price)
  const liveTotal = Number.isFinite(q) && Number.isFinite(p) ? q * p : item.lineTotal
  const group = optionGroups.find((g) => g.id === item.optionGroupId) ?? null
  const isSingleOption = item.lineType === "OPTION" && group?.selectionType === "SINGLE_SELECT"

  function save() {
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(p) || p < 0) return
    if (q === item.quantity && p === item.unitPrice && desc === (item.description ?? "")) return
    const formData = new FormData()
    formData.set("quoteId", quoteId)
    formData.set("itemId", item.id)
    formData.set("quantity", String(q))
    formData.set("unitPrice", String(p))
    formData.set("description", desc)
    startTransition(async () => {
      await updateItemAction(formData)
    })
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  const dimmed = item.lineType !== "REQUIRED" && !item.isSelected

  return (
    <li className={`px-4 py-3 ${item.isRecurring ? "bg-amber-50/40" : ""} ${dimmed ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="font-medium">{item.name}</p>
          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${LINE_TYPE_BADGE[item.lineType]}`}>
            {LINE_TYPE_LABEL[item.lineType]}
          </span>
          {item.isRecurring ? (
            <span className="shrink-0 rounded border border-amber-400/40 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
              Recurrente
            </span>
          ) : null}
          {item.recommended ? (
            <span className="shrink-0 rounded border border-emerald-400/40 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              {item.badgeLabel || "Recomendado"}
            </span>
          ) : null}
          {group ? <span className="shrink-0 text-[10px] text-foreground/40">grupo: {group.title}</span> : null}
          {isPending ? <span className="text-[10px] text-foreground/40">guardando…</span> : null}
        </div>
        <div className="text-right">
          <p className={`tabular-nums text-sm font-semibold ${item.isRecurring ? "text-amber-700" : ""}`}>
            ${liveTotal.toFixed(2)}
            {item.isRecurring ? <span className="text-[10px] font-normal text-foreground/45">/ciclo</span> : null}
          </p>
          <form action={removeItemAction} className="mt-0.5">
            <input type="hidden" name="quoteId" value={quoteId} />
            <input type="hidden" name="itemId" value={item.id} />
            <button type="submit" className="text-xs text-rose-600 hover:underline">Quitar</button>
          </form>
        </div>
      </div>

      {/* Selection control for options / add-ons */}
      {item.lineType !== "REQUIRED" ? (
        <form action={isSingleOption ? selectQuoteOptionAction : toggleQuoteAddonAction} className="mt-2">
          <input type="hidden" name="quoteId" value={quoteId} />
          <input type="hidden" name="itemId" value={item.id} />
          <button
            type="submit"
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
              item.isSelected
                ? "border-emerald-500/40 bg-emerald-50 text-emerald-700"
                : "border-foreground/20 text-foreground/55 hover:bg-foreground/5"
            }`}
          >
            {item.isSelected ? "✓ Seleccionada por defecto" : "Marcar como seleccionada"}
          </button>
        </form>
      ) : null}

      <div className="mt-2 grid grid-cols-[5rem_7rem_1fr] items-end gap-2">
        <label className="grid gap-0.5">
          <span className={lbl}>{item.isRecurring ? "Visitas" : "Cant."}</span>
          <input type="number" min="0" step={item.isRecurring ? "1" : "0.1"} value={qty} onChange={(e) => setQty(e.target.value)} onBlur={save} onKeyDown={onKeyDown} className={`${cell} text-right`} />
        </label>
        <label className="grid gap-0.5">
          <span className={lbl}>{item.isRecurring ? "$ / visita" : "$ unidad"}</span>
          <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} onBlur={save} onKeyDown={onKeyDown} className={`${cell} text-right`} />
        </label>
        <label className="grid gap-0.5">
          <span className={lbl}>Descripción</span>
          <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={save} onKeyDown={onKeyDown} placeholder="Opcional" className={cell.replace(" tabular-nums", "")} />
        </label>
      </div>

      {/* Per-line options config */}
      <details className="mt-2">
        <summary className="cursor-pointer list-none text-[11px] font-semibold text-foreground/45 hover:text-foreground/70">
          ⚙︎ Configurar opción
        </summary>
        <form action={updateItemOptionsAction} className="mt-2 grid gap-2 rounded-xl border border-foreground/12 bg-foreground/2 p-3 sm:grid-cols-2">
          <input type="hidden" name="quoteId" value={quoteId} />
          <input type="hidden" name="itemId" value={item.id} />
          <label className="grid gap-1">
            <span className={lbl}>Tipo de línea</span>
            <select name="lineType" defaultValue={item.lineType} className={sel}>
              <option value="REQUIRED">Requerido</option>
              <option value="OPTION">Opción (elegir)</option>
              <option value="ADDON">Add-on (opcional)</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Grupo de opciones</span>
            <select name="optionGroupId" defaultValue={item.optionGroupId ?? ""} className={sel}>
              <option value="">— Sin grupo —</option>
              {optionGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Etiqueta destacada</span>
            <input name="badgeLabel" defaultValue={item.badgeLabel ?? ""} placeholder="Ej. Best Value" className={sel} />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Cadencia recurrente</span>
            <select name="recurringInterval" defaultValue={item.recurringInterval ?? ""} className={sel}>
              <option value="">— No aplica —</option>
              {INTERVALS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-foreground/65">
            <input type="checkbox" name="isRecurring" defaultChecked={item.isRecurring} />
            Recurrente
          </label>
          <label className="flex items-center gap-2 text-xs text-foreground/65">
            <input type="checkbox" name="taxable" defaultChecked={item.taxable} />
            Gravable (taxable)
          </label>
          <label className="flex items-center gap-2 text-xs text-foreground/65">
            <input type="checkbox" name="recommended" defaultChecked={item.recommended} />
            Recomendado
          </label>
          <button type="submit" className="rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background transition hover:bg-foreground/85 sm:col-span-2">
            Guardar opciones
          </button>
        </form>
      </details>
    </li>
  )
}

export function EstimadoLineItems({
  quoteId,
  items,
  optionGroups,
  subtotal,
  tax,
  total,
  taxRatePercent,
  updateItemAction,
  removeItemAction,
}: {
  quoteId: string
  items: EstimadoLineItem[]
  optionGroups: EstimadoOptionGroup[]
  subtotal: number
  tax: number
  total: number
  taxRatePercent: number
  updateItemAction: (formData: FormData) => Promise<void>
  removeItemAction: (formData: FormData) => Promise<void>
}) {
  return (
    <div className="rounded-2xl border border-foreground/12 bg-white/50">
      <div className="border-b border-foreground/10 px-4 py-3 text-sm font-semibold">
        Líneas del estimado
        <span className="ml-2 text-xs font-normal text-foreground/40">Edita con Tab · ⚙︎ para opciones</span>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-foreground/45">Aún no tiene líneas.</p>
      ) : (
        <ul className="divide-y divide-foreground/8">
          {items.map((item) => (
            <LineRow
              key={item.id}
              quoteId={quoteId}
              item={item}
              optionGroups={optionGroups}
              updateItemAction={updateItemAction}
              removeItemAction={removeItemAction}
            />
          ))}
        </ul>
      )}
      <div className="border-t border-foreground/10 bg-foreground/2 px-4 py-3">
        <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex items-center justify-between text-foreground/65">
            <span>Subtotal hoy</span>
            <span className="tabular-nums">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-foreground/65">
            <span>Tax ({taxRatePercent.toFixed(3)}%)</span>
            <span className="tabular-nums">${tax.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-foreground/12 pt-1.5 font-semibold text-foreground">
            <span>Total a pagar hoy</span>
            <span className="tabular-nums">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

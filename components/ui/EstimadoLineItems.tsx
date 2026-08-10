"use client"

import { useState, useTransition } from "react"
import { Check, Settings2, Trash2 } from "lucide-react"

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

/**
 * Only the exceptions get a badge.
 *
 * Every line used to carry up to five chips across four colour families —
 * line type, recurring, recommended, group, save state — before the reader
 * reached the service name. REQUIRED is the default case and the majority of
 * rows, so it now says nothing at all: a row with no badge is an ordinary one.
 */
const LINE_TYPE_BADGE: Record<EstimadoLineType, string | null> = {
  REQUIRED: null,
  OPTION: "border-foreground/20 bg-foreground/5 text-foreground/60",
  ADDON: "border-foreground/20 bg-foreground/5 text-foreground/60",
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
  const [justSaved, setJustSaved] = useState(false)
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
      setJustSaved(true)
      window.setTimeout(() => setJustSaved(false), 1800)
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
    <li
      className={`group relative px-4 py-3 ${dimmed ? "opacity-60" : ""} ${
        // A recurring line gets a moss edge instead of a full-row amber wash:
        // scannable down the list, and it does not tint the card underneath.
        item.isRecurring ? "border-l-2 border-l-moss pl-[calc(1rem-2px)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="font-medium">{item.name}</p>
          {LINE_TYPE_BADGE[item.lineType] ? (
            <span
              className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${LINE_TYPE_BADGE[item.lineType]}`}
            >
              {LINE_TYPE_LABEL[item.lineType]}
            </span>
          ) : null}
          {item.recommended ? (
            <span className="shrink-0 rounded border border-accent/35 bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
              {item.badgeLabel || "Recomendado"}
            </span>
          ) : null}
          {group ? <span className="shrink-0 text-[10px] text-foreground/40">{group.title}</span> : null}
          {isPending ? (
            <span className="text-[10px] text-foreground/40">guardando…</span>
          ) : justSaved ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-moss">
              <Check className="h-3 w-3" /> Guardado
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-baseline gap-2">
          <p className="tabular-nums text-sm font-semibold">
            ${liveTotal.toFixed(2)}
            {item.isRecurring ? (
              <span className="text-[10px] font-normal text-foreground/45">/ciclo</span>
            ) : null}
          </p>
          {/* Removing a line is destructive and was sitting at the same weight
              as the price on every row. It stays reachable by keyboard. */}
          <form action={removeItemAction}>
            <input type="hidden" name="quoteId" value={quoteId} />
            <input type="hidden" name="itemId" value={item.id} />
            <button
              type="submit"
              aria-label={`Quitar ${item.name} del estimado`}
              title="Quitar del estimado"
              className="rounded p-1 text-foreground/25 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
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
                ? "border-moss/45 bg-moss/12 text-forest"
                : "border-foreground/20 text-foreground/55 hover:bg-foreground/5"
            }`}
          >
            {item.isSelected ? "Seleccionada por defecto" : "Marcar como seleccionada"}
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
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[11px] font-semibold text-foreground/45 transition hover:text-foreground/70">
          <Settings2 className="h-3 w-3" />
          Ajustes de la línea
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
          <button type="submit" className="rounded-lg bg-forest px-3 py-2 text-xs font-semibold text-cream transition hover:bg-forest/90 sm:col-span-2">
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
    <div className="rounded-2xl border border-foreground/12 bg-card">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-foreground/10 px-4 py-3">
        <p className="text-sm font-semibold">Líneas del estimado</p>
        <p className="text-xs text-foreground/40">
          Edita los campos y sal con Tab para guardar
        </p>
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
      {/* The masthead carries the authoritative figure. This one exists because
          you cannot see the masthead while editing the bottom of a long list,
          so it is weighted as a running tally, not as a second headline. */}
      <div className="border-t border-foreground/10 bg-foreground/2 px-4 py-3">
        <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex items-center justify-between text-xs text-foreground/50">
            <span>Subtotal</span>
            <span className="tabular-nums">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-foreground/50">
            <span>Impuesto ({taxRatePercent.toFixed(3)}%)</span>
            <span className="tabular-nums">${tax.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-foreground/12 pt-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
              A pagar hoy
            </span>
            <span className="font-display text-lg font-bold tabular-nums text-forest">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

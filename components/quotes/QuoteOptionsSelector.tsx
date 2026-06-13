"use client"

import { useTransition } from "react"

import type { QuoteDocumentItem, QuoteDocumentOptionGroup } from "@/lib/quote-document"
import { fmtMoney } from "@/lib/quote-document-format"
import { recurringIntervalLabel } from "@/lib/quote-pricing"
import { selectQuoteOptionAction, toggleQuoteAddonAction } from "@/lib/quote-options-actions"

function lineMoney(item: QuoteDocumentItem, taxRatePercent: number) {
  const subtotal = item.lineTotal
  const tax = item.taxable ? Math.round(subtotal * taxRatePercent) / 100 : 0
  return { subtotal, tax, total: subtotal + tax }
}

function priceLine(item: QuoteDocumentItem, taxRatePercent: number) {
  const m = lineMoney(item, taxRatePercent)
  const suffix = item.isRecurring ? ` ${recurringIntervalLabel(item.recurringInterval, item.quantity)}` : ""
  return { ...m, label: `${fmtMoney(m.total)}${suffix}` }
}

function OptionRow({
  item,
  selected,
  control,
  taxRatePercent,
  interactive,
  pending,
  onChoose,
}: {
  item: QuoteDocumentItem
  selected: boolean
  control: "radio" | "checkbox"
  taxRatePercent: number
  interactive: boolean
  pending: boolean
  onChoose: () => void
}) {
  const price = priceLine(item, taxRatePercent)
  const inner = (
    <div className="flex w-full items-start gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${
          control === "radio" ? "rounded-full" : "rounded-md"
        } ${selected ? "border-accent bg-accent text-white" : "border-foreground/30 bg-white"}`}
      >
        {selected ? <span className="text-[11px] leading-none">✓</span> : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{item.name}</span>
          {item.recommended ? (
            <span className="rounded-full border border-emerald-400/40 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              {item.badgeLabel || "Recommended"}
            </span>
          ) : null}
        </div>
        {item.isRecurring ? (
          <p className="mt-0.5 text-xs text-foreground/55">
            {item.quantity} {item.quantity === 1 ? "visit" : "visits"} at {fmtMoney(item.unitPrice)} per visit
          </p>
        ) : null}
        {item.description ? <p className="mt-0.5 text-xs text-foreground/55">{item.description}</p> : null}
        <p className="mt-1 text-[11px] text-foreground/45">
          Subtotal {fmtMoney(price.subtotal)} · Tax {fmtMoney(price.tax)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-base font-bold tabular-nums text-forest">{price.label}</p>
      </div>
    </div>
  )

  const base = `block w-full rounded-xl border p-3 text-left transition ${
    selected ? "border-accent/60 bg-accent/5 ring-1 ring-accent/30" : "border-foreground/15 bg-white/60"
  } ${pending ? "opacity-60" : ""}`

  if (!interactive) return <div className={base}>{inner}</div>
  return (
    <button type="button" onClick={onChoose} disabled={pending} className={`${base} hover:border-accent/50 active:scale-[0.99]`}>
      {inner}
    </button>
  )
}

export function QuoteOptionsSelector({
  quoteId,
  interactive,
  showUnselected = true,
  groups,
  items,
  taxRatePercent,
}: {
  quoteId: string
  interactive: boolean
  showUnselected?: boolean
  groups: QuoteDocumentOptionGroup[]
  items: QuoteDocumentItem[]
  taxRatePercent: number
}) {
  const [isPending, startTransition] = useTransition()

  function choose(action: (fd: FormData) => Promise<void>, itemId: string) {
    const fd = new FormData()
    fd.set("quoteId", quoteId)
    fd.set("itemId", itemId)
    startTransition(async () => {
      await action(fd)
    })
  }

  const addons = items.filter((i) => i.lineType === "ADDON" && (showUnselected || i.isSelected))

  return (
    <div className="mt-8 space-y-6">
      {groups.map((group) => {
        const opts = items.filter(
          (i) => i.lineType === "OPTION" && i.optionGroupId === group.id && (showUnselected || i.isSelected)
        )
        if (opts.length === 0) return null
        const single = group.selectionType === "SINGLE_SELECT"
        const hasSelection = opts.some((o) => o.isSelected)
        return (
          <section key={group.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-lg font-semibold text-forest">{group.title}</h3>
              {group.required ? (
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${hasSelection ? "text-emerald-600" : "text-amber-600"}`}>
                  {hasSelection ? "Selected" : "Selection required"}
                </span>
              ) : null}
            </div>
            {group.description ? <p className="mt-0.5 text-sm text-foreground/55">{group.description}</p> : null}
            <div className="mt-3 space-y-2">
              {opts.map((o) => (
                <OptionRow
                  key={o.id}
                  item={o}
                  selected={o.isSelected}
                  control={single ? "radio" : "checkbox"}
                  taxRatePercent={taxRatePercent}
                  interactive={interactive}
                  pending={isPending}
                  onChoose={() => choose(single ? selectQuoteOptionAction : toggleQuoteAddonAction, o.id)}
                />
              ))}
            </div>
          </section>
        )
      })}

      {addons.length > 0 ? (
        <section>
          <h3 className="font-display text-lg font-semibold text-forest">Optional add-ons</h3>
          <p className="mt-0.5 text-sm text-foreground/55">Add any extras you’d like included.</p>
          <div className="mt-3 space-y-2">
            {addons.map((a) => (
              <OptionRow
                key={a.id}
                item={a}
                selected={a.isSelected}
                control="checkbox"
                taxRatePercent={taxRatePercent}
                interactive={interactive}
                pending={isPending}
                onChoose={() => choose(toggleQuoteAddonAction, a.id)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

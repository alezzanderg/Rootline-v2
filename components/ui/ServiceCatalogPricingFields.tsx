"use client"

import { useState } from "react"

import { PRICING_MODE_LABEL, type ServicePricingMode } from "@/lib/service-pricing"

type PriceService = {
  pricingMode?: string | null
  defaultPrice?: { toString(): string } | null
  smallPrice?: { toString(): string } | null
  mediumPrice?: { toString(): string } | null
  largePrice?: { toString(): string } | null
  biweeklySmallPrice?: { toString(): string } | null
  biweeklyMediumPrice?: { toString(): string } | null
  biweeklyLargePrice?: { toString(): string } | null
  oneTimeSmallPrice?: { toString(): string } | null
  oneTimeMediumPrice?: { toString(): string } | null
  oneTimeLargePrice?: { toString(): string } | null
  startingAtPrice?: { toString(): string } | null
  maxRangePrice?: { toString(): string } | null
  biweeklyStartingAtPrice?: { toString(): string } | null
  oneTimeStartingAtPrice?: { toString(): string } | null
}

const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

const TIER_COLS = [
  { label: "Pequeño", keys: { weekly: "smallPrice", biweekly: "biweeklySmallPrice", oneTime: "oneTimeSmallPrice" } },
  { label: "Mediano", keys: { weekly: "mediumPrice", biweekly: "biweeklyMediumPrice", oneTime: "oneTimeMediumPrice" } },
  { label: "Grande", keys: { weekly: "largePrice", biweekly: "biweeklyLargePrice", oneTime: "oneTimeLargePrice" } },
] as const

const FREQ_ROWS = [
  { label: "Semanal", hint: "Base recurrente", rowClass: "bg-primary/5" },
  { label: "Quincenal", hint: "Un poco más alto", rowClass: "bg-foreground/2" },
  { label: "Una vez", hint: "Trabajo único", rowClass: "bg-amber-50/50" },
] as const

// Frequency-only mode reuses the MEDIUM column as a single per-frequency price.
const FREQ_ONLY_ROWS = [
  { label: "Semanal", hint: "Precio por visita semanal", key: "mediumPrice", rowClass: "bg-primary/5" },
  { label: "Quincenal", hint: "Precio por visita quincenal", key: "biweeklyMediumPrice", rowClass: "bg-foreground/2" },
  { label: "Una vez", hint: "Trabajo único", key: "oneTimeMediumPrice", rowClass: "bg-amber-50/50" },
] as const

const MODE_HINT: Record<ServicePricingMode, string> = {
  FREQ_AND_TIER: "El precio cambia según la frecuencia y el tamaño del yard.",
  TIER_ONLY: "El precio depende solo del tamaño del yard. La frecuencia se ignora.",
  FREQ_ONLY: "El precio depende solo de la frecuencia. El tamaño se ignora.",
}

function PriceInput({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground/35">
        $
      </span>
      <input
        name={name}
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        placeholder="—"
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-foreground/15 bg-white py-2 pl-6 pr-2 text-right text-sm font-medium tabular-nums outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
      />
    </div>
  )
}

function val(service: PriceService | undefined, key: keyof PriceService) {
  return service?.[key]?.toString() ?? ""
}

export function ServiceCatalogPricingFields({ service }: { service?: PriceService }) {
  const [mode, setMode] = useState<ServicePricingMode>(
    service?.pricingMode === "TIER_ONLY" || service?.pricingMode === "FREQ_ONLY"
      ? service.pricingMode
      : "FREQ_AND_TIER"
  )

  return (
    <div className="grid gap-4 md:col-span-2">
      {/* Pricing mode selector */}
      <div className="rounded-xl border border-foreground/12 bg-white/80 p-4">
        <label className="grid gap-1">
          <span className={lbl}>Tipo de precio</span>
          <select
            name="pricingMode"
            value={mode}
            onChange={(e) => setMode(e.target.value as ServicePricingMode)}
            className="rounded-lg border border-foreground/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          >
            {(["FREQ_AND_TIER", "TIER_ONLY", "FREQ_ONLY"] as const).map((m) => (
              <option key={m} value={m}>
                {PRICING_MODE_LABEL[m]}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-1.5 text-[11px] text-foreground/45">{MODE_HINT[mode]}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-foreground/12 bg-white/80">
        <div className="border-b border-foreground/10 bg-foreground/3 px-4 py-3">
          <p className="text-sm font-semibold text-foreground/85">Precios por visita</p>
          <p className="mt-0.5 text-xs text-foreground/45">{MODE_HINT[mode]}</p>
        </div>

        {/* FREQ_AND_TIER: full frequency × size matrix */}
        {mode === "FREQ_AND_TIER" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-foreground/10">
                  <th className="w-[34%] px-3 py-2.5 text-left">
                    <span className={lbl}>Frecuencia</span>
                  </th>
                  {TIER_COLS.map((col) => (
                    <th key={col.label} className="px-2 py-2.5 text-center">
                      <span className={lbl}>{col.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FREQ_ROWS.map((row, i) => {
                  const freqKey = i === 0 ? "weekly" : i === 1 ? "biweekly" : "oneTime"
                  return (
                    <tr key={row.label} className={`border-b border-foreground/8 last:border-0 ${row.rowClass}`}>
                      <td className="px-3 py-2.5 align-middle">
                        <p className="font-medium text-foreground/80">{row.label}</p>
                        <p className="text-[10px] text-foreground/40">{row.hint}</p>
                      </td>
                      {TIER_COLS.map((col) => (
                        <td key={col.label} className="px-2 py-2 align-middle">
                          <PriceInput
                            name={col.keys[freqKey]}
                            defaultValue={val(service, col.keys[freqKey] as keyof PriceService)}
                          />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TIER_ONLY: one price per size, no frequency */}
        {mode === "TIER_ONLY" && (
          <div className="grid gap-3 px-4 py-4 sm:grid-cols-3">
            {TIER_COLS.map((col) => (
              <label key={col.label} className="grid gap-1">
                <span className={lbl}>{col.label}</span>
                <PriceInput name={col.keys.weekly} defaultValue={val(service, col.keys.weekly as keyof PriceService)} />
              </label>
            ))}
          </div>
        )}

        {/* FREQ_ONLY: one price per frequency, no size */}
        {mode === "FREQ_ONLY" && (
          <div className="grid gap-3 px-4 py-4 sm:grid-cols-3">
            {FREQ_ONLY_ROWS.map((row) => (
              <label key={row.label} className="grid gap-1">
                <span className={lbl}>{row.label}</span>
                <PriceInput name={row.key} defaultValue={val(service, row.key as keyof PriceService)} />
                <span className="text-[10px] text-foreground/40">{row.hint}</span>
              </label>
            ))}
          </div>
        )}

        {/* Variable range — only relevant when a size matrix isn't the sole driver */}
        {mode !== "TIER_ONLY" && (
          <div className="border-t border-foreground/10 bg-foreground/2 px-4 py-3">
            <p className="text-xs font-semibold text-foreground/70">Rango variable (limpiezas / add-ons)</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-1">
                <span className={lbl}>Semanal desde</span>
                <PriceInput name="startingAtPrice" defaultValue={val(service, "startingAtPrice")} />
              </label>
              <label className="grid gap-1">
                <span className={lbl}>Hasta (máx.)</span>
                <PriceInput name="maxRangePrice" defaultValue={val(service, "maxRangePrice")} />
              </label>
              <label className="grid gap-1">
                <span className={lbl}>Quincenal desde</span>
                <PriceInput name="biweeklyStartingAtPrice" defaultValue={val(service, "biweeklyStartingAtPrice")} />
              </label>
              <label className="grid gap-1">
                <span className={lbl}>Una vez desde</span>
                <PriceInput name="oneTimeStartingAtPrice" defaultValue={val(service, "oneTimeStartingAtPrice")} />
              </label>
            </div>
          </div>
        )}

        <div className="border-t border-foreground/10 px-4 py-3">
          <label className="grid gap-1 sm:max-w-[12rem]">
            <span className={lbl}>Precio base (opcional)</span>
            <PriceInput name="defaultPrice" defaultValue={val(service, "defaultPrice")} />
          </label>
          <p className="mt-1.5 text-[10px] text-foreground/40">Se usa si falta un precio específico arriba.</p>
        </div>
      </div>
    </div>
  )
}

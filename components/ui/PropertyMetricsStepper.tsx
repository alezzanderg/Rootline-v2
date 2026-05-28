"use client"

import { useState } from "react"

type Metrics = {
  flowerBedsCount: number
  shrubsCount: number
  treesCount: number
  turfAreaSqFt: number
  bedsAreaSqFt: number
  hardscapeAreaSqFt: number
}

type Props = {
  initial?: Partial<Metrics>
}

const clamp = (n: number) => Math.max(0, Math.floor(n))

export function PropertyMetricsStepper({ initial }: Props) {
  const [m, setM] = useState<Metrics>({
    flowerBedsCount: clamp(initial?.flowerBedsCount ?? 0),
    shrubsCount: clamp(initial?.shrubsCount ?? 0),
    treesCount: clamp(initial?.treesCount ?? 0),
    turfAreaSqFt: clamp(initial?.turfAreaSqFt ?? 0),
    bedsAreaSqFt: clamp(initial?.bedsAreaSqFt ?? 0),
    hardscapeAreaSqFt: clamp(initial?.hardscapeAreaSqFt ?? 0),
  })

  const btn =
    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-foreground/20 text-sm font-semibold text-foreground/70 transition hover:bg-foreground/5"
  const row = "flex items-center justify-between gap-3 rounded-lg border border-foreground/10 bg-background px-3 py-2.5"

  function step(key: keyof Metrics, delta: number) {
    setM((prev) => ({ ...prev, [key]: clamp(prev[key] + delta) }))
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="flowerBedsCount" value={m.flowerBedsCount} />
      <input type="hidden" name="shrubsCount" value={m.shrubsCount} />
      <input type="hidden" name="treesCount" value={m.treesCount} />
      <input type="hidden" name="turfAreaSqFt" value={m.turfAreaSqFt} />
      <input type="hidden" name="bedsAreaSqFt" value={m.bedsAreaSqFt} />
      <input type="hidden" name="hardscapeAreaSqFt" value={m.hardscapeAreaSqFt} />

      <MetricRow label="Camas" value={m.flowerBedsCount} onMinus={() => step("flowerBedsCount", -1)} onPlus={() => step("flowerBedsCount", 1)} btn={btn} />
      <MetricRow label="Arbustos" value={m.shrubsCount} onMinus={() => step("shrubsCount", -1)} onPlus={() => step("shrubsCount", 1)} btn={btn} />
      <MetricRow label="Árboles" value={m.treesCount} onMinus={() => step("treesCount", -1)} onPlus={() => step("treesCount", 1)} btn={btn} />
      <MetricRow label="Césped (sqft)" value={m.turfAreaSqFt} onMinus={() => step("turfAreaSqFt", -100)} onPlus={() => step("turfAreaSqFt", 100)} btn={btn} />
      <MetricRow label="Camas (sqft)" value={m.bedsAreaSqFt} onMinus={() => step("bedsAreaSqFt", -50)} onPlus={() => step("bedsAreaSqFt", 50)} btn={btn} />
      <MetricRow label="Hardscape (sqft)" value={m.hardscapeAreaSqFt} onMinus={() => step("hardscapeAreaSqFt", -50)} onPlus={() => step("hardscapeAreaSqFt", 50)} btn={btn} />
    </div>
  )
}

function MetricRow({
  label,
  value,
  onMinus,
  onPlus,
  btn,
}: {
  label: string
  value: number
  onMinus: () => void
  onPlus: () => void
  btn: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-foreground/10 bg-background px-3 py-2.5">
      <span className="text-sm text-foreground/70">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onMinus} className={btn} aria-label={`Disminuir ${label}`}>
          -
        </button>
        <span className="min-w-16 text-center text-sm font-semibold tabular-nums">{value.toLocaleString()}</span>
        <button type="button" onClick={onPlus} className={btn} aria-label={`Aumentar ${label}`}>
          +
        </button>
      </div>
    </div>
  )
}


import type { ReactNode } from "react"

type PropertyMetrics = {
  flowerBedsCount?: number | null
  shrubsCount?: number | null
  treesCount?: number | null
  turfAreaSqFt?: number | null
  bedsAreaSqFt?: number | null
  hardscapeAreaSqFt?: number | null
  lotSizeSqFt?: number | null
}

const badge =
  "rounded border border-foreground/15 bg-foreground/3 px-1.5 py-0.5 font-semibold text-foreground/60"

/** Renders maintenance metric badges; only shows values &gt; 0 (avoids React rendering literal 0). */
export function PropertyMetricBadges({ metrics }: { metrics: PropertyMetrics }) {
  const items: ReactNode[] = []

  if ((metrics.flowerBedsCount ?? 0) > 0) {
    items.push(
      <span key="beds" className={badge}>
        Camas: {metrics.flowerBedsCount}
      </span>
    )
  }
  if ((metrics.shrubsCount ?? 0) > 0) {
    items.push(
      <span key="shrubs" className={badge}>
        Arbustos: {metrics.shrubsCount}
      </span>
    )
  }
  if ((metrics.treesCount ?? 0) > 0) {
    items.push(
      <span key="trees" className={badge}>
        Árboles: {metrics.treesCount}
      </span>
    )
  }
  if ((metrics.turfAreaSqFt ?? 0) > 0) {
    items.push(
      <span key="turf" className={badge}>
        Césped: {metrics.turfAreaSqFt!.toLocaleString()} sqft
      </span>
    )
  }
  if ((metrics.bedsAreaSqFt ?? 0) > 0) {
    items.push(
      <span key="bedsSqft" className={badge}>
        Camas sqft: {metrics.bedsAreaSqFt!.toLocaleString()} sqft
      </span>
    )
  }
  if ((metrics.hardscapeAreaSqFt ?? 0) > 0) {
    items.push(
      <span key="hardscape" className={badge}>
        Hardscape sqft: {metrics.hardscapeAreaSqFt!.toLocaleString()} sqft
      </span>
    )
  }
  if ((metrics.lotSizeSqFt ?? 0) > 0) {
    items.push(
      <span key="lot" className={badge}>
        Lote: {metrics.lotSizeSqFt!.toLocaleString()} sqft
      </span>
    )
  }

  if (items.length === 0) return null
  return <>{items}</>
}

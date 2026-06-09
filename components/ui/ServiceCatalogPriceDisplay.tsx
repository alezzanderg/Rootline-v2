import type { ServicePricingMode, ServicePricingRecord } from "@/lib/service-pricing"
import { PLAN_TIER_LABEL, resolveServiceUnitPrice, type PlanTier } from "@/lib/service-pricing"

type Props = ServicePricingRecord & {
  pricingUnit?: string | null
  maxRangePrice?: number | null
}

function fmt(n: number | null) {
  return n != null ? `$${n}` : "—"
}

const FREQS = [
  { label: "Semanal", key: "WEEKLY" as const, rowClass: "" },
  { label: "Quincenal", key: "BIWEEKLY" as const, rowClass: "bg-foreground/2" },
  { label: "Una vez", key: "ONE_TIME" as const, rowClass: "bg-amber-50/40" },
]

const TIERS: PlanTier[] = ["SMALL", "MEDIUM", "LARGE"]

function Shell({ unit, children }: { unit: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-foreground/12">
      <table className="w-full border-collapse text-sm">{children}</table>
      <p className="border-t border-foreground/8 bg-foreground/2 px-3 py-1.5 text-center text-[10px] text-foreground/40">
        {unit}
      </p>
    </div>
  )
}

export function ServiceCatalogPriceDisplay(service: Props) {
  const mode: ServicePricingMode = service.pricingMode ?? "FREQ_AND_TIER"
  const unit = service.pricingUnit ?? "por visita"

  // Solo tamaño: una fila de precios por tamaño, sin frecuencia.
  if (mode === "TIER_ONLY") {
    const prices = TIERS.map((tier) => resolveServiceUnitPrice(service, "WEEKLY", tier))
    if (prices.every((p) => p == null)) return null
    return (
      <Shell unit={unit}>
        <thead>
          <tr className="border-b border-foreground/10 bg-foreground/3">
            {TIERS.map((t) => (
              <th
                key={t}
                className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-foreground/40"
              >
                {PLAN_TIER_LABEL[t]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {prices.map((p, i) => (
              <td key={TIERS[i]} className="px-2 py-2.5 text-center">
                <span className="text-base font-bold tabular-nums">{fmt(p)}</span>
              </td>
            ))}
          </tr>
        </tbody>
      </Shell>
    )
  }

  // Solo frecuencia: una columna de precio por frecuencia, sin tamaño.
  if (mode === "FREQ_ONLY") {
    const rows = FREQS.map((f) => [f.label, resolveServiceUnitPrice(service, f.key, "MEDIUM"), f.rowClass] as const)
    if (rows.every(([, p]) => p == null)) return null
    return (
      <Shell unit={unit}>
        <thead>
          <tr className="border-b border-foreground/10 bg-foreground/3">
            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
              Frecuencia
            </th>
            <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
              Precio
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, p, rowClass]) => (
            <tr key={label} className={`border-b border-foreground/8 last:border-0 ${rowClass}`}>
              <td className="px-3 py-2.5 font-medium text-foreground/75">{label}</td>
              <td className="px-3 py-2.5 text-right">
                <span className="text-base font-bold tabular-nums">{fmt(p)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </Shell>
    )
  }

  // FREQ_AND_TIER (default).
  const hasTiers = service.smallPrice || service.mediumPrice || service.largePrice

  if (hasTiers) {
    return (
      <Shell unit={unit}>
        <thead>
          <tr className="border-b border-foreground/10 bg-foreground/3">
            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
              Frecuencia
            </th>
            {TIERS.map((t) => (
              <th
                key={t}
                className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-foreground/40"
              >
                {PLAN_TIER_LABEL[t]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FREQS.map((f) => {
            const prices = TIERS.map((tier) => resolveServiceUnitPrice(service, f.key, tier))
            if (prices.every((p) => p == null)) return null
            return (
              <tr key={f.label} className={`border-b border-foreground/8 last:border-0 ${f.rowClass}`}>
                <td className="px-3 py-2.5 font-medium text-foreground/75">{f.label}</td>
                {prices.map((p, i) => (
                  <td key={TIERS[i]} className="px-2 py-2.5 text-center">
                    <span className="text-base font-bold tabular-nums">{fmt(p)}</span>
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </Shell>
    )
  }

  if (service.startingAtPrice) {
    const weekly = Number(service.startingAtPrice)
    const biweekly =
      service.biweeklyStartingAtPrice != null
        ? Number(service.biweeklyStartingAtPrice)
        : resolveServiceUnitPrice(service, "BIWEEKLY")
    const oneTime =
      service.oneTimeStartingAtPrice != null
        ? Number(service.oneTimeStartingAtPrice)
        : resolveServiceUnitPrice(service, "ONE_TIME")

    return (
      <Shell unit={unit}>
        <thead>
          <tr className="border-b border-foreground/10 bg-foreground/3">
            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
              Frecuencia
            </th>
            <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
              Desde
            </th>
          </tr>
        </thead>
        <tbody>
          {(
            [
              ["Semanal", weekly, service.maxRangePrice],
              ["Quincenal", biweekly, null],
              ["Una vez", oneTime, null],
            ] as const
          ).map(([label, from, max]) => (
            <tr key={label} className="border-b border-foreground/8 last:border-0">
              <td className="px-3 py-2.5 font-medium text-foreground/75">{label}</td>
              <td className="px-3 py-2.5 text-right">
                <span className="text-base font-bold tabular-nums">{fmt(from)}</span>
                {max != null ? <span className="ml-2 text-xs text-foreground/45">hasta ${max}</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </Shell>
    )
  }

  return null
}

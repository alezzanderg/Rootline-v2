"use client"

import { useEffect, useState, useTransition } from "react"

import {
  PLAN_TIER_LABEL,
  resolveServiceUnitPrice,
  type PlanTier,
  type ServiceFrequency,
  type ServicePricingRecord,
} from "@/lib/service-pricing"

export type EstimadoServiceOption = {
  id: string
  name: string
  category: string
  pricingUnit: string | null
  pricing: ServicePricingRecord
}

const ic =
  "rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

function resolvePrice(
  service: EstimadoServiceOption | undefined,
  frequency: ServiceFrequency,
  tier: PlanTier
): string {
  if (!service) return ""
  const n = resolveServiceUnitPrice(service.pricing, frequency, tier)
  return n != null ? String(n) : ""
}

function AddLineForm({
  quoteId,
  services,
  frequency,
  planTier,
  title,
  hint,
  addItemAction,
}: {
  quoteId: string
  services: EstimadoServiceOption[]
  frequency: ServiceFrequency
  planTier: PlanTier
  title: string
  hint?: string
  addItemAction: (formData: FormData) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()
  const [serviceId, setServiceId] = useState("")
  const [unitPrice, setUnitPrice] = useState("")

  useEffect(() => {
    if (!serviceId) return
    const svc = services.find((s) => s.id === serviceId)
    setUnitPrice(resolvePrice(svc, frequency, planTier))
  }, [serviceId, frequency, planTier, services])

  function onServiceChange(id: string) {
    setServiceId(id)
    const svc = services.find((s) => s.id === id)
    setUnitPrice(resolvePrice(svc, frequency, planTier))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    startTransition(async () => {
      await addItemAction(formData)
      form.reset()
      setServiceId("")
      setUnitPrice("")
    })
  }

  if (services.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-foreground/15 px-3 py-4 text-sm text-foreground/45">
        No hay servicios en esta categoría.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4">
      <input type="hidden" name="quoteId" value={quoteId} />
      <p className="text-sm font-semibold text-foreground/80">{title}</p>
      {hint ? <p className="mt-1 text-xs text-foreground/45">{hint}</p> : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 sm:col-span-2">
          <span className={lbl}>Servicio</span>
          <select
            name="serviceId"
            required
            value={serviceId}
            onChange={(e) => onServiceChange(e.target.value)}
            className={ic}
          >
            <option value="">Selecciona</option>
            {services.map((s) => {
              const p = resolveServiceUnitPrice(s.pricing, frequency, planTier)
              return (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {p != null ? ` — $${p}` : ""}
                  {s.pricingUnit ? ` (${s.pricingUnit})` : ""}
                </option>
              )
            })}
          </select>
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Cantidad</span>
          <input name="quantity" type="number" min="0.1" step="0.1" defaultValue="1" className={ic} />
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Precio unitario</span>
          <input
            name="unitPrice"
            type="number"
            min="0"
            step="0.01"
            required
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className={ic}
          />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          <span className={lbl}>Descripción (opcional)</span>
          <input name="description" className={ic} placeholder="Detalle para el cliente" />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50 sm:col-span-2"
        >
          {isPending ? "Agregando…" : "Agregar línea"}
        </button>
      </div>
    </form>
  )
}

export function EstimadoQuoteServices({
  quoteId,
  initialFrequency,
  initialPlanTier,
  coreServices,
  addonServices,
  updateFrequencyAction,
  updatePlanTierAction,
  addItemAction,
}: {
  quoteId: string
  initialFrequency: string | null
  initialPlanTier: string | null
  coreServices: EstimadoServiceOption[]
  addonServices: EstimadoServiceOption[]
  updateFrequencyAction: (formData: FormData) => Promise<void>
  updatePlanTierAction: (formData: FormData) => Promise<void>
  addItemAction: (formData: FormData) => Promise<void>
}) {
  const [frequency, setFrequency] = useState<ServiceFrequency>(
    (initialFrequency === "WEEKLY" || initialFrequency === "BIWEEKLY" || initialFrequency === "ONE_TIME"
      ? initialFrequency
      : "ONE_TIME") as ServiceFrequency
  )
  const [planTier, setPlanTier] = useState<PlanTier>(
    (initialPlanTier === "SMALL" || initialPlanTier === "MEDIUM" || initialPlanTier === "LARGE"
      ? initialPlanTier
      : "MEDIUM") as PlanTier
  )
  const [freqPending, startFreqTransition] = useTransition()
  const [tierPending, startTierTransition] = useTransition()

  function onFrequencyChange(next: ServiceFrequency) {
    setFrequency(next)
    const formData = new FormData()
    formData.set("quoteId", quoteId)
    formData.set("serviceFrequency", next)
    startFreqTransition(async () => {
      await updateFrequencyAction(formData)
    })
  }

  function onPlanTierChange(next: PlanTier) {
    setPlanTier(next)
    const formData = new FormData()
    formData.set("quoteId", quoteId)
    formData.set("planTier", next)
    startTierTransition(async () => {
      await updatePlanTierAction(formData)
    })
  }

  return (
    <div className="space-y-4">
      {/* Frequency + tier selectors in one card */}
      <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-foreground/80">Frecuencia</p>
            <p className="mt-1 text-xs text-foreground/45">
              Ajusta precios de servicios principales y complementos.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["ONE_TIME", "Una vez"],
                  ["WEEKLY", "Semanal"],
                  ["BIWEEKLY", "Quincenal"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  disabled={freqPending}
                  onClick={() => onFrequencyChange(value)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                    frequency === value
                      ? "border-accent/60 bg-accent/20 text-accent"
                      : "border-foreground/20 text-foreground/70 hover:bg-foreground/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:border-l sm:border-foreground/10 sm:pl-5">
            <p className="text-sm font-semibold text-foreground/80">Tamaño del yard</p>
            <p className="mt-1 text-xs text-foreground/45">
              Define precios Small / Medium / Large.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["SMALL", "MEDIUM", "LARGE"] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  disabled={tierPending}
                  onClick={() => onPlanTierChange(tier)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                    planTier === tier
                      ? "border-accent/60 bg-accent/20 text-accent"
                      : "border-foreground/20 text-foreground/70 hover:bg-foreground/5"
                  }`}
                >
                  {PLAN_TIER_LABEL[tier]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddLineForm
        quoteId={quoteId}
        services={coreServices}
        frequency={frequency}
        planTier={planTier}
        title="Servicio principal"
        hint="Precio según frecuencia y tamaño del yard (catálogo)."
        addItemAction={addItemAction}
      />

      <AddLineForm
        quoteId={quoteId}
        services={addonServices}
        frequency={frequency}
        planTier={planTier}
        title="Complementos (add-ons)"
        hint="Extras según frecuencia y tamaño del yard. Puedes ajustar el precio unitario."
        addItemAction={addItemAction}
      />
    </div>
  )
}

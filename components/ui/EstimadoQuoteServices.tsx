"use client"

import { useState, useTransition } from "react"

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

export type EstimadoPlanOption = {
  id: string
  name: string
  tier: string
  monthlyPrice: number
  visitsPerMonth: number
}

const ic =
  "rounded-xl border border-foreground/20 bg-white/70 px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

const WEEKDAYS = [
  ["1", "Lun"],
  ["2", "Mar"],
  ["3", "Mié"],
  ["4", "Jue"],
  ["5", "Vie"],
  ["6", "Sáb"],
  ["7", "Dom"],
] as const

function fmt(n: number | null): string {
  return n != null ? `$${n.toFixed(2)}` : "—"
}

/** POS-style tappable card that adds a catalog service line on click. */
function ServiceCard({
  quoteId,
  service,
  frequency,
  planTier,
  addItemAction,
}: {
  quoteId: string
  service: EstimadoServiceOption
  frequency: ServiceFrequency
  planTier: PlanTier
  addItemAction: (formData: FormData) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()
  const price = resolveServiceUnitPrice(service.pricing, frequency, planTier)

  function add() {
    if (price == null) return
    const formData = new FormData()
    formData.set("quoteId", quoteId)
    formData.set("serviceId", service.id)
    formData.set("quantity", "1")
    formData.set("unitPrice", String(price))
    startTransition(async () => {
      await addItemAction(formData)
    })
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={isPending || price == null}
      className="group relative flex min-h-[78px] flex-col justify-between rounded-2xl border border-foreground/15 bg-white/70 p-3 text-left transition hover:border-accent/50 hover:bg-accent/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground/85">{service.name}</span>
      <span className="mt-1 flex items-center justify-between">
        <span className="text-sm font-bold tabular-nums text-accent">{fmt(price)}</span>
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent opacity-0 transition group-hover:opacity-100">
          + Agregar
        </span>
      </span>
      {isPending ? (
        <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 text-xs font-semibold text-accent">
          Agregando…
        </span>
      ) : null}
    </button>
  )
}

function PlanCard({
  label,
  priceLabel,
  sublabel,
  active,
  pending,
  onClick,
}: {
  label: string
  priceLabel: string
  sublabel?: string
  active?: boolean
  pending?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`relative flex min-h-[78px] flex-col justify-between rounded-2xl border p-3 text-left transition active:scale-[0.98] disabled:opacity-50 ${
        active ? "border-amber-500/60 bg-amber-100/60" : "border-amber-400/30 bg-amber-50/50 hover:border-amber-500/50 hover:bg-amber-100/50"
      }`}
    >
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground/85">{label}</span>
      <span className="mt-1 flex items-baseline justify-between">
        <span className="text-sm font-bold tabular-nums text-amber-800">{priceLabel}</span>
        {sublabel ? <span className="text-[10px] text-amber-800/60">{sublabel}</span> : null}
      </span>
      {pending ? (
        <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 text-xs font-semibold text-amber-800">
          Agregando…
        </span>
      ) : null}
    </button>
  )
}

export function EstimadoQuoteServices({
  quoteId,
  initialFrequency,
  initialPlanTier,
  coreServices,
  addonServices,
  plans,
  updateFrequencyAction,
  updatePlanTierAction,
  addItemAction,
  addCustomItemAction,
  addPlanItemAction,
}: {
  quoteId: string
  initialFrequency: string | null
  initialPlanTier: string | null
  coreServices: EstimadoServiceOption[]
  addonServices: EstimadoServiceOption[]
  plans: EstimadoPlanOption[]
  updateFrequencyAction: (formData: FormData) => Promise<void>
  updatePlanTierAction: (formData: FormData) => Promise<void>
  addItemAction: (formData: FormData) => Promise<void>
  addCustomItemAction: (formData: FormData) => Promise<void>
  addPlanItemAction: (formData: FormData) => Promise<void>
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

  // Custom service / add-on line
  const [customOpen, setCustomOpen] = useState(false)
  const [csName, setCsName] = useState("")
  const [csPrice, setCsPrice] = useState("")
  const [csQty, setCsQty] = useState("1")
  const [csPending, startCustomTransition] = useTransition()

  function addCustomItem() {
    if (!csName.trim() || !csPrice.trim()) return
    const formData = new FormData()
    formData.set("quoteId", quoteId)
    formData.set("name", csName.trim())
    formData.set("unitPrice", csPrice.trim())
    formData.set("quantity", csQty.trim() || "1")
    startCustomTransition(async () => {
      await addCustomItemAction(formData)
      setCsName("")
      setCsPrice("")
      setCsQty("1")
      setCustomOpen(false)
    })
  }

  // Membership scheduling (shared for whichever plan you tap)
  const [startWeek, setStartWeek] = useState("NEXT_WEEK")
  const [weekday, setWeekday] = useState("2")
  const [planTime, setPlanTime] = useState("")
  const [planPending, startPlanTransition] = useTransition()
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customPrice, setCustomPrice] = useState("")
  const [customVisits, setCustomVisits] = useState("4")

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

  function addCatalogPlan(planId: string) {
    setPendingPlanId(planId)
    const formData = new FormData()
    formData.set("quoteId", quoteId)
    formData.set("planMode", "catalog")
    formData.set("planId", planId)
    formData.set("planStartWeek", startWeek)
    formData.set("planWeekday", weekday)
    formData.set("planTime", planTime)
    startPlanTransition(async () => {
      await addPlanItemAction(formData)
      setPendingPlanId(null)
    })
  }

  function addCustomPlan() {
    if (!customName.trim() || !customPrice.trim()) return
    setPendingPlanId("custom")
    const formData = new FormData()
    formData.set("quoteId", quoteId)
    formData.set("planMode", "custom")
    formData.set("customName", customName.trim())
    formData.set("customMonthly", customPrice.trim())
    formData.set("customVisits", customVisits.trim() || "4")
    formData.set("planStartWeek", startWeek)
    formData.set("planWeekday", weekday)
    formData.set("planTime", planTime)
    startPlanTransition(async () => {
      await addPlanItemAction(formData)
      setPendingPlanId(null)
      setShowCustom(false)
      setCustomName("")
      setCustomPrice("")
      setCustomVisits("4")
    })
  }

  const btn = (activeVal: boolean, pending: boolean) =>
    `rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
      activeVal ? "border-accent/60 bg-accent/20 text-accent" : "border-foreground/20 text-foreground/70 hover:bg-foreground/5"
    } ${pending ? "opacity-60" : ""}`

  return (
    <div className="space-y-4">
      {/* Frequency + tier */}
      <div className="rounded-2xl border border-foreground/12 bg-white/50 p-4">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-foreground/80">Frecuencia</p>
            <p className="mt-1 text-xs text-foreground/45">Ajusta el precio de los servicios y complementos.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["ONE_TIME", "Una vez"],
                  ["WEEKLY", "Semanal"],
                  ["BIWEEKLY", "Quincenal"],
                ] as const
              ).map(([value, label]) => (
                <button key={value} type="button" disabled={freqPending} onClick={() => onFrequencyChange(value)} className={btn(frequency === value, freqPending)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:border-l sm:border-foreground/10 sm:pl-5">
            <p className="text-sm font-semibold text-foreground/80">Tamaño del yard</p>
            <p className="mt-1 text-xs text-foreground/45">Define precios Pequeño / Mediano / Grande.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["SMALL", "MEDIUM", "LARGE"] as const).map((tier) => (
                <button key={tier} type="button" disabled={tierPending} onClick={() => onPlanTierChange(tier)} className={btn(planTier === tier, tierPending)}>
                  {PLAN_TIER_LABEL[tier]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-foreground/40">Toca una tarjeta para agregarla al estimado.</p>
      </div>

      {/* Core services */}
      {coreServices.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground/80">Servicio principal</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {coreServices.map((s) => (
              <ServiceCard key={s.id} quoteId={quoteId} service={s} frequency={frequency} planTier={planTier} addItemAction={addItemAction} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Add-ons */}
      {addonServices.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-foreground/80">Complementos (add-ons)</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {addonServices.map((s) => (
              <ServiceCard key={s.id} quoteId={quoteId} service={s} frequency={frequency} planTier={planTier} addItemAction={addItemAction} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Custom service / add-on */}
      <div>
        <p className="mb-2 text-sm font-semibold text-foreground/80">Servicio / add-on personalizado</p>
        {customOpen ? (
          <div className="grid gap-2 rounded-2xl border border-foreground/15 bg-white/60 p-3">
            <label className="grid gap-1">
              <span className={lbl}>Nombre</span>
              <input value={csName} onChange={(e) => setCsName(e.target.value)} placeholder="Ej. Limpieza profunda" className={ic} autoFocus />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex shrink-0 items-end gap-2">
                <label className="grid w-24 shrink-0 gap-1">
                  <span className={lbl}>Precio ($)</span>
                  <input value={csPrice} onChange={(e) => setCsPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className={`${ic} w-full text-right`} />
                </label>
                <label className="grid w-16 shrink-0 gap-1">
                  <span className={lbl}>Cant.</span>
                  <input value={csQty} onChange={(e) => setCsQty(e.target.value)} type="number" min="0.1" step="0.1" className={`${ic} w-full text-right`} />
                </label>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={addCustomItem}
                  disabled={csPending || !csName.trim() || !csPrice.trim()}
                  className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
                >
                  {csPending ? "Agregando…" : "Agregar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomOpen(false)
                    setCsName("")
                    setCsPrice("")
                    setCsQty("1")
                  }}
                  className="rounded-xl border border-foreground/20 px-3 py-2.5 text-sm font-semibold text-foreground/60 transition hover:bg-foreground/5"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-foreground/25 px-3 py-3 text-sm font-semibold text-foreground/60 transition hover:border-accent/50 hover:bg-accent/5 hover:text-accent"
          >
            <span className="text-lg leading-none">+</span>
            Agregar servicio / add-on personalizado
          </button>
        )}
      </div>

      {/* Membership plans */}
      <div className="rounded-2xl border border-amber-400/30 bg-amber-50/30 p-4">
        <p className="text-sm font-semibold text-foreground/80">Plan de membresía (recurrente)</p>
        <p className="mt-1 text-xs text-foreground/45">
          Define el horario y toca un plan. Se cobra por ciclo, aparte del total de hoy; al aprobar se asigna la membresía.
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <label className="grid gap-1">
            <span className={lbl}>Primera semana</span>
            <select value={startWeek} onChange={(e) => setStartWeek(e.target.value)} className={ic}>
              <option value="NEXT_WEEK">Próxima semana</option>
              <option value="THIS_WEEK">Esta semana</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Día de visita</span>
            <select value={weekday} onChange={(e) => setWeekday(e.target.value)} className={ic}>
              {WEEKDAYS.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Hora (opcional)</span>
            <input value={planTime} onChange={(e) => setPlanTime(e.target.value)} placeholder="9:00" className={ic} />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              label={p.name}
              priceLabel={`$${p.monthlyPrice}/ciclo`}
              sublabel={`${p.visitsPerMonth} visitas`}
              pending={planPending && pendingPlanId === p.id}
              onClick={() => addCatalogPlan(p.id)}
            />
          ))}
          <button
            type="button"
            onClick={() => setShowCustom((v) => !v)}
            className={`flex min-h-[78px] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed p-3 text-center transition ${
              showCustom ? "border-amber-500/60 bg-amber-100/50 text-amber-800" : "border-amber-400/40 text-amber-700 hover:bg-amber-50"
            }`}
          >
            <span className="text-lg leading-none">+</span>
            <span className="text-xs font-semibold">Personalizado</span>
          </button>
        </div>

        {showCustom ? (
          <div className="mt-3 grid gap-2 rounded-xl border border-amber-400/30 bg-white/60 p-3 sm:grid-cols-2">
            <label className="grid gap-1 sm:col-span-2">
              <span className={lbl}>Nombre del plan</span>
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Ej. Plan semanal personalizado" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Precio por ciclo ($)</span>
              <input value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} type="number" min="0.01" step="0.01" placeholder="260.00" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Visitas por ciclo</span>
              <input value={customVisits} onChange={(e) => setCustomVisits(e.target.value)} type="number" min="1" step="1" className={ic} />
            </label>
            <button
              type="button"
              onClick={addCustomPlan}
              disabled={planPending || !customName.trim() || !customPrice.trim()}
              className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 sm:col-span-2"
            >
              {planPending && pendingPlanId === "custom" ? "Agregando…" : "Agregar plan personalizado"}
            </button>
          </div>
        ) : null}

        {plans.length === 0 && !showCustom ? (
          <p className="mt-3 text-xs text-foreground/45">No hay planes en el catálogo — usa “Personalizado”.</p>
        ) : null}
      </div>
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"

import { isRecurringFrequency } from "@/lib/quote-labels"

export type EstimadoServiceOption = {
  id: string
  name: string
  category: string
  defaultPrice: number | null
  startingAtPrice: number | null
  pricingUnit: string | null
}

const ic =
  "rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

function catalogPrice(s: EstimadoServiceOption): string {
  const n = s.defaultPrice ?? s.startingAtPrice
  return n != null ? String(n) : ""
}

function AddLineForm({
  quoteId,
  services,
  title,
  hint,
  addItemAction,
}: {
  quoteId: string
  services: EstimadoServiceOption[]
  title: string
  hint?: string
  addItemAction: (formData: FormData) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()
  const [serviceId, setServiceId] = useState("")
  const [unitPrice, setUnitPrice] = useState("")

  function onServiceChange(id: string) {
    setServiceId(id)
    const svc = services.find((s) => s.id === id)
    setUnitPrice(svc ? catalogPrice(svc) : "")
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
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.pricingUnit ? ` (${s.pricingUnit})` : ""}
              </option>
            ))}
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
  coreServices,
  addonServices,
  updateFrequencyAction,
  addItemAction,
}: {
  quoteId: string
  initialFrequency: string | null
  coreServices: EstimadoServiceOption[]
  addonServices: EstimadoServiceOption[]
  updateFrequencyAction: (formData: FormData) => Promise<void>
  addItemAction: (formData: FormData) => Promise<void>
}) {
  const [frequency, setFrequency] = useState(initialFrequency ?? "ONE_TIME")
  const [freqPending, startFreqTransition] = useTransition()
  const showAddons = isRecurringFrequency(frequency)

  function onFrequencyChange(next: string) {
    setFrequency(next)
    const formData = new FormData()
    formData.set("quoteId", quoteId)
    formData.set("serviceFrequency", next)
    startFreqTransition(async () => {
      await updateFrequencyAction(formData)
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4">
        <p className="text-sm font-semibold text-foreground/80">Frecuencia del servicio</p>
        <p className="mt-1 text-xs text-foreground/45">
          Semanal o quincenal habilita complementos (add-ons) por visita.
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

      <AddLineForm
        quoteId={quoteId}
        services={coreServices}
        title="Servicio principal"
        hint="Corte, mantenimiento o limpieza base del estimado."
        addItemAction={addItemAction}
      />

      {showAddons ? (
        <AddLineForm
          quoteId={quoteId}
          services={addonServices}
          title="Complementos (add-ons)"
          hint="Extras por visita: arbustos, bolsas, escombros, etc."
          addItemAction={addItemAction}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-foreground/15 px-4 py-3 text-xs text-foreground/45">
          Elige <strong className="font-medium text-foreground/60">Semanal</strong> o{" "}
          <strong className="font-medium text-foreground/60">Quincenal</strong> para agregar complementos al estimado.
        </p>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { updateTaxRateAction } from "@/app/(forAdmins)/dashboard/configuracion/_actions"

const ic =
  "w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"
const card = "rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5"
const primaryBtn =
  "rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"

export function AjustesPanel({ taxRatePercent }: { taxRatePercent: string }) {
  const router = useRouter()
  const [msg, setMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    const result = await updateTaxRateAction(fd)
    setMsg(result?.error ? `Error: ${result.error}` : "Tax rate guardado.")
    if (!result?.error) router.refresh()
  }

  return (
    <div className="space-y-4">
      <section className={card}>
        <h2 className="font-display text-lg font-semibold">Impuestos</h2>
        <p className="mt-1 text-sm text-foreground/55">
          Este porcentaje se usa para calcular tax y total en todos los estimados.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className={lbl}>Tax rate (%)</span>
            <input
              name="taxRatePercent"
              type="number"
              min="0"
              step="0.001"
              defaultValue={taxRatePercent}
              className={ic}
            />
          </label>

          {msg ? (
            <p className={`text-sm ${msg.startsWith("Error") ? "text-red-600" : "text-emerald-600"}`}>
              {msg}
            </p>
          ) : null}

          <button type="submit" className={primaryBtn}>
            Guardar configuración
          </button>
        </form>
      </section>
    </div>
  )
}

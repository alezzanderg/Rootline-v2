import { revalidatePath } from "next/cache"

import { getTaxRatePercent, setTaxRatePercent } from "@/lib/app-settings"

function parseRate(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null
  const n = Number(v.trim())
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

export default async function ConfiguracionPage() {
  async function updateTaxRateAction(formData: FormData) {
    "use server"
    const rate = parseRate(formData.get("taxRatePercent"))
    if (rate === null) return
    await setTaxRatePercent(rate)
    revalidatePath("/dashboard/configuracion")
    revalidatePath("/dashboard/estimados")
  }

  const taxRatePercent = await getTaxRatePercent()
  const ic =
    "rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"

  return (
    <section className="mx-auto max-w-3xl text-foreground">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin</p>
        <h1 className="mt-1 font-(family-name:--font-display-family) text-3xl font-semibold sm:text-4xl">
          Configuracion
        </h1>
        <p className="mt-2 text-sm text-foreground/55">
          Ajustes globales del sistema para el dashboard.
        </p>
      </div>

      <form action={updateTaxRateAction} className="mt-6 rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5">
        <p className="mb-3 text-sm font-semibold text-foreground/80">Impuestos</p>
        <label className="grid gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Tax rate (%)</span>
          <input
            name="taxRatePercent"
            type="number"
            min="0"
            step="0.001"
            defaultValue={taxRatePercent.toString()}
            className={ic}
          />
        </label>
        <p className="mt-2 text-xs text-foreground/45">
          Este porcentaje se usa para calcular tax y total en todos los estimados.
        </p>
        <button
          type="submit"
          className="mt-4 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
        >
          Guardar configuracion
        </button>
      </form>
    </section>
  )
}


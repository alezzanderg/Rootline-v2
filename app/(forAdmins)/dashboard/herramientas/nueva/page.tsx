import Link from "next/link"

import { ToolFormFields } from "@/components/ui/ToolFormFields"
import { createToolAction } from "@/lib/tools-actions"

export default function NuevaHerramientaPage() {
  return (
    <section className="admin-page--narrow text-foreground">
      <div className="mb-5">
        <Link href="/dashboard/herramientas" className="text-sm text-foreground/55 transition hover:text-foreground">
          ← Volver a herramientas
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Nueva herramienta</h1>
        <p className="mt-2 text-sm text-foreground/55">
          Registra un equipo en el inventario con su información de compra, mantenimiento y ficha técnica.
        </p>
      </div>

      <form action={createToolAction} className="grid gap-5">
        <ToolFormFields />
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
          >
            Guardar herramienta
          </button>
          <Link
            href="/dashboard/herramientas"
            className="rounded-xl border border-foreground/20 px-5 py-2.5 text-sm font-semibold text-foreground/70 transition hover:bg-foreground/5"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}

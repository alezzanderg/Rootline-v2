import Link from "next/link"
import { notFound } from "next/navigation"

import { ToolFormFields } from "@/components/ui/ToolFormFields"
import { deleteToolAction, updateToolAction } from "@/lib/tools-actions"
import { prisma } from "@/lib/prisma"

type Props = { params: Promise<{ id: string }> }

export default async function EditarHerramientaPage({ params }: Props) {
  const { id } = await params
  const tool = await prisma.tool.findUnique({ where: { id } })
  if (!tool) notFound()

  return (
    <section className="admin-page--narrow text-foreground">
      <div className="mb-5">
        <Link href="/dashboard/herramientas" className="text-sm text-foreground/55 transition hover:text-foreground">
          ← Volver a herramientas
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Editar herramienta</h1>
        <p className="mt-2 text-sm text-foreground/55">{tool.name}</p>
      </div>

      <form action={updateToolAction} className="grid gap-5">
        <input type="hidden" name="id" value={tool.id} />
        <ToolFormFields tool={tool} editing />
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
          >
            Guardar cambios
          </button>
          <Link
            href="/dashboard/herramientas"
            className="rounded-xl border border-foreground/20 px-5 py-2.5 text-sm font-semibold text-foreground/70 transition hover:bg-foreground/5"
          >
            Cancelar
          </Link>
        </div>
      </form>

      {/* Danger zone */}
      <details className="mt-8 rounded-2xl border border-rose-300/40 bg-rose-50/40 p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-rose-700">
          Eliminar herramienta
        </summary>
        <form action={deleteToolAction} className="mt-3 flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={tool.id} />
          <label className="flex items-center gap-2 text-sm text-foreground/60">
            <input type="checkbox" name="confirmDelete" />
            Confirmar que quiero eliminar esta herramienta permanentemente.
          </label>
          <button
            type="submit"
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Eliminar
          </button>
        </form>
      </details>
    </section>
  )
}

import Link from "next/link"

import { OperatingTransactionForm, type ProjectOption } from "@/components/ui/OperatingTransactionForm"
import { createTransactionAction } from "@/lib/operating-actions"
import { prisma } from "@/lib/prisma"
import { fmtDate, fmtMoney } from "@/lib/operating-shared"

export default async function NuevoMovimientoPage() {
  const [partners, quotes, jobs] = await Promise.all([
    prisma.partner.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
    prisma.job.findMany({
      orderBy: { scheduledAt: "desc" },
      take: 200,
      include: { property: { include: { customer: { select: { firstName: true, lastName: true } } } } },
    }),
  ])

  const partnerOptions = partners.map((p) => ({ id: p.id, name: p.name }))
  const projectOptions: ProjectOption[] = [
    ...quotes.map((q) => ({
      value: `quote:${q.id}`,
      group: "Estimados",
      label: `#${q.id.slice(0, 8)} — ${q.customer.firstName} ${q.customer.lastName} · ${fmtMoney(q.total)} (${fmtDate(q.createdAt)})`,
    })),
    ...jobs.map((j) => ({
      value: `job:${j.id}`,
      group: "Trabajos",
      label: `${j.title} — ${j.property.customer.firstName} ${j.property.customer.lastName} (${fmtDate(j.scheduledAt)})`,
    })),
  ]

  return (
    <section className="mx-auto max-w-3xl text-foreground">
      <div className="mb-5">
        <Link href="/dashboard/operating" className="text-sm text-foreground/55 transition hover:text-foreground">
          ← Volver a Operating
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Registrar movimiento</h1>
        <p className="mt-2 text-sm text-foreground/55">
          Aportes y préstamos de socios, reembolsos, gastos de la empresa y gastos por proyecto.
        </p>
      </div>

      {partnerOptions.length === 0 ? (
        <p className="mb-4 rounded-xl border border-amber-400/40 bg-amber-50/60 px-4 py-3 text-sm text-amber-800">
          Aún no tienes socios. Para aportes, préstamos o reembolsos primero agrega un socio en Operating.
        </p>
      ) : null}

      <OperatingTransactionForm action={createTransactionAction} partners={partnerOptions} projects={projectOptions} />
    </section>
  )
}

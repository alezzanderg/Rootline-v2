import Link from "next/link"
import { notFound } from "next/navigation"

import { OperatingTransactionForm, type ProjectOption } from "@/components/ui/OperatingTransactionForm"
import { deleteTransactionAction, updateTransactionAction } from "@/lib/operating-actions"
import { prisma } from "@/lib/prisma"
import { fmtDate, fmtMoney, num, type OperatingTxnType } from "@/lib/operating-shared"

type Props = { params: Promise<{ id: string }> }

export default async function EditarMovimientoPage({ params }: Props) {
  const { id } = await params
  const [txn, partners, quotes, jobs] = await Promise.all([
    prisma.operatingTransaction.findUnique({ where: { id } }),
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
  if (!txn) notFound()

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
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Editar movimiento</h1>
      </div>

      <OperatingTransactionForm
        action={updateTransactionAction}
        partners={partnerOptions}
        projects={projectOptions}
        submitLabel="Guardar cambios"
        initial={{
          id: txn.id,
          type: txn.type as OperatingTxnType,
          amount: num(txn.amount),
          occurredAt: txn.occurredAt,
          description: txn.description,
          category: txn.category,
          vendor: txn.vendor,
          invoiceNumber: txn.invoiceNumber,
          receiptUrl: txn.receiptUrl,
          affectsCash: txn.affectsCash,
          partnerId: txn.partnerId,
          jobId: txn.jobId,
          quoteId: txn.quoteId,
        }}
      />

      <details className="mt-8 rounded-2xl border border-rose-300/40 bg-rose-50/40 p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-rose-700">Eliminar movimiento</summary>
        <form action={deleteTransactionAction} className="mt-3">
          <input type="hidden" name="id" value={txn.id} />
          <button type="submit" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
            Eliminar permanentemente
          </button>
        </form>
      </details>
    </section>
  )
}

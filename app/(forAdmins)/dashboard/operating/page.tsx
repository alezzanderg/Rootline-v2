import Link from "next/link"
import { Pencil, Plus, Receipt } from "lucide-react"

import { EditDialog } from "@/components/ui/EditDialog"
import { prisma } from "@/lib/prisma"
import { createPartnerAction, deletePartnerAction, deleteTransactionAction, updatePartnerAction } from "@/lib/operating-actions"
import {
  OPERATING_TYPE_META,
  PERIOD_LABEL,
  fmtDate,
  fmtMoney,
  normalizePeriod,
  num,
  periodStart,
  type OperatingPeriod,
  type OperatingTxnType,
} from "@/lib/operating-shared"

type Props = { searchParams?: Promise<{ period?: string }> }

const ic = "w-full rounded-xl border border-foreground/20 bg-white/60 px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

export default async function OperatingPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {}
  const period = normalizePeriod(sp.period)
  const start = periodStart(period)

  const [partners, allTxns] = await Promise.all([
    prisma.partner.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    prisma.operatingTransaction.findMany({
      orderBy: { occurredAt: "desc" },
      include: {
        partner: { select: { name: true } },
        job: { select: { title: true } },
        quote: { select: { id: true, customer: { select: { firstName: true, lastName: true } } } },
      },
    }),
  ])

  const periodTxns = start ? allTxns.filter((t) => t.occurredAt >= start) : allTxns

  // Period totals
  const byType: Record<OperatingTxnType, number> = {
    CAPITAL_CONTRIBUTION: 0,
    PARTNER_LOAN: 0,
    PARTNER_REIMBURSEMENT: 0,
    COMPANY_EXPENSE: 0,
    PROJECT_EXPENSE: 0,
  }
  const byCategory = new Map<string, number>()
  for (const t of periodTxns) {
    const amt = num(t.amount)
    const meta = OPERATING_TYPE_META[t.type as OperatingTxnType]
    byType[t.type as OperatingTxnType] += amt
    if (meta.isExpense) {
      const key = t.category?.trim() || "Sin categoría"
      byCategory.set(key, (byCategory.get(key) ?? 0) + amt)
    }
  }
  const gastosPeriodo = byType.COMPANY_EXPENSE + byType.PROJECT_EXPENSE
  const aportesPeriodo = byType.CAPITAL_CONTRIBUTION + byType.PARTNER_LOAN
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1])
  const maxCat = categories.length ? categories[0][1] : 0

  // Partner balances (all-time)
  const balances = partners.map((p) => {
    let capital = 0
    let loans = 0
    let reimb = 0
    for (const t of allTxns) {
      if (t.partnerId !== p.id) continue
      const amt = num(t.amount)
      if (t.type === "CAPITAL_CONTRIBUTION") capital += amt
      else if (t.type === "PARTNER_LOAN") loans += amt
      else if (t.type === "PARTNER_REIMBURSEMENT") reimb += amt
    }
    return { partner: p, capital, loans, reimb, debt: loans - reimb }
  })

  // Accumulated (all-time) partner totals
  const totalCapital = balances.reduce((s, b) => s + b.capital, 0)
  const totalLoans = balances.reduce((s, b) => s + b.loans, 0)
  const totalReimb = balances.reduce((s, b) => s + b.reimb, 0)
  const totalDebt = totalLoans - totalReimb

  const PeriodTabs = (
    <div className="flex flex-wrap gap-1.5">
      {(["month", "year", "all"] as OperatingPeriod[]).map((p) => (
        <Link
          key={p}
          href={`/dashboard/operating?period=${p}`}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            period === p ? "border-accent/60 bg-accent/15 text-accent" : "border-foreground/15 text-foreground/60 hover:bg-foreground/5"
          }`}
        >
          {PERIOD_LABEL[p]}
        </Link>
      ))}
    </div>
  )

  return (
    <section className="mx-auto max-w-6xl text-foreground">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Operating</h1>
          <p className="mt-2 text-sm text-foreground/55">Socios, capital, préstamos, reembolsos y gastos.</p>
        </div>
        <Link
          href="/dashboard/operating/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          Registrar movimiento
        </Link>
      </div>

      {/* Accumulated partner standing (all-time) */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/70">Deuda a socios</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{fmtMoney(totalDebt)}</p>
          <p className="mt-1 text-[11px] text-amber-800/60">Por inversión/préstamos pendientes de reembolsar</p>
        </div>
        <div className="rounded-2xl border border-foreground/15 bg-foreground/3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Capital aportado</p>
          <p className="mt-1 text-2xl font-bold">{fmtMoney(totalCapital)}</p>
          <p className="mt-1 text-[11px] text-foreground/45">Equity de los socios (acumulado)</p>
        </div>
        <div className="rounded-2xl border border-foreground/15 bg-foreground/3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Reembolsado a socios</p>
          <p className="mt-1 text-2xl font-bold">{fmtMoney(totalReimb)}</p>
          <p className="mt-1 text-[11px] text-foreground/45">Pagado de vuelta (acumulado)</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {PeriodTabs}
        <span className="text-xs text-foreground/45">{periodTxns.length} movimientos · {PERIOD_LABEL[period]}</span>
      </div>

      {/* Period summary (no bank-balance implied) */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-rose-500/25 bg-rose-50/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-700/70">Gastos del periodo</p>
          <p className="mt-1 text-2xl font-bold text-rose-700">{fmtMoney(gastosPeriodo)}</p>
          <p className="mt-1 text-[11px] text-rose-700/60">Gastos de empresa + de proyectos</p>
        </div>
        <div className="rounded-2xl border border-foreground/15 bg-foreground/3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Aportado por socios</p>
          <p className="mt-1 text-2xl font-bold">{fmtMoney(aportesPeriodo)}</p>
          <p className="mt-1 text-[11px] text-foreground/45">Capital + préstamos. Puede ser compra directa del socio, no efectivo en banco.</p>
        </div>
      </div>

      {/* By type chips */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {(Object.keys(byType) as OperatingTxnType[]).map((t) => (
          <div key={t} className="rounded-xl border border-foreground/12 bg-background p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">{OPERATING_TYPE_META[t].short}</p>
            <p className="mt-1 text-sm font-bold tabular-nums">{fmtMoney(byType[t])}</p>
          </div>
        ))}
      </div>

      {/* Partner balances + expenses by category */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl font-semibold">Balance por socio</h2>
          <p className="mt-0.5 text-xs text-foreground/45">Acumulado (todo el tiempo)</p>
          {balances.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-foreground/20 px-4 py-6 text-sm text-foreground/45">
              Sin socios todavía. Agrega uno abajo.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {balances.map(({ partner, capital, loans, reimb, debt }) => (
                <div key={partner.id} className="rounded-xl border border-foreground/12 bg-background p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">
                      {partner.name}
                      {partner.ownershipPct != null ? (
                        <span className="ml-2 text-xs font-normal text-foreground/45">{num(partner.ownershipPct)}%</span>
                      ) : null}
                      {!partner.active ? <span className="ml-2 text-[10px] uppercase text-rose-500">inactivo</span> : null}
                    </p>
                    <span className="text-right">
                      <span className={`block text-sm font-bold tabular-nums ${debt > 0 ? "text-amber-700" : "text-foreground/70"}`}>
                        {fmtMoney(debt)}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-foreground/40">se le debe</span>
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/55">
                    <span>Capital: <b className="text-foreground/75">{fmtMoney(capital)}</b></span>
                    <span>Préstamos: <b className="text-foreground/75">{fmtMoney(loans)}</b></span>
                    <span>Reembolsado: <b className="text-foreground/75">{fmtMoney(reimb)}</b></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-xl font-semibold">Gastos por categoría</h2>
          <p className="mt-0.5 text-xs text-foreground/45">{PERIOD_LABEL[period]}</p>
          {categories.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-foreground/20 px-4 py-6 text-sm text-foreground/45">
              Sin gastos en este periodo.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {categories.map(([cat, amt]) => (
                <div key={cat} className="rounded-xl border border-foreground/12 bg-background p-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-foreground/70">{cat}</span>
                    <span className="font-bold tabular-nums">{fmtMoney(amt)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/8">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${maxCat ? (amt / maxCat) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transactions list */}
      <div className="mt-8">
        <h2 className="font-display text-xl font-semibold">Movimientos · {PERIOD_LABEL[period]}</h2>
        {periodTxns.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-foreground/20 px-4 py-10 text-center text-sm text-foreground/45">
            Sin movimientos en este periodo.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-foreground/12">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-foreground/10 bg-foreground/4">
                    {["Fecha", "Tipo", "Detalle", "Recibo", "Monto", ""].map((h, i) => (
                      <th key={i} className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periodTxns.map((t) => {
                    const meta = OPERATING_TYPE_META[t.type as OperatingTxnType]
                    const projectLabel =
                      t.job?.title ??
                      (t.quote ? `Estimado #${t.quote.id.slice(0, 8)} — ${t.quote.customer.firstName} ${t.quote.customer.lastName}` : null)
                    const detail =
                      t.partner?.name ??
                      projectLabel ??
                      ([t.category, t.vendor].filter(Boolean).join(" · ") || "")
                    return (
                      <tr key={t.id} className="border-b border-foreground/8 last:border-b-0">
                        <td className="px-3 py-2.5 align-top whitespace-nowrap text-xs text-foreground/60">{fmtDate(t.occurredAt)}</td>
                        <td className="px-3 py-2.5 align-top">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.accent}`}>
                            {meta.short}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <p className="font-medium">{detail || "—"}</p>
                          {(t.vendor || t.invoiceNumber || t.description) && (
                            <p className="text-[11px] text-foreground/45">
                              {[t.vendor, t.invoiceNumber, t.description].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          {t.receiptUrl ? (
                            <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                              <Receipt className="h-3.5 w-3.5" /> Ver
                            </a>
                          ) : (
                            <span className="text-xs text-foreground/30">—</span>
                          )}
                        </td>
                        <td className={`px-3 py-2.5 align-top text-right font-bold tabular-nums ${meta.direction === "in" ? "text-emerald-700" : "text-rose-700"}`}>
                          {meta.direction === "in" ? "+" : "−"}
                          {fmtMoney(num(t.amount))}
                        </td>
                        <td className="px-3 py-2.5 text-right align-top">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/operating/${t.id}/editar`}
                              className="inline-flex items-center gap-1 rounded-md border border-foreground/15 px-2 py-1 text-xs text-foreground/60 transition hover:bg-foreground/5"
                            >
                              <Pencil className="h-3 w-3" /> Editar
                            </Link>
                            <form action={deleteTransactionAction}>
                              <input type="hidden" name="id" value={t.id} />
                              <button type="submit" className="rounded-md border border-foreground/15 px-2 py-1 text-xs text-rose-600 transition hover:bg-rose-50">
                                ✕
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Partners management */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="font-display text-xl font-semibold">Socios</h2>
          {partners.length === 0 ? (
            <p className="mt-3 text-sm text-foreground/45">Sin socios todavía.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {partners.map((p) => (
                <div key={p.id} className="rounded-xl border border-foreground/12 bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {p.name}
                        {p.ownershipPct != null ? <span className="ml-2 text-xs font-normal text-foreground/45">{num(p.ownershipPct)}%</span> : null}
                        {!p.active ? <span className="ml-2 text-[10px] uppercase text-rose-500">inactivo</span> : null}
                      </p>
                      <p className="mt-0.5 text-xs text-foreground/50">{[p.email, p.phone].filter(Boolean).join(" · ") || "Sin contacto"}</p>
                    </div>
                    <EditDialog label="Editar" action={updatePartnerAction} triggerClassName="rounded-md border border-foreground/15 px-2 py-1 text-xs hover:bg-foreground/5">
                      <input type="hidden" name="id" value={p.id} />
                      <div className="grid gap-3">
                        <label className="grid gap-1"><span className={lbl}>Nombre *</span><input name="name" required defaultValue={p.name} className={ic} /></label>
                        <label className="grid gap-1"><span className={lbl}>Email</span><input name="email" type="email" defaultValue={p.email ?? ""} className={ic} /></label>
                        <label className="grid gap-1"><span className={lbl}>Teléfono</span><input name="phone" defaultValue={p.phone ?? ""} className={ic} /></label>
                        <label className="grid gap-1"><span className={lbl}>% de participación</span><input name="ownershipPct" type="number" min="0" max="100" step="0.01" defaultValue={p.ownershipPct != null ? num(p.ownershipPct).toString() : ""} className={ic} /></label>
                        <label className="grid gap-1"><span className={lbl}>Notas</span><input name="notes" defaultValue={p.notes ?? ""} className={ic} /></label>
                        <label className="flex items-center gap-2 text-sm text-foreground/65"><input type="checkbox" name="active" defaultChecked={p.active} /> Activo</label>
                        <button type="submit" className="rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background">Guardar</button>
                      </div>
                    </EditDialog>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer list-none text-[11px] text-foreground/40 hover:text-rose-600">Eliminar socio</summary>
                    <form action={deletePartnerAction} className="mt-2 flex items-center gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <label className="flex items-center gap-1.5 text-[11px] text-foreground/55">
                        <input type="checkbox" name="confirmDelete" /> Confirmar
                      </label>
                      <button type="submit" className="rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white">Eliminar</button>
                    </form>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>

        <section className="rounded-2xl border border-foreground/12 bg-foreground/2 p-5 h-fit">
          <h3 className="font-display text-lg font-semibold">Nuevo socio</h3>
          <form action={createPartnerAction} className="mt-4 grid gap-3">
            <label className="grid gap-1"><span className={lbl}>Nombre *</span><input name="name" required placeholder="Nombre del socio" className={ic} /></label>
            <label className="grid gap-1"><span className={lbl}>Email</span><input name="email" type="email" placeholder="opcional" className={ic} /></label>
            <label className="grid gap-1"><span className={lbl}>Teléfono</span><input name="phone" placeholder="opcional" className={ic} /></label>
            <label className="grid gap-1"><span className={lbl}>% de participación</span><input name="ownershipPct" type="number" min="0" max="100" step="0.01" placeholder="Ej. 50" className={ic} /></label>
            <label className="grid gap-1"><span className={lbl}>Notas</span><input name="notes" placeholder="opcional" className={ic} /></label>
            <button type="submit" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90">
              Agregar socio
            </button>
          </form>
        </section>
      </div>
    </section>
  )
}

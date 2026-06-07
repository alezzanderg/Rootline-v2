"use client"

import { useState, useTransition } from "react"
import { Banknote, Check, Undo2 } from "lucide-react"

import {
  clearManualPaymentAction,
  recordManualPaymentAction,
} from "@/app/actions/manual-payment"
import { getQuotePaymentMethodAdminLabel, isManualQuotePaymentMethod } from "@/lib/payments/methods"
import { isQuotePaymentComplete } from "@/lib/payments/status"
import { fmtMoney, fmtQuoteDate } from "@/lib/quote-document-format"

type ManualPaymentPanelProps = {
  quoteId: string
  quoteStatus: string
  total: number
  paidAt: string | null
  paymentMethod: string | null
  paymentNote: string | null
  mercuryInvoiceStatus: string | null
  stripePaymentStatus: string | null
}

export function ManualPaymentPanel({
  quoteId,
  quoteStatus,
  total,
  paidAt,
  paymentMethod,
  paymentNote,
  mercuryInvoiceStatus,
  stripePaymentStatus,
}: ManualPaymentPanelProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isPaid = isQuotePaymentComplete({
    paidAt,
    mercuryInvoiceStatus,
    stripePaymentStatus,
  })
  const isManualPaid = isPaid && isManualQuotePaymentMethod(paymentMethod)
  const methodLabel = getQuotePaymentMethodAdminLabel(paymentMethod)

  function submit(method: "CASH" | "CHECK", form: HTMLFormElement) {
    setMessage(null)
    setError(null)
    const formData = new FormData(form)
    formData.set("quoteId", quoteId)
    formData.set("method", method)

    startTransition(async () => {
      const result = await recordManualPaymentAction(formData)
      if (result.ok) {
        setMessage(method === "CASH" ? "Pago en efectivo registrado." : "Pago con cheque registrado.")
      } else {
        setError(result.error)
      }
    })
  }

  function onClear() {
    setMessage(null)
    setError(null)
    const formData = new FormData()
    formData.set("quoteId", quoteId)

    startTransition(async () => {
      const result = await clearManualPaymentAction(formData)
      if (result.ok) {
        setMessage("Registro de pago manual eliminado.")
      } else {
        setError(result.error)
      }
    })
  }

  if (isManualPaid) {
    return (
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/60 p-4">
        <div className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-900">Pagado — {methodLabel}</p>
            <p className="mt-1 text-xs text-emerald-800/80">
              {fmtMoney(total)}
              {paidAt ? ` · ${fmtQuoteDate(new Date(paidAt))}` : ""}
            </p>
            {paymentNote ? (
              <p className="mt-1 text-xs text-emerald-800/70">Nota: {paymentNote}</p>
            ) : null}
            <button
              type="button"
              onClick={onClear}
              disabled={isPending}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-700/20 px-3 py-1.5 text-xs font-medium text-emerald-900/80 transition hover:bg-emerald-100/80 disabled:opacity-50"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Deshacer registro
            </button>
          </div>
        </div>
        {message ? <p className="mt-3 text-xs text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}
      </div>
    )
  }

  if (isPaid) {
    return (
      <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4">
        <p className="text-sm font-semibold text-foreground/80">Efectivo / cheque</p>
        <p className="mt-1 text-xs text-foreground/50">
          Este estimado ya está pagado
          {methodLabel ? ` (${methodLabel})` : ""}. Usa los paneles de Mercury o Stripe para pagos en línea.
        </p>
      </div>
    )
  }

  const canRecord = quoteStatus === "APPROVED"

  return (
    <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4">
      <div className="flex items-start gap-2">
        <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground/80">Efectivo / cheque</p>
          <p className="mt-1 text-xs text-foreground/45">
            Registra el pago cuando el cliente pague en persona o envíe un cheque.
          </p>
        </div>
      </div>

      {!canRecord ? (
        <p className="mt-3 text-xs text-foreground/45">El estimado debe estar aprobado.</p>
      ) : (
        <div className="mt-4 space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit("CASH", event.currentTarget)
            }}
            className="rounded-xl border border-foreground/10 bg-background p-3"
          >
            <p className="text-xs font-semibold text-foreground/75">Efectivo</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                  Nota (opcional)
                </span>
                <input
                  name="note"
                  placeholder="Recibido en sitio, etc."
                  className="rounded-lg border border-foreground/15 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                  Fecha
                </span>
                <input
                  name="paidAt"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="rounded-lg border border-foreground/15 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="mt-3 w-full rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-forest/90 disabled:opacity-50"
            >
              {isPending ? "Guardando…" : "Marcar pagado (efectivo)"}
            </button>
          </form>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit("CHECK", event.currentTarget)
            }}
            className="rounded-xl border border-foreground/10 bg-background p-3"
          >
            <p className="text-xs font-semibold text-foreground/75">Cheque</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                  Nº de cheque / referencia
                </span>
                <input
                  name="note"
                  placeholder="Cheque #1234"
                  className="rounded-lg border border-foreground/15 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                  Fecha recibido
                </span>
                <input
                  name="paidAt"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="rounded-lg border border-foreground/15 px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="mt-3 w-full rounded-xl border border-forest/25 bg-forest/8 px-4 py-2.5 text-sm font-semibold text-forest transition hover:bg-forest/12 disabled:opacity-50"
            >
              {isPending ? "Guardando…" : "Marcar pagado (cheque)"}
            </button>
          </form>
        </div>
      )}

      {message ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          {message}
        </p>
      ) : null}
      {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}
    </div>
  )
}

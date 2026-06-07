"use client"

import { useState, useTransition } from "react"
import { Check, CreditCard, ExternalLink, RefreshCw } from "lucide-react"

import {
  createStripeCheckoutAction,
  syncStripeCheckoutAction,
} from "@/app/actions/stripe-payment"

type StripeCheckoutPanelProps = {
  quoteId: string
  quoteStatus: string
  publicUrl: string | null
  checkoutUrl: string | null
  paymentStatus: string | null
  stripeConfigured: boolean
  stripeModeLabel: string
}

function statusLabel(status: string | null): string {
  switch (status) {
    case "complete":
      return "Pagado"
    case "open":
      return "Pendiente"
    case "expired":
      return "Expirado"
    default:
      return "Sin enlace"
  }
}

export function StripeCheckoutPanel({
  quoteId,
  quoteStatus,
  publicUrl,
  checkoutUrl,
  paymentStatus,
  stripeConfigured,
  stripeModeLabel,
}: StripeCheckoutPanelProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!stripeConfigured) {
    return (
      <div className="rounded-2xl border border-dashed border-foreground/15 bg-foreground/2 p-4">
        <p className="text-sm font-semibold text-foreground/80">Pagos con tarjeta (Stripe)</p>
        <p className="mt-1 text-xs text-foreground/45">
          Configura <code className="text-[11px]">STRIPE_TEST_SECRET_KEY</code> o{" "}
          <code className="text-[11px]">STRIPE_LIVE_SECRET_KEY</code> según el entorno.
        </p>
      </div>
    )
  }

  function onCreate() {
    setMessage(null)
    setError(null)
    const formData = new FormData()
    formData.set("quoteId", quoteId)

    startTransition(async () => {
      const result = await createStripeCheckoutAction(formData)
      if (result.ok) {
        setMessage("Enlace de Stripe generado.")
      } else {
        setError(result.error)
      }
    })
  }

  function onSync() {
    setMessage(null)
    setError(null)
    const formData = new FormData()
    formData.set("quoteId", quoteId)

    startTransition(async () => {
      const result = await syncStripeCheckoutAction(formData)
      if (result.ok) {
        setMessage(`Estado actualizado: ${statusLabel(result.status ?? null)}`)
      } else {
        setError(result.error)
      }
    })
  }

  const canCreate = quoteStatus === "APPROVED" && Boolean(publicUrl)
  const isPaid = paymentStatus === "complete"

  return (
    <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4">
      <div className="flex items-start gap-2">
        <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-terra" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground/80">Pagos con tarjeta (Stripe)</p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                stripeModeLabel === "Live"
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-amber-500/15 text-amber-800"
              }`}
            >
              {stripeModeLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-foreground/45">
            Checkout hospedado por Stripe. Ideal si Mercury AR no está activo en tu cuenta.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-foreground/12 bg-background px-3 py-2">
        <span className="text-xs text-foreground/50">Estado del pago</span>
        <span
          className={`text-xs font-semibold ${
            isPaid ? "text-emerald-600" : paymentStatus ? "text-foreground/75" : "text-foreground/40"
          }`}
        >
          {statusLabel(paymentStatus)}
        </span>
      </div>

      {!publicUrl ? (
        <p className="mt-3 text-xs text-amber-700/90">Genera primero el enlace público del estimado.</p>
      ) : null}

      {checkoutUrl ? (
        <div className="mt-3 space-y-2">
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-terra/35 bg-terra/10 px-3 py-2 text-xs font-semibold text-terra transition hover:bg-terra/15"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir checkout Stripe
          </a>
          <button
            type="button"
            onClick={onSync}
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-foreground/15 px-3 py-2 text-xs font-medium text-foreground/65 transition hover:bg-foreground/5 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            Sincronizar estado
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onCreate}
          disabled={isPending || !canCreate}
          className="mt-3 w-full rounded-xl bg-terra px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-terra/90 disabled:opacity-50"
        >
          {isPending ? "Generando…" : "Generar enlace Stripe"}
        </button>
      )}

      {quoteStatus !== "APPROVED" && !checkoutUrl ? (
        <p className="mt-2 text-xs text-foreground/45">El estimado debe estar aprobado.</p>
      ) : null}

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

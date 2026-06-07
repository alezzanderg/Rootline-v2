"use client"

import { useState, useTransition } from "react"
import { Check, CreditCard, ExternalLink, RefreshCw } from "lucide-react"

import {
  createMercuryInvoiceAction,
  syncMercuryInvoiceAction,
} from "@/app/actions/mercury-payment"

type MercuryInvoicePanelProps = {
  quoteId: string
  quoteStatus: string
  customerEmail: string | null
  payUrl: string | null
  invoiceStatus: string | null
  mercuryConfigured: boolean
  mercuryTokenValid: boolean
}

function statusLabel(status: string | null): string {
  switch (status) {
    case "Paid":
      return "Pagado"
    case "Processing":
      return "Procesando"
    case "Cancelled":
      return "Cancelado"
    case "Unpaid":
      return "Pendiente"
    default:
      return "Sin factura"
  }
}

export function MercuryInvoicePanel({
  quoteId,
  quoteStatus,
  customerEmail,
  payUrl,
  invoiceStatus,
  mercuryConfigured,
  mercuryTokenValid,
}: MercuryInvoicePanelProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!mercuryConfigured) {
    return (
      <div className="rounded-2xl border border-dashed border-foreground/15 bg-foreground/2 p-4">
        <p className="text-sm font-semibold text-foreground/80">Pagos online (Mercury)</p>
        <p className="mt-1 text-xs text-foreground/45">
          Configura <code className="text-[11px]">MERCURY_API_TOKEN</code> y{" "}
          <code className="text-[11px]">MERCURY_DESTINATION_ACCOUNT_ID</code> para generar enlaces de pago con
          tarjeta o ACH.
        </p>
      </div>
    )
  }

  function onCreate(sendEmail: boolean) {
    setMessage(null)
    setError(null)
    const formData = new FormData()
    formData.set("quoteId", quoteId)
    if (sendEmail) formData.set("sendEmail", "on")

    startTransition(async () => {
      const result = await createMercuryInvoiceAction(formData)
      if (result.ok) {
        setMessage(sendEmail ? "Factura creada y enviada por email." : "Enlace de pago generado.")
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
      const result = await syncMercuryInvoiceAction(formData)
      if (result.ok) {
        setMessage(`Estado actualizado: ${statusLabel(result.status ?? null)}`)
      } else {
        setError(result.error)
      }
    })
  }

  const canCreate = quoteStatus === "APPROVED" && Boolean(customerEmail?.trim())
  const isPaid = invoiceStatus === "Paid"

  return (
    <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4">
      <div className="flex items-start gap-2">
        <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground/80">Pagos online (Mercury)</p>
          <p className="mt-1 text-xs text-foreground/45">
            Tarjeta y ACH vía Mercury Accounts Receivable. Requiere suscripción Mercury y Stripe conectado para
            tarjetas.
          </p>
        </div>
      </div>

      {mercuryConfigured && !mercuryTokenValid ? (
        <p className="mt-3 text-xs text-amber-700/90">
          El token debe empezar con <code className="text-[11px]">secret-token:</code>. Revisa{" "}
          <code className="text-[11px]">MERCURY_API_TOKEN</code> en .env y reinicia el servidor.
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between rounded-xl border border-foreground/12 bg-background px-3 py-2">
        <span className="text-xs text-foreground/50">Estado del pago</span>
        <span
          className={`text-xs font-semibold ${
            isPaid ? "text-emerald-600" : invoiceStatus ? "text-foreground/75" : "text-foreground/40"
          }`}
        >
          {statusLabel(invoiceStatus)}
        </span>
      </div>

      {!customerEmail?.trim() ? (
        <p className="mt-3 text-xs text-amber-700/90">
          Añade un email al cliente para poder facturar en Mercury.
        </p>
      ) : null}

      {payUrl ? (
        <div className="mt-3 space-y-2">
          <a
            href={payUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-accent/35 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/15"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir página de pago
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
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => onCreate(false)}
            disabled={isPending || !canCreate}
            className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
          >
            {isPending ? "Generando…" : "Generar enlace de pago"}
          </button>
          <button
            type="button"
            onClick={() => onCreate(true)}
            disabled={isPending || !canCreate}
            className="w-full rounded-xl border border-foreground/15 px-4 py-2.5 text-sm font-medium text-foreground/70 transition hover:bg-foreground/5 disabled:opacity-50"
          >
            Generar y enviar por email
          </button>
          {quoteStatus !== "APPROVED" ? (
            <p className="text-xs text-foreground/45">El estimado debe estar aprobado.</p>
          ) : null}
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

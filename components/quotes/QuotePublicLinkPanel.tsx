"use client"

import { useState, useTransition } from "react"
import { Check, Copy, ExternalLink, Link2, Unlink } from "lucide-react"

import {
  generatePublicQuoteLinkAction,
  revokePublicQuoteLinkAction,
} from "@/app/actions/quote-public"

type QuotePublicLinkPanelProps = {
  quoteId: string
  publicUrl: string | null
}

export function QuotePublicLinkPanel({ quoteId, publicUrl }: QuotePublicLinkPanelProps) {
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function copyLink() {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  function onGenerate() {
    const formData = new FormData()
    formData.set("quoteId", quoteId)
    startTransition(async () => {
      await generatePublicQuoteLinkAction(formData)
    })
  }

  function onRevoke() {
    const formData = new FormData()
    formData.set("quoteId", quoteId)
    startTransition(async () => {
      await revokePublicQuoteLinkAction(formData)
    })
  }

  return (
    <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4">
      <div className="flex items-start gap-2">
        <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground/80">Enlace público</p>
          <p className="mt-1 text-xs text-foreground/45">
            Genera un link para que el cliente vea el estimado sin acceder al panel.
          </p>
        </div>
      </div>

      {publicUrl ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 rounded-xl border border-foreground/15 bg-background px-3 py-2">
            <input
              readOnly
              value={publicUrl}
              className="min-w-0 flex-1 truncate bg-transparent text-xs text-foreground/70 outline-none"
              aria-label="Public estimate link"
            />
            <button
              type="button"
              onClick={copyLink}
              disabled={isPending}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-foreground/15 px-2 py-1 text-xs font-medium text-foreground/70 transition hover:bg-foreground/5 disabled:opacity-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-accent/35 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/15"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir página pública
            </a>
            <button
              type="button"
              onClick={onRevoke}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-foreground/15 px-3 py-2 text-xs font-medium text-foreground/60 transition hover:bg-foreground/5 disabled:opacity-50"
            >
              <Unlink className="h-3.5 w-3.5" />
              Revocar enlace
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onGenerate}
          disabled={isPending}
          className="mt-3 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
        >
          {isPending ? "Generando…" : "Generar enlace público"}
        </button>
      )}
    </div>
  )
}

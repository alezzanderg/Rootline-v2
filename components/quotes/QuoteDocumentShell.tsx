"use client"

import { Download } from "lucide-react"

import {
  buildQuoteDocumentDownloadTitle,
  getQuoteDocumentDownloadLabel,
} from "@/lib/quote-document-format"

type QuoteDocumentShellProps = {
  quoteNumber: string
  customerName: string
  mode: "preview" | "public"
  isAccepted?: boolean
  isPaid?: boolean
  children: React.ReactNode
}

export function QuoteDocumentShell({
  quoteNumber,
  customerName,
  mode,
  isAccepted = false,
  isPaid = false,
  children,
}: QuoteDocumentShellProps) {
  function handleDownload() {
    const previousTitle = document.title
    document.title = buildQuoteDocumentDownloadTitle(quoteNumber, customerName, { isPaid, isAccepted })
    window.print()
    window.setTimeout(() => {
      document.title = previousTitle
    }, 500)
  }

  const label = getQuoteDocumentDownloadLabel(mode, { isPaid, isAccepted })

  return (
    <div className="quote-document-shell">
      <div className="mb-4 flex justify-end print:hidden">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-xl border border-forest/20 bg-white px-4 py-2.5 text-sm font-semibold text-forest shadow-sm transition hover:border-accent/40 hover:bg-accent/5"
        >
          <Download className="h-4 w-4" aria-hidden />
          {label}
        </button>
      </div>
      {children}
    </div>
  )
}

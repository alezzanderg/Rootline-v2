import Link from "next/link"
import { notFound } from "next/navigation"
import { Eye, ExternalLink } from "lucide-react"

import { QuoteDocumentShell } from "@/components/quotes/QuoteDocumentShell"
import { QuoteDocumentView } from "@/components/quotes/QuoteDocumentView"
import { QuotePublicLinkPanel } from "@/components/quotes/QuotePublicLinkPanel"
import { getPublicQuoteUrl, getQuoteDocumentById } from "@/lib/quote-document"
import { isQuotePaymentComplete } from "@/lib/payments/status"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EstimadoPreviewPage({ params }: Props) {
  const { id } = await params
  const quote = await getQuoteDocumentById(id)
  if (!quote) notFound()

  const publicUrl = quote.publicToken ? getPublicQuoteUrl(quote.publicToken) : null
  const isPaid = isQuotePaymentComplete(quote)

  return (
    <section className="quote-document-page mx-auto max-w-6xl text-foreground">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/dashboard/estimados/${id}`} className="text-sm text-foreground/55 hover:text-foreground">
          ← Volver al editor
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/35 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Eye className="h-3.5 w-3.5" />
            Vista previa
          </span>
          {publicUrl ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:bg-foreground/5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver como cliente
            </a>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] print:block">
        {/* Enlace público — sidebar derecha (arriba en móvil) */}
        <aside className="order-1 h-fit lg:order-2 lg:sticky lg:top-6 print:hidden">
          <QuotePublicLinkPanel quoteId={id} publicUrl={publicUrl} />
        </aside>

        {/* Documento */}
        <div className="order-2 min-w-0 lg:order-1">
          <p className="mb-4 text-sm text-foreground/55 print:hidden">
            Así verá el cliente el estimado en la página pública. El contenido es idéntico al enlace compartido.
          </p>
          <QuoteDocumentShell
            quoteNumber={quote.quoteNumber}
            customerName={quote.customerName}
            mode="preview"
            isAccepted={quote.status === "APPROVED"}
            isPaid={isPaid}
          >
            <QuoteDocumentView quote={quote} mode="preview" isPaid={isPaid} />
          </QuoteDocumentShell>
        </div>
      </div>
    </section>
  )
}

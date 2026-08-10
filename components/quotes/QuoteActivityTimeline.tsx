import { Check, FileText, Mail, PenLine, Send, XCircle, CreditCard } from "lucide-react"

export type QuoteTimelineEvent = {
  key: string
  label: string
  at: string | null
  icon: "created" | "sent" | "email" | "approved" | "signed" | "rejected" | "paid"
  tone: "neutral" | "info" | "success" | "danger"
  detail?: string | null
}

const ICON = {
  created: FileText,
  sent: Send,
  email: Mail,
  approved: Check,
  signed: PenLine,
  rejected: XCircle,
  paid: CreditCard,
} as const

const TONE_DOT = {
  neutral: "border-foreground/25 bg-foreground/8 text-foreground/55",
  info: "border-blue-400/40 bg-blue-50 text-blue-600",
  success: "border-emerald-500/40 bg-emerald-50 text-emerald-600",
  danger: "border-rose-400/40 bg-rose-50 text-rose-600",
} as const

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("es-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function QuoteActivityTimeline({
  events,
  signatureData,
  signedAt,
}: {
  events: QuoteTimelineEvent[]
  signatureData: string | null
  signedAt: string | null
}) {
  const visible = events.filter((e) => e.at)
  const sectionTitle = "text-[11px] font-semibold uppercase tracking-wider text-foreground/40"

  return (
    <div className="rounded-2xl border border-foreground/12 bg-card p-4">
      <p className={sectionTitle}>Actividad</p>

      {visible.length === 0 ? (
        <p className="mt-2 text-xs text-foreground/45">
          Aún sin actividad. Envía el estimado al cliente para empezar.
        </p>
      ) : (
        <ol className="mt-3 space-y-0">
          {visible.map((event, i) => {
            const Icon = ICON[event.icon]
            const isLast = i === visible.length - 1
            return (
              <li key={event.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${TONE_DOT[event.tone]}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {!isLast ? <span className="my-0.5 w-px flex-1 bg-foreground/12" /> : null}
                </div>
                <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-4"}`}>
                  <p className="text-sm font-medium text-foreground/80">{event.label}</p>
                  {event.at ? (
                    <p className="text-[11px] tabular-nums text-foreground/45">{formatWhen(event.at)}</p>
                  ) : null}
                  {event.detail ? (
                    <p className="mt-0.5 truncate text-[11px] text-foreground/50">{event.detail}</p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {signatureData ? (
        <div className="mt-4 border-t border-foreground/10 pt-3">
          <p className={sectionTitle}>Firma del cliente</p>
          <div className="mt-2 rounded-xl border border-foreground/12 bg-white p-2">
            {/* Signature is a data: URL captured on the public page */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureData}
              alt="Firma del cliente"
              className="mx-auto h-auto max-h-24 w-auto"
            />
          </div>
          {signedAt ? (
            <p className="mt-1.5 text-center text-[11px] text-foreground/45">
              Firmado el {formatWhen(signedAt)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

import Link from "next/link"
import { Check, X } from "lucide-react"

import { SubmitButton } from "@/components/ui/SubmitButton"

/**
 * The estimate's journey, with the next action inside it.
 *
 * An estimate is not a form, it is a document in motion. Before this rail the
 * page stated the status three separate times (header chip, a four-button
 * card, the activity log) and still never answered "what do I do next" — you
 * had to reassemble that from four places.
 *
 * The sequence is real, not decorative: createdAt, sentAt, approvedAt or
 * rejectedAt, paidAt and the linked job all exist on the record with their own
 * timestamps. Each node reads one of them.
 *
 * Sits on the dark masthead, so every color here is chosen against forest, not
 * against the cream content area.
 */

export type RailStep = {
  key: string
  label: string
  /** ISO date, or null when it has not happened. */
  at: string | null
  /** Shown under the label when there is no date yet. */
  pending?: string
  state: "done" | "current" | "future" | "failed"
}

function fmt(iso: string): string {
  return new Intl.DateTimeFormat("es-US", { day: "numeric", month: "short" }).format(new Date(iso))
}

function Node({ step }: { step: RailStep }) {
  const dot =
    step.state === "failed"
      ? "border-[#e08a70] bg-[#e08a70] text-[#1e2d23]"
      : step.state === "done"
        ? "border-[#8faa6f] bg-[#8faa6f] text-[#1e2d23]"
        : step.state === "current"
          ? "border-[#e8845f] bg-[#1e2d23] text-[#e8845f] ring-4 ring-[#e8845f]/20"
          : "border-[#e7e2d6]/25 bg-transparent text-transparent"

  return (
    <div
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${dot}`}
      aria-hidden
    >
      {step.state === "failed" ? (
        <X className="h-3 w-3" strokeWidth={3} />
      ) : step.state === "done" ? (
        <Check className="h-3 w-3" strokeWidth={3} />
      ) : step.state === "current" ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      ) : null}
    </div>
  )
}

function Caption({ step }: { step: RailStep }) {
  const tone =
    step.state === "future"
      ? "text-[#e7e2d6]/35"
      : step.state === "current"
        ? "text-[#e7e2d6]"
        : "text-[#e7e2d6]/70"

  return (
    <div className="min-w-0">
      <p className={`text-[11px] font-semibold uppercase tracking-wider ${tone}`}>{step.label}</p>
      <p className="mt-0.5 text-[11px] tabular-nums text-[#e7e2d6]/45">
        {step.at ? fmt(step.at) : (step.pending ?? "—")}
      </p>
    </div>
  )
}

export function QuoteStateRail({
  steps,
  action,
}: {
  steps: RailStep[]
  /** The one thing to do next. Omitted when the estimate is settled. */
  action?: {
    label: string
    hint?: string
  } & ({ href: string } | { formAction: (formData: FormData) => Promise<void>; fields?: Record<string, string> })
}) {
  return (
    <div className="mt-6">
      {/* Mobile: a vertical list, because five captions do not fit across a
          phone without truncating the dates that make the rail worth having. */}
      <ol className="space-y-3 sm:hidden">
        {steps.map((step, i) => (
          <li key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center self-stretch">
              <Node step={step} />
              {i < steps.length - 1 ? (
                <span
                  className={`mt-1 w-0.5 flex-1 rounded-full ${
                    steps[i + 1].state === "future" ? "bg-[#e7e2d6]/15" : "bg-[#8faa6f]/50"
                  }`}
                />
              ) : null}
            </div>
            <Caption step={step} />
          </li>
        ))}
      </ol>

      {/* sm+: the horizontal rail. Capped, because stretched across a 1440px
          masthead the connectors grow longer than the nodes and the sequence
          stops reading as one object. */}
      <ol className="hidden max-w-3xl sm:flex sm:items-start">
        {steps.map((step, i) => (
          <li key={step.key} className={`flex min-w-0 items-start ${i === steps.length - 1 ? "" : "flex-1"}`}>
            <div className="flex min-w-0 flex-col gap-2">
              <Node step={step} />
              <Caption step={step} />
            </div>
            {i < steps.length - 1 ? (
              <span
                className={`mt-2.5 h-0.5 min-w-6 flex-1 rounded-full ${
                  steps[i + 1].state === "future" ? "bg-[#e7e2d6]/15" : "bg-[#8faa6f]/50"
                }`}
                aria-hidden
              />
            ) : null}
          </li>
        ))}
      </ol>

      {action ? (
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e7e2d6]/12 pt-4">
          {"href" in action ? (
            <Link
              href={action.href}
              className="inline-flex items-center rounded-xl bg-[#e8845f] px-4 py-2.5 text-sm font-semibold text-[#1e2d23] transition hover:bg-[#f0906b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8845f]"
            >
              {action.label}
            </Link>
          ) : (
            <form action={action.formAction}>
              {Object.entries(action.fields ?? {}).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))}
              <SubmitButton
                pendingLabel="Guardando…"
                className="inline-flex items-center rounded-xl bg-[#e8845f] px-4 py-2.5 text-sm font-semibold text-[#1e2d23] transition hover:bg-[#f0906b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8845f]"
              >
                {action.label}
              </SubmitButton>
            </form>
          )}
          {action.hint ? (
            <p className="max-w-sm text-xs leading-snug text-[#e7e2d6]/50">{action.hint}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

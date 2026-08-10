import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { actionErrorMessage, actionNoticeMessage } from "@/lib/admin-action"

/**
 * Renders the outcome of a server action.
 *
 * Server actions in this app run as plain `<form action={...}>` submissions from
 * Server Components, so they cannot return a value to the page. They report
 * failures by redirecting back with `?error=<code>` (and successes worth
 * confirming with `?ok=<code>`). Before this existed every rejected action ended
 * in a bare `return`: the user clicked, nothing happened, and there was no way
 * to tell a failure from a slow network.
 *
 * Drop it directly under the page header and pass the parsed search params.
 */
export function ActionBanner({
  error,
  notice,
  className = "",
}: {
  error?: string | string[] | null
  notice?: string | string[] | null
  className?: string
}) {
  const errorCode = Array.isArray(error) ? error[0] : error
  const noticeCode = Array.isArray(notice) ? notice[0] : notice

  const errorText = actionErrorMessage(errorCode)
  const noticeText = actionNoticeMessage(noticeCode)

  if (!errorText && !noticeText) return null

  return (
    <div className={`mt-4 space-y-2 ${className}`} aria-live="polite">
      {errorText ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-400/40 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-800"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {errorText}
        </p>
      ) : null}
      {noticeText ? (
        <p className="flex items-start gap-2 rounded-xl border border-emerald-500/35 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {noticeText}
        </p>
      ) : null}
    </div>
  )
}

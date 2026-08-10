"use client"

import { useFormStatus } from "react-dom"

/**
 * Submit button that disables itself while its form is in flight.
 *
 * Half of the double-submit problem. The other half lives in the database:
 * `job-lifecycle` guards every transition with a conditional `updateMany` and
 * `convertQuoteToJob` returns the existing job instead of creating a second one.
 * This component fixes what the user *feels* (a button that looks dead on a slow
 * connection, so they click again); the DB guards fix what is actually *true*
 * when two people act at the same time. Neither substitutes for the other.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className = "",
  disabled = false,
  ...rest
}: React.ComponentProps<"button"> & { pendingLabel?: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      {...rest}
      disabled={pending || disabled}
      aria-busy={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  )
}

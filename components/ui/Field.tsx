/**
 * Shared form primitives.
 *
 * These replace eight hand-copied `ic` / `lbl` class strings that had drifted
 * into two different controls: `rounded-xl px-3 py-2.5` in estimados, scheduling
 * and the estimate detail, versus `rounded-md px-3 py-2` in clientes, empleados
 * and the customer detail. Same input, two radii and two heights, depending on
 * which page you happened to be on.
 *
 * `inputClass` and `labelClass` are exported so pages that build inputs inline
 * (selects with dynamic options, third-party inputs like PhoneInput) stay on the
 * same scale without being forced through the component.
 */

export const inputClass =
  "w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"

export const labelClass =
  "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

export const selectClass = inputClass

export function FieldLabel({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return <span className={`${labelClass} ${className}`}>{children}</span>
}

/** Labelled input. Use `children` instead of `name` to wrap a custom control. */
export function Field({
  label,
  hint,
  className = "",
  children,
  ...inputProps
}: React.ComponentProps<"input"> & {
  label: string
  hint?: string
  children?: React.ReactNode
}) {
  return (
    <label className={`grid gap-1 ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      {children ?? <input {...inputProps} className={inputClass} />}
      {hint ? <span className="text-[11px] text-foreground/45">{hint}</span> : null}
    </label>
  )
}

export function TextareaField({
  label,
  hint,
  className = "",
  rows = 4,
  ...props
}: React.ComponentProps<"textarea"> & { label: string; hint?: string }) {
  return (
    <label className={`grid gap-1 ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <textarea {...props} rows={rows} className={`${inputClass} resize-none`} />
      {hint ? <span className="text-[11px] text-foreground/45">{hint}</span> : null}
    </label>
  )
}

export function SelectField({
  label,
  hint,
  className = "",
  children,
  ...props
}: React.ComponentProps<"select"> & { label: string; hint?: string }) {
  return (
    <label className={`grid gap-1 ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <select {...props} className={selectClass}>
        {children}
      </select>
      {hint ? <span className="text-[11px] text-foreground/45">{hint}</span> : null}
    </label>
  )
}

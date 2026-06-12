"use client"

import { useState } from "react"

/** Format a raw string into a money display: thousands separators + up to 2 decimals. */
export function formatMoneyInput(raw: string): string {
  let s = raw.replace(/[^0-9.]/g, "")
  const dot = s.indexOf(".")
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "")
  if (s === "") return ""
  const [intPart, decPart] = s.split(".")
  const intDigits = intPart.replace(/\D/g, "")
  const intFmt = intDigits ? Number(intDigits).toLocaleString("en-US") : ""
  if (decPart === undefined) return intFmt
  return `${intFmt === "" ? "0" : intFmt}.${decPart.slice(0, 2)}`
}

export function MoneyInput({
  name,
  defaultValue = "",
  required,
  placeholder = "0.00",
  className,
}: {
  name: string
  defaultValue?: string
  required?: boolean
  placeholder?: string
  className?: string
}) {
  const [value, setValue] = useState(() => formatMoneyInput(defaultValue))

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-foreground/40">
        $
      </span>
      <input
        name={name}
        value={value}
        onChange={(e) => setValue(formatMoneyInput(e.target.value))}
        required={required}
        placeholder={placeholder}
        inputMode="decimal"
        autoComplete="off"
        className={`${className ?? ""} pl-7! text-right tabular-nums`}
      />
    </div>
  )
}

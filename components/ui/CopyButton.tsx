"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"

/**
 * Copies a value and says so. Used for anything the admin reads out loud or
 * pastes elsewhere — the estimate reference while on the phone with a customer,
 * the public link when sending it by hand.
 *
 * The confirmation replaces the label rather than appearing next to it, so the
 * control never changes width and the row does not reflow mid-click.
 */
export function CopyButton({
  value,
  label = "Copiar",
  copiedLabel = "Copiado",
  className = "",
  iconOnly = false,
  title,
}: {
  value: string
  label?: string
  copiedLabel?: string
  className?: string
  iconOnly?: boolean
  title?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard is blocked (insecure origin, denied permission). Selecting the
      // text by hand still works, so fail quietly rather than alarm the user.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={title ?? label}
      aria-label={iconOnly ? (title ?? label) : undefined}
      className={className}
    >
      {copied ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
      {iconOnly ? null : <span>{copied ? copiedLabel : label}</span>}
    </button>
  )
}

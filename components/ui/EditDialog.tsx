"use client"

import { useRef, useTransition } from "react"

export function EditDialog({
  label,
  action,
  children,
  variant = "light",
  triggerClassName,
}: {
  label: string
  action: (formData: FormData) => Promise<void>
  children: React.ReactNode
  variant?: "light" | "dark"
  triggerClassName?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await action(formData)
      ref.current?.close()
    })
  }

  const triggerCls =
    triggerClassName ??
    (variant === "dark"
      ? "w-full rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-cream/55 transition hover:bg-white/8 hover:text-cream/90"
      : "w-full rounded-lg border border-foreground/12 px-3 py-2 text-sm font-medium text-foreground/50 transition hover:bg-foreground/5 hover:text-foreground/80")

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={triggerCls}>
        {label}
      </button>
      <dialog
        ref={ref}
        aria-modal="true"
        aria-label={label}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close()
        }}
        className="m-auto w-full max-w-lg rounded-2xl border border-foreground/12 bg-[#fdfcf8] p-0 shadow-2xl outline-none backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-4">
          <p className="font-display text-base font-semibold text-foreground">
            {label}
          </p>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-sm text-foreground/40 transition hover:bg-foreground/8 hover:text-foreground/70"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit}>
            {children}
            {isPending && (
              <p className="mt-3 text-xs text-foreground/40">Guardando…</p>
            )}
          </form>
        </div>
      </dialog>
    </>
  )
}

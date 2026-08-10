"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

type CustomerActionsMenuProps = {
  customerId: string
  isActive: boolean
  isArchived: boolean
  toggleCustomerActiveAction: (formData: FormData) => Promise<void>
  archiveCustomerAction: (formData: FormData) => Promise<void>
  restoreCustomerAction: (formData: FormData) => Promise<void>
}

export function CustomerActionsMenu({
  customerId,
  isActive,
  isArchived,
  toggleCustomerActiveAction,
  archiveCustomerAction,
  restoreCustomerAction,
}: CustomerActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const menuWidth = 208
    const padding = 8
    const left = Math.min(Math.max(padding, r.right - menuWidth), window.innerWidth - menuWidth - padding)
    setCoords({ top: r.bottom + 4, left })
  }, [])

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node
      if (buttonRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }

    function onScroll() {
      updatePosition()
    }

    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", updatePosition)

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [open, updatePosition])

  function handleToggle() {
    if (!open) {
      updatePosition()
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const menu =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-200 w-52 rounded-lg border border-foreground/12 bg-admin-popover p-1.5 shadow-xl"
        style={{ top: coords.top, left: coords.left }}
      >
        <form action={toggleCustomerActiveAction}>
          <input type="hidden" name="id" value={customerId} />
          <input type="hidden" name="nextActive" value={isActive ? "false" : "true"} />
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-foreground/5"
          >
            {isActive ? "Desactivar" : "Activar"}
          </button>
        </form>
        <div className="my-1 h-px bg-foreground/8" />
        {isArchived ? (
          <form action={restoreCustomerAction}>
            <input type="hidden" name="id" value={customerId} />
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm text-emerald-700 transition hover:bg-emerald-50"
            >
              Restaurar cliente
            </button>
          </form>
        ) : (
          // Archive, never delete: customer.delete cascades through Property ->
          // Job and Quote -> QuoteItem, which would destroy paid estimates.
          <form action={archiveCustomerAction}>
            <input type="hidden" name="id" value={customerId} />
            <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs text-foreground/50 hover:bg-foreground/5">
              <input type="checkbox" name="confirmDelete" />
              Confirmar archivado
            </label>
            <button
              type="submit"
              className="mt-0.5 w-full rounded-md px-3 py-2 text-left text-sm text-amber-700 transition hover:bg-amber-50"
            >
              Archivar cliente
            </button>
            <p className="px-3 pt-1 pb-1.5 text-[10px] leading-snug text-foreground/40">
              Se oculta del listado. Estimados y trabajos se conservan.
            </p>
          </form>
        )}
      </div>,
      document.body
    )

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handleToggle()
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className="cursor-pointer rounded-md border border-foreground/15 px-2 py-1 text-sm transition hover:bg-foreground/8"
      >
        ···
      </button>
      {menu}
    </>
  )
}

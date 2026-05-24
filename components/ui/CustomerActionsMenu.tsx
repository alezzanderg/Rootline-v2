"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

type CustomerActionsMenuProps = {
  customerId: string
  isActive: boolean
  toggleCustomerActiveAction: (formData: FormData) => Promise<void>
  deleteCustomerAction: (formData: FormData) => Promise<void>
}

export function CustomerActionsMenu({
  customerId,
  isActive,
  toggleCustomerActiveAction,
  deleteCustomerAction,
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
        className="fixed z-200 w-52 rounded-lg border border-foreground/12 bg-[#fdfcf8] p-1.5 shadow-xl"
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
        <form action={deleteCustomerAction}>
          <input type="hidden" name="id" value={customerId} />
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs text-foreground/50 hover:bg-foreground/5">
            <input type="checkbox" name="confirmDelete" />
            Confirmar eliminación
          </label>
          <button
            type="submit"
            className="mt-0.5 w-full rounded-md px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
          >
            Eliminar cliente
          </button>
        </form>
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

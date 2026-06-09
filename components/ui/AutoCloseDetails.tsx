"use client"

import { useEffect } from "react"

/**
 * Closes any open <details data-autoclose> when the user clicks outside of it
 * or presses Escape. Mount once per page. Only affects elements explicitly
 * marked with the `data-autoclose` attribute (popover-style menus/tooltips),
 * never plain <details> sections or dialogs.
 */
export function AutoCloseDetails() {
  useEffect(() => {
    function closeOutside(target: Node | null) {
      document
        .querySelectorAll<HTMLDetailsElement>("details[data-autoclose][open]")
        .forEach((d) => {
          if (!target || !d.contains(target)) d.removeAttribute("open")
        })
    }

    function onPointerDown(e: PointerEvent) {
      closeOutside(e.target as Node)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeOutside(null)
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  return null
}

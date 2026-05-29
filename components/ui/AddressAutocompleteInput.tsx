"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

import { isCompleteNJAddress } from "@/lib/address-format"

type Locale = "en" | "es"

const ui = {
  en: {
    placeholder: "Street address in New Jersey…",
    hint: "We serve New Jersey only. Select your full address from the list.",
    invalid: "Choose a complete New Jersey address from the suggestions.",
    searching: "Searching NJ addresses…",
    noResults: "No NJ matches. Add city or ZIP (e.g. 07087).",
    osm: "Address search by OpenStreetMap",
  },
  es: {
    placeholder: "Dirección en New Jersey…",
    hint: "Solo atendemos New Jersey. Selecciona tu dirección completa de la lista.",
    invalid: "Elige una dirección completa de New Jersey en las sugerencias.",
    searching: "Buscando direcciones en NJ…",
    noResults: "Sin resultados en NJ. Agrega ciudad o ZIP (ej. 07087).",
    osm: "Búsqueda de direcciones con OpenStreetMap",
  },
} as const

type Suggestion = { label: string }

type AddressAutocompleteInputProps = {
  name?: string
  required?: boolean
  className?: string
  locale?: Locale
  onValidityChange?: (valid: boolean) => void
}

export function AddressAutocompleteInput({
  name = "address",
  required,
  className,
  locale = "en",
  onValidityChange,
}: AddressAutocompleteInputProps) {
  const t = ui[locale]
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [value, setValue] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [touched, setTouched] = useState(false)

  const valid = isCompleteNJAddress(value)

  useEffect(() => {
    onValidityChange?.(valid)
  }, [valid, onValidityChange])

  const fetchSuggestions = useCallback(
    async (query: string) => {
      abortRef.current?.abort()
      if (query.trim().length < 3) {
        setSuggestions([])
        setLoading(false)
        return
      }
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      try {
        const params = new URLSearchParams({ q: query, lang: locale })
        const res = await fetch(`/api/address-search?${params}`, { signal: controller.signal })
        const data = (await res.json()) as { suggestions?: Suggestion[] }
        if (!controller.signal.aborted) {
          setSuggestions(data.suggestions ?? [])
          setOpen(true)
          setActiveIndex(-1)
        }
      } catch {
        if (!controller.signal.aborted) setSuggestions([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    },
    [locale],
  )

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  function onChange(next: string) {
    setValue(next)
    setTouched(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void fetchSuggestions(next), 320)
  }

  function pick(label: string) {
    setValue(label)
    setOpen(false)
    setSuggestions([])
    setActiveIndex(-1)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault()
      pick(suggestions[activeIndex]!.label)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const showInvalid = touched && value.length > 0 && !valid

  return (
    <div ref={rootRef} className="relative grid gap-1">
      <input
        type="text"
        name={name}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true)
        }}
        onBlur={() => setTouched(true)}
        onKeyDown={onKeyDown}
        placeholder={t.placeholder}
        className={className}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open && suggestions.length > 0}
        aria-invalid={showInvalid}
      />

      {open && (loading || suggestions.length > 0 || (touched && value.length >= 3)) ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-foreground/15 bg-white py-1 shadow-lg"
        >
          {loading ? (
            <li className="flex items-center gap-2 px-3 py-2 text-xs text-foreground/50">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t.searching}
            </li>
          ) : suggestions.length === 0 ? (
            <li className="px-3 py-2 text-xs text-foreground/50">{t.noResults}</li>
          ) : (
            suggestions.map((s, i) => (
              <li key={s.label} role="option" aria-selected={i === activeIndex}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm transition hover:bg-foreground/5 ${
                    i === activeIndex ? "bg-accent/10 text-foreground" : "text-foreground/85"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(s.label)}
                >
                  {s.label}
                </button>
              </li>
            ))
          )}
          <li className="border-t border-foreground/8 px-3 py-1.5 text-[10px] text-foreground/40">
            {t.osm}
          </li>
        </ul>
      ) : null}

      <p className={`text-[11px] leading-snug ${showInvalid ? "text-rose-600" : "text-foreground/45"}`}>
        {showInvalid ? t.invalid : t.hint}
      </p>
    </div>
  )
}

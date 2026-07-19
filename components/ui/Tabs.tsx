"use client"

import { useId } from "react"

export function TabsGroup({
  tabs,
  activeIndex,
  onChange,
  children,
}: {
  tabs: Array<{ label: string; badge?: number | null }>
  activeIndex: number
  onChange: (index: number) => void
  children: React.ReactNode
}) {
  const baseId = useId()

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Secciones"
        className="flex flex-wrap gap-1 rounded-2xl border border-foreground/12 bg-foreground/3 p-1.5"
      >
        {tabs.map((tab, idx) => {
          const active = idx === activeIndex
          return (
            <button
              key={idx}
              role="tab"
              id={`${baseId}-tab-${idx}`}
              aria-selected={active}
              aria-controls={`${baseId}-panel-${idx}`}
              onClick={() => onChange(idx)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground/55 hover:bg-background/50 hover:text-foreground/80"
              }`}
            >
              {tab.label}
              {tab.badge != null ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    active
                      ? "bg-accent/12 text-accent"
                      : "bg-foreground/10 text-foreground/55"
                  }`}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {tabs.map((_, idx) => (
        <div
          key={idx}
          role="tabpanel"
          id={`${baseId}-panel-${idx}`}
          aria-labelledby={`${baseId}-tab-${idx}`}
          hidden={idx !== activeIndex}
          className={idx === activeIndex ? "block" : "hidden"}
        >
          {idx === activeIndex ? children : null}
        </div>
      ))}
    </div>
  )
}

export function TabPanel({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>
}

"use client"

import { useEffect, useMemo, useState, useTransition } from "react"

type TimelineJob = {
  id: string
  title: string
  status: string
  scheduledAt: string
  customerName: string
  propertyAddress: string
  yardFront: boolean
  yardBack: boolean
  yardSides: boolean
  jobDifficulty: string | null
  estimatedDurationMin: number | null
  items: Array<{ id: string; serviceId: string; serviceName: string; quantity: number }>
}

type AddOnService = { id: string; name: string; defaultPrice: string | null }

const DIFFICULTY_LABEL: Record<string, string> = { EASY: "Fácil", MEDIUM: "Medio", HARD: "Difícil" }
const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: "border-emerald-500/35 bg-emerald-50 text-emerald-700",
  MEDIUM: "border-amber-400/40 bg-amber-50 text-amber-800",
  HARD: "border-rose-400/40 bg-rose-50 text-rose-600",
}
const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Programado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
}
const STATUS_CHIP: Record<string, string> = {
  SCHEDULED: "border-blue-800 bg-blue-700 text-white",
  IN_PROGRESS: "border-amber-700 bg-amber-600 text-white",
  COMPLETED: "border-emerald-800 bg-emerald-700 text-white",
  CANCELLED: "border-rose-800 bg-rose-700 text-white",
}
const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: "border-blue-400/40 bg-blue-50 text-blue-700",
  IN_PROGRESS: "border-amber-400/40 bg-amber-50 text-amber-800",
  COMPLETED: "border-emerald-500/35 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-rose-400/40 bg-rose-50 text-rose-600",
}

const STATUS_OPTIONS = ["ALL", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const
const START_HOUR = 6
const END_HOUR = 20
const HOUR_HEIGHT = 64
const JOB_BLOCK_HEIGHT = HOUR_HEIGHT - 8

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── Job detail panel (shared between mobile + desktop) ─────────────────────
function JobDetailPanel({
  job,
  addOnServices,
  addJobItemAction,
  removeJobItemAction,
  onClose,
}: {
  job: TimelineJob & { when: Date }
  addOnServices: AddOnService[]
  addJobItemAction: (fd: FormData) => Promise<void>
  removeJobItemAction: (fd: FormData) => Promise<void>
  onClose?: () => void
}) {
  const [showAddOn, setShowAddOn] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-3 text-sm">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mb-1 flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground"
        >
          ← Volver
        </button>
      )}

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Trabajo</p>
        <p className="mt-0.5 font-semibold">{job.title}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Cliente</p>
        <p className="mt-0.5 font-medium">{job.customerName}</p>
        {job.propertyAddress && <p className="text-xs text-foreground/55">{job.propertyAddress}</p>}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Fecha</p>
        <p className="mt-0.5 font-medium">
          {job.when.toLocaleString("es-US", {
            weekday: "short", month: "short", day: "numeric",
            hour: "numeric", minute: "2-digit",
          })}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Estado</p>
        <span className={`mt-0.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[job.status] ?? ""}`}>
          {STATUS_LABEL[job.status] ?? job.status}
        </span>
      </div>

      {(job.yardFront || job.yardBack || job.yardSides) && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Áreas</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {job.yardFront && <span className="rounded border border-foreground/20 bg-foreground/5 px-1.5 py-0.5 text-[10px] font-semibold">Frente</span>}
            {job.yardBack && <span className="rounded border border-foreground/20 bg-foreground/5 px-1.5 py-0.5 text-[10px] font-semibold">Patio</span>}
            {job.yardSides && <span className="rounded border border-foreground/20 bg-foreground/5 px-1.5 py-0.5 text-[10px] font-semibold">Laterales</span>}
          </div>
        </div>
      )}

      {job.jobDifficulty && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Dificultad</p>
          <span className={`mt-0.5 inline-flex rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${DIFFICULTY_STYLE[job.jobDifficulty] ?? ""}`}>
            {DIFFICULTY_LABEL[job.jobDifficulty]}
          </span>
        </div>
      )}

      {job.estimatedDurationMin && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Duración estimada</p>
          <p className="mt-0.5 font-medium">~{job.estimatedDurationMin} min</p>
        </div>
      )}

      {!job.id.startsWith("draft-") && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Add-ons</p>
            <button
              type="button"
              onClick={() => setShowAddOn((v) => !v)}
              className="text-xs font-semibold text-accent hover:underline"
            >
              {showAddOn ? "Cancelar" : "+ Agregar"}
            </button>
          </div>

          {job.items.length === 0 && !showAddOn && (
            <p className="mt-1 text-xs text-foreground/45">Ninguno agregado.</p>
          )}

          <div className="mt-1 space-y-1">
            {job.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-foreground/10 bg-foreground/5 px-2.5 py-1.5">
                <p className="text-xs">
                  {item.serviceName}
                  {item.quantity > 1 && <span className="ml-1 text-foreground/50">×{item.quantity}</span>}
                </p>
                <form action={removeJobItemAction}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <button type="submit" className="text-xs text-rose-500 hover:text-rose-400" aria-label="Quitar">✕</button>
                </form>
              </div>
            ))}
          </div>

          {showAddOn && (
            <form
              action={addJobItemAction}
              onSubmit={() => { setShowAddOn(false) }}
              className="mt-2 space-y-2"
            >
              <input type="hidden" name="jobId" value={job.id} />
              <select
                name="serviceId"
                required
                className="w-full rounded-xl border border-foreground/20 bg-background px-3 py-2 text-xs outline-none focus:border-accent"
              >
                <option value="">Seleccionar add-on</option>
                {addOnServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.defaultPrice ? ` — $${s.defaultPrice}` : ""}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="quantity"
                  defaultValue={1}
                  min={1}
                  step={1}
                  className="w-16 rounded-xl border border-foreground/20 bg-background px-2.5 py-1.5 text-xs outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-50 hover:bg-accent/90"
                >
                  Agregar
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export function SchedulingTimeline({
  jobs,
  addOnServices,
  addJobItemAction,
  removeJobItemAction,
}: {
  jobs: TimelineJob[]
  addOnServices: AddOnService[]
  addJobItemAction: (formData: FormData) => Promise<void>
  removeJobItemAction: (formData: FormData) => Promise<void>
}) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("ALL")
  const [search, setSearch] = useState("")
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [localJobs, setLocalJobs] = useState<TimelineJob[]>(jobs)
  const [draft, setDraft] = useState<{ dayISO: string; hour: number; title: string; customerName: string } | null>(null)

  useEffect(() => {
    setLocalJobs((prev) => {
      const drafts = prev.filter((j) => j.id.startsWith("draft-"))
      return [...jobs, ...drafts]
    })
  }, [jobs])

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date())
    base.setDate(base.getDate() + weekOffset * 7)
    return base
  }, [weekOffset])

  const days = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d }),
    [weekStart],
  )

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    return d
  }, [weekStart])

  const visibleJobs = useMemo(
    () =>
      localJobs
        .map((j) => ({ ...j, when: new Date(j.scheduledAt) }))
        .filter((j) => j.when >= weekStart && j.when < weekEnd)
        .filter((j) => (statusFilter === "ALL" ? true : j.status === statusFilter))
        .filter((j) => {
          if (!search.trim()) return true
          const q = search.toLowerCase()
          return j.title.toLowerCase().includes(q) || j.customerName.toLowerCase().includes(q)
        }),
    [localJobs, weekStart, weekEnd, statusFilter, search],
  )

  const selectedJob = visibleJobs.find((j) => j.id === selectedJobId) ?? null
  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT

  // Group visible jobs by day label for mobile list
  const jobsByDay = useMemo(() => {
    const map = new Map<string, (TimelineJob & { when: Date })[]>()
    for (const day of days) {
      const key = day.toISOString()
      map.set(key, [])
    }
    for (const job of visibleJobs) {
      const key = days.find((d) => {
        const next = new Date(d); next.setDate(d.getDate() + 1)
        return job.when >= d && job.when < next
      })?.toISOString()
      if (key) map.get(key)?.push(job)
    }
    return map
  }, [visibleJobs, days])

  function createDraftVisit() {
    if (!draft || !draft.title.trim() || !draft.customerName.trim()) return
    const dt = new Date(draft.dayISO)
    dt.setHours(draft.hour, 0, 0, 0)
    const newJob: TimelineJob = {
      id: `draft-${Date.now()}`,
      title: draft.title.trim(),
      customerName: draft.customerName.trim(),
      propertyAddress: "",
      yardFront: false, yardBack: false, yardSides: false,
      jobDifficulty: null, estimatedDurationMin: null,
      status: "SCHEDULED",
      scheduledAt: dt.toISOString(),
      items: [],
    }
    setLocalJobs((prev) => [...prev, newJob])
    setSelectedJobId(newJob.id)
    setDraft(null)
  }

  const weekLabel = `${weekStart.toLocaleDateString("es-US", { month: "short", day: "numeric" })} – ${new Date(weekEnd.getTime() - 1).toLocaleDateString("es-US", { month: "short", day: "numeric" })}`

  return (
    <section className="mt-6 rounded-2xl border border-foreground/12 bg-background p-4 sm:p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Timeline semanal</h2>
          <p className="text-sm text-foreground/55">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setWeekOffset((v) => v - 1)}
            className="rounded-xl border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5">
            ‹ Ant.
          </button>
          <button type="button" onClick={() => setWeekOffset(0)}
            className="rounded-xl border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5">
            Hoy
          </button>
          <button type="button" onClick={() => setWeekOffset((v) => v + 1)}
            className="rounded-xl border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5">
            Sig. ›
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button key={opt} type="button" onClick={() => setStatusFilter(opt)}
            className={`rounded-xl border px-2.5 py-1 text-xs font-semibold transition ${
              statusFilter === opt
                ? "border-accent/60 bg-accent/20 text-accent"
                : "border-foreground/20 text-foreground/70 hover:bg-foreground/5"
            }`}
          >
            {opt === "ALL" ? "Todos" : (STATUS_LABEL[opt] ?? opt)}
          </button>
        ))}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título o cliente"
          className="ml-auto w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-accent sm:w-64"
        />
      </div>

      {/* ── MOBILE: day list ── */}
      <div className="lg:hidden">
        {selectedJob ? (
          <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4">
            <JobDetailPanel
              job={selectedJob}
              addOnServices={addOnServices}
              addJobItemAction={addJobItemAction}
              removeJobItemAction={removeJobItemAction}
              onClose={() => setSelectedJobId(null)}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {days.map((day) => {
              const dayJobs = jobsByDay.get(day.toISOString()) ?? []
              const isToday = day.toDateString() === new Date().toDateString()
              return (
                <div key={day.toISOString()}>
                  <div className={`mb-2 flex items-center gap-2`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${isToday ? "text-accent" : "text-foreground/45"}`}>
                      {day.toLocaleDateString("es-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    {isToday && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent-foreground">Hoy</span>}
                    {dayJobs.length > 0 && (
                      <span className="ml-auto rounded-full border border-foreground/15 px-2 py-0.5 text-[10px] text-foreground/50">
                        {dayJobs.length}
                      </span>
                    )}
                  </div>
                  {dayJobs.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-foreground/12 px-3 py-3 text-center text-xs text-foreground/35">
                      Sin visitas
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {dayJobs.map((job) => (
                        <li key={job.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedJobId(job.id)}
                            className={`w-full rounded-xl border px-3.5 py-3 text-left transition hover:bg-foreground/5 ${
                              STATUS_CHIP[job.status] ? "border-foreground/12 bg-background" : "border-foreground/12 bg-background"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold leading-snug text-sm">{job.title}</p>
                              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_BADGE[job.status] ?? ""}`}>
                                {STATUS_LABEL[job.status] ?? job.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-foreground/55">{job.customerName}</p>
                            <p className="mt-0.5 text-[11px] text-foreground/40">
                              {job.when.toLocaleTimeString("es-US", { hour: "numeric", minute: "2-digit" })}
                              {job.propertyAddress ? ` · ${job.propertyAddress}` : ""}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── DESKTOP: grid timeline + aside ── */}
      <div className="hidden lg:grid lg:gap-4 lg:grid-cols-[minmax(0,1fr)_272px]">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]">
              <div />
              {days.map((d) => (
                <div key={d.toISOString()} className="border-b border-foreground/10 px-2 py-2 text-center">
                  <p className={`text-xs uppercase tracking-wide ${d.toDateString() === new Date().toDateString() ? "font-bold text-accent" : "text-foreground/55"}`}>
                    {d.toLocaleDateString("es-US", { weekday: "short" })}
                  </p>
                  <p className="text-sm font-medium">
                    {d.toLocaleDateString("es-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              ))}

              {/* Hour labels */}
              <div className="relative border-r border-foreground/10" style={{ height: totalHeight }}>
                {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                  <div key={i} className="absolute left-0 right-0 -translate-y-1/2 pr-2 text-right text-[10px] text-foreground/45"
                    style={{ top: i * HOUR_HEIGHT }}>
                    {(START_HOUR + i).toString().padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day) => {
                const dayStart = new Date(day)
                const dayEnd = new Date(day)
                dayEnd.setDate(dayEnd.getDate() + 1)
                const dayJobs = visibleJobs.filter((j) => j.when >= dayStart && j.when < dayEnd)

                return (
                  <div key={`col-${day.toISOString()}`}
                    className="relative border-r border-foreground/10 last:border-r-0"
                    style={{ height: totalHeight }}>
                    {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                      <button key={i} type="button"
                        onClick={() => setDraft({ dayISO: day.toISOString(), hour: START_HOUR + i, title: "", customerName: "" })}
                        className="absolute left-0 right-0 border-t border-foreground/10 hover:bg-accent/5"
                        style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                        aria-label={`Crear visita a las ${(START_HOUR + i).toString().padStart(2, "0")}:00`}
                      />
                    ))}

                    {dayJobs.map((job) => {
                      const minutes = job.when.getHours() * 60 + job.when.getMinutes()
                      const top = ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT
                      const chip = STATUS_CHIP[job.status] ?? "border-zinc-600 bg-zinc-700 text-white"
                      return (
                        <button key={job.id} type="button" onClick={() => setSelectedJobId(job.id)}
                          className={`absolute left-1 right-1 overflow-hidden rounded-lg border px-2 py-1 text-left ${chip} ${selectedJobId === job.id ? "ring-2 ring-accent/70" : ""}`}
                          style={{ top: Math.max(2, top), height: JOB_BLOCK_HEIGHT }}>
                          <p className="truncate text-[11px] font-semibold">{job.title}</p>
                          <p className="truncate text-[10px] opacity-85">{job.customerName}</p>
                          <p className="text-[9px] opacity-70">
                            {job.when.toLocaleTimeString("es-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Desktop detail aside */}
        <aside className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4">
          <h3 className="mb-4 font-display text-base font-semibold">Detalles</h3>
          {selectedJob ? (
            <JobDetailPanel
              job={selectedJob}
              addOnServices={addOnServices}
              addJobItemAction={addJobItemAction}
              removeJobItemAction={removeJobItemAction}
            />
          ) : (
            <p className="text-sm text-foreground/45">Selecciona una visita del timeline.</p>
          )}
        </aside>
      </div>

      {/* Draft quick-create (desktop only) */}
      {draft ? (
        <div className="mt-4 hidden rounded-2xl border border-accent/30 bg-accent/8 p-4 lg:block">
          <p className="text-sm font-semibold text-accent">Crear visita rápida</p>
          <p className="mt-1 text-xs text-foreground/55">
            {new Date(draft.dayISO).toLocaleDateString("es-US", { weekday: "short", month: "short", day: "numeric" })} a las {draft.hour.toString().padStart(2, "0")}:00
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input type="text" value={draft.title}
              onChange={(e) => setDraft((p) => p ? { ...p, title: e.target.value } : p)}
              placeholder="Título de visita"
              className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <input type="text" value={draft.customerName}
              onChange={(e) => setDraft((p) => p ? { ...p, customerName: e.target.value } : p)}
              placeholder="Nombre del cliente"
              className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={createDraftVisit}
              className="rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90">
              Agregar visita
            </button>
            <button type="button" onClick={() => setDraft(null)}
              className="rounded-xl border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5">
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

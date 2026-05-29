"use client"

import { useEffect, useMemo, useState } from "react"

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
  items: Array<{
    id: string
    serviceId: string
    serviceName: string
    quantity: number
  }>
}

type AddOnService = {
  id: string
  name: string
  defaultPrice: string | null
}

const DIFFICULTY_LABEL: Record<string, string> = { EASY: "Fácil", MEDIUM: "Medio", HARD: "Difícil" }
const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: "border-emerald-200 bg-emerald-50/80 text-emerald-300",
  MEDIUM: "border-amber-200 bg-amber-50/80 text-amber-300",
  HARD: "border-rose-200 bg-rose-50/80 text-rose-300",
}

const START_HOUR = 6
const END_HOUR = 20
const HOUR_HEIGHT = 64
const JOB_BLOCK_HEIGHT = HOUR_HEIGHT - 8
const STATUS_OPTIONS = ["ALL", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const

const statusChip: Record<string, string> = {
  SCHEDULED: "border-blue-800 bg-blue-700 text-white shadow-sm",
  IN_PROGRESS: "border-amber-700 bg-amber-600 text-white shadow-sm",
  COMPLETED: "border-emerald-800 bg-emerald-700 text-white shadow-sm",
  CANCELLED: "border-rose-800 bg-rose-700 text-white shadow-sm",
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

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
  const [showAddOn, setShowAddOn] = useState(false)
  const [localJobs, setLocalJobs] = useState<TimelineJob[]>(jobs)

  useEffect(() => {
    setLocalJobs((prev) => {
      const drafts = prev.filter((j) => j.id.startsWith("draft-"))
      return [...jobs, ...drafts]
    })
  }, [jobs])

  useEffect(() => {
    setShowAddOn(false)
  }, [selectedJobId])

  const [draft, setDraft] = useState<{
    dayISO: string
    hour: number
    title: string
    customerName: string
  } | null>(null)

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date())
    base.setDate(base.getDate() + weekOffset * 7)
    return base
  }, [weekOffset])

  const days = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(weekStart)
        d.setDate(weekStart.getDate() + i)
        return d
      }),
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

  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT
  const selectedJob = visibleJobs.find((j) => j.id === selectedJobId) ?? null

  function createDraftVisit() {
    if (!draft || !draft.title.trim() || !draft.customerName.trim()) return

    const dt = new Date(draft.dayISO)
    dt.setHours(draft.hour, 0, 0, 0)

    const newJob: TimelineJob = {
      id: `draft-${Date.now()}`,
      title: draft.title.trim(),
      customerName: draft.customerName.trim(),
      propertyAddress: "",
      yardFront: false,
      yardBack: false,
      yardSides: false,
      jobDifficulty: null,
      estimatedDurationMin: null,
      status: "SCHEDULED",
      scheduledAt: dt.toISOString(),
      items: [],
    }

    setLocalJobs((prev) => [...prev, newJob])
    setSelectedJobId(newJob.id)
    setDraft(null)
  }

  return (
    <section className="mt-8 rounded-xl border border-foreground/10 bg-background p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">
            Weekly Timeline
          </h2>
          <p className="text-sm text-foreground/65">
            {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
            {new Date(weekEnd.getTime() - 1).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((v) => v - 1)}
            className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5"
          >
            Current
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((v) => v + 1)}
            className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setStatusFilter(opt)}
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
              statusFilter === opt
                ? "border-accent/60 bg-accent/20 text-accent"
                : "border-foreground/20 text-foreground/70 hover:bg-foreground/5"
            }`}
          >
            {opt.replace("_", " ")}
          </button>
        ))}

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or customer"
          className="ml-auto w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-accent sm:w-72"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
            <div />
            {days.map((d) => (
              <div key={d.toISOString()} className="border-b border-foreground/10 px-2 py-2 text-center">
                <p className="text-xs uppercase tracking-wide text-foreground/55">
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p className="text-sm font-medium">
                  {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            ))}

            <div className="relative border-r border-foreground/10" style={{ height: totalHeight }}>
              {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 -translate-y-1/2 pr-2 text-right text-xs text-foreground/50"
                  style={{ top: i * HOUR_HEIGHT }}
                >
                  {(START_HOUR + i).toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {days.map((day) => {
              const dayStart = new Date(day)
              const dayEnd = new Date(day)
              dayEnd.setDate(dayEnd.getDate() + 1)

              const dayJobs = visibleJobs.filter((j) => j.when >= dayStart && j.when < dayEnd)

              return (
                <div
                  key={`col-${day.toISOString()}`}
                  className="relative border-r border-foreground/10 last:border-r-0"
                  style={{ height: totalHeight }}
                >
                  {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() =>
                        setDraft({
                          dayISO: day.toISOString(),
                          hour: START_HOUR + i,
                          title: "",
                          customerName: "",
                        })
                      }
                      className="absolute left-0 right-0 border-t border-foreground/10 hover:bg-accent/5"
                      style={{ top: i * HOUR_HEIGHT }}
                      aria-label={`Create visit at ${(START_HOUR + i).toString().padStart(2, "0")}:00`}
                    />
                  ))}

                  {dayJobs.map((job) => {
                    const minutes = job.when.getHours() * 60 + job.when.getMinutes()
                    const startMinutes = START_HOUR * 60
                    const top = ((minutes - startMinutes) / 60) * HOUR_HEIGHT
                    const height = JOB_BLOCK_HEIGHT
                    const chip = statusChip[job.status] ?? "border-zinc-600 bg-zinc-700 text-white shadow-sm"
                    const isSelected = selectedJobId === job.id

                    return (
                      <button
                        type="button"
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        className={`absolute left-1.5 right-1.5 overflow-hidden rounded-md border px-2 py-1 text-left ${chip} ${
                          isSelected ? "ring-2 ring-accent/70" : ""
                        }`}
                        style={{ top: Math.max(2, top), height }}
                      >
                        <p className="truncate text-xs font-semibold">{job.title}</p>
                        <p className="truncate text-[11px] opacity-85">{job.customerName}</p>
                        <p className="text-[10px] opacity-70">
                          {job.when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
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

        <aside className="rounded-xl border border-foreground/10 bg-[#151515]/20 p-4">
          <h3 className="font-display text-lg font-semibold">
            Visit details
          </h3>

          {selectedJob ? (
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-foreground/60">Title</p>
              <p className="font-medium">{selectedJob.title}</p>
              <p className="pt-2 text-foreground/60">Customer</p>
              <p className="font-medium">{selectedJob.customerName}</p>
              {selectedJob.propertyAddress && (
                <>
                  <p className="pt-2 text-foreground/60">Property</p>
                  <p className="font-medium">{selectedJob.propertyAddress}</p>
                </>
              )}
              {(selectedJob.yardFront || selectedJob.yardBack || selectedJob.yardSides) && (
                <>
                  <p className="pt-2 text-foreground/60">Áreas</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedJob.yardFront && (
                      <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Frente</span>
                    )}
                    {selectedJob.yardBack && (
                      <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Patio</span>
                    )}
                    {selectedJob.yardSides && (
                      <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Laterales</span>
                    )}
                  </div>
                </>
              )}
              {selectedJob.jobDifficulty && (
                <>
                  <p className="pt-2 text-foreground/60">Dificultad</p>
                  <span className={`w-fit rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${DIFFICULTY_STYLE[selectedJob.jobDifficulty] ?? ""}`}>
                    {DIFFICULTY_LABEL[selectedJob.jobDifficulty]}
                  </span>
                </>
              )}
              {selectedJob.estimatedDurationMin && (
                <>
                  <p className="pt-2 text-foreground/60">Duración estimada</p>
                  <p className="font-medium">~{selectedJob.estimatedDurationMin} min</p>
                </>
              )}
              <p className="pt-2 text-foreground/60">Scheduled at</p>
              <p className="font-medium">
                {selectedJob.when.toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <p className="pt-2 text-foreground/60">Status</p>
              <p className="font-medium">{selectedJob.status.replace("_", " ")}</p>

              {!selectedJob.id.startsWith("draft-") && (
                <div className="pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground/60">Add-ons</p>
                    <button
                      type="button"
                      onClick={() => setShowAddOn((v) => !v)}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      {showAddOn ? "Cancel" : "+ Add"}
                    </button>
                  </div>

                  {selectedJob.items.length === 0 && !showAddOn && (
                    <p className="mt-1 text-xs text-foreground/45">None added yet.</p>
                  )}

                  <div className="mt-1 space-y-1">
                    {selectedJob.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded border border-foreground/10 bg-foreground/5 px-2 py-1"
                      >
                        <p className="text-xs">
                          {item.serviceName}
                          {item.quantity > 1 && (
                            <span className="ml-1 text-foreground/50">×{item.quantity}</span>
                          )}
                        </p>
                        <form action={removeJobItemAction}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <button
                            type="submit"
                            className="text-rose-400 hover:text-rose-300"
                            aria-label="Remove"
                          >
                            ✕
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>

                  {showAddOn && (
                    <form
                      action={addJobItemAction}
                      onSubmit={() => setShowAddOn(false)}
                      className="mt-2 space-y-2"
                    >
                      <input type="hidden" name="jobId" value={selectedJob.id} />
                      <select
                        name="serviceId"
                        required
                        className="w-full rounded-md border border-foreground/20 bg-background px-2 py-1.5 text-xs outline-none focus:border-accent"
                      >
                        <option value="">Select add-on</option>
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
                          placeholder="Qty"
                          className="w-16 rounded-md border border-foreground/20 bg-background px-2 py-1.5 text-xs outline-none focus:border-accent"
                        />
                        <button
                          type="submit"
                          className="flex-1 rounded-md bg-accent px-2 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-foreground/60">
              Select a visit from the timeline to see details.
            </p>
          )}
        </aside>
      </div>

      {draft ? (
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent/10 p-4">
          <p className="text-sm font-semibold text-accent">Quick create visit</p>
          <p className="mt-1 text-xs text-foreground/65">
            {new Date(draft.dayISO).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            at {draft.hour.toString().padStart(2, "0")}:00
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
              placeholder="Visit title"
              className="rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
            <input
              type="text"
              value={draft.customerName}
              onChange={(e) => setDraft((prev) => (prev ? { ...prev, customerName: e.target.value } : prev))}
              placeholder="Customer name"
              className="rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={createDraftVisit}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
            >
              Add visit
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

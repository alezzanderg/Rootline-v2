"use client"

import { useRef, useState, useTransition } from "react"

type Property = {
  id: string
  label: string | null
  street: string
  city: string
  state: string
  zipCode: string
  lotSizeSqFt: number | null
  accessNotes: string | null
  yardFront: boolean
  yardBack: boolean
  yardSides: boolean
  jobDifficulty: string | null
  estimatedDurationMin: number | null
}

const DIFFICULTY_LABEL: Record<string, string> = { EASY: "Fácil", MEDIUM: "Medio", HARD: "Difícil" }
const DIFFICULTY_JOB_STYLE: Record<string, string> = {
  EASY: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HARD: "border-rose-200 bg-rose-50 text-rose-700",
}

const ic = "rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

export function PropertiesDialog({
  customerName,
  customerId,
  properties,
  updatePropertyAction,
  deletePropertyAction,
  createPropertyAction,
}: {
  customerName: string
  customerId: string
  properties: Property[]
  updatePropertyAction: (formData: FormData) => Promise<void>
  deletePropertyAction: (formData: FormData) => Promise<void>
  createPropertyAction: (formData: FormData) => Promise<void>
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [isPending, startTransition] = useTransition()

  function submitUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await updatePropertyAction(formData)
      setEditingId(null)
    })
  }

  function submitDelete(propertyId: string) {
    const formData = new FormData()
    formData.set("id", propertyId)
    formData.set("confirmDelete", "on")
    startTransition(async () => {
      await deletePropertyAction(formData)
      setDeletingId(null)
    })
  }

  function submitCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    startTransition(async () => {
      await createPropertyAction(formData)
      setAddingNew(false)
      form.reset()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="rounded-md border border-foreground/15 px-2 py-1 text-xs font-medium text-foreground/55 transition hover:bg-foreground/6 hover:text-foreground/80"
      >
        Editar{properties.length > 0 ? ` (${properties.length})` : ""}
      </button>

      <dialog
        ref={ref}
        onClick={(e) => { if (e.target === ref.current) ref.current?.close() }}
        className="m-auto w-full max-w-lg rounded-2xl border border-foreground/12 bg-[#fdfcf8] p-0 shadow-2xl outline-none backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-4">
          <div>
            <p className="font-(family-name:--font-display-family) text-base font-semibold text-foreground">
              Propiedades
            </p>
            <p className="text-xs text-foreground/45">{customerName}</p>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-sm text-foreground/40 transition hover:bg-foreground/8 hover:text-foreground/70"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[75vh] space-y-3 overflow-y-auto px-6 py-5">
          {properties.length === 0 && editingId === null && !addingNew && (
            <p className="text-sm text-foreground/40">Sin propiedades registradas.</p>
          )}

          {properties.map((property) =>
            editingId === property.id ? (
              /* ── Edit form ── */
              <form key={property.id} onSubmit={submitUpdate} className="rounded-lg border border-accent/30 bg-accent/4 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">Editando propiedad</p>
                <input type="hidden" name="id" value={property.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="grid gap-1 sm:col-span-2">
                    <span className={lbl}>Label (opcional)</span>
                    <input name="label" defaultValue={property.label ?? ""} className={ic} />
                  </label>
                  <label className="grid gap-1 sm:col-span-2">
                    <span className={lbl}>Calle</span>
                    <input name="street" defaultValue={property.street} required className={ic} />
                  </label>
                  <label className="grid gap-1">
                    <span className={lbl}>Ciudad</span>
                    <input name="city" defaultValue={property.city} required className={ic} />
                  </label>
                  <label className="grid gap-1">
                    <span className={lbl}>Estado</span>
                    <input name="state" defaultValue={property.state} className={ic} />
                  </label>
                  <label className="grid gap-1">
                    <span className={lbl}>ZIP</span>
                    <input name="zipCode" defaultValue={property.zipCode} required className={ic} />
                  </label>
                  <label className="grid gap-1">
                    <span className={lbl}>Lot size (sqft)</span>
                    <input name="lotSizeSqFt" type="number" defaultValue={property.lotSizeSqFt ?? ""} className={ic} />
                  </label>
                  <label className="grid gap-1 sm:col-span-2">
                    <span className={lbl}>Notas de acceso</span>
                    <input name="accessNotes" defaultValue={property.accessNotes ?? ""} className={ic} />
                  </label>
                  <div className="grid gap-1 sm:col-span-2">
                    <span className={lbl}>Áreas de trabajo</span>
                    <div className="flex flex-wrap gap-4 pt-0.5">
                      <label className="flex items-center gap-1.5 text-sm text-foreground/70">
                        <input type="checkbox" name="yardFront" defaultChecked={property.yardFront} />
                        Frente
                      </label>
                      <label className="flex items-center gap-1.5 text-sm text-foreground/70">
                        <input type="checkbox" name="yardBack" defaultChecked={property.yardBack} />
                        Patio
                      </label>
                      <label className="flex items-center gap-1.5 text-sm text-foreground/70">
                        <input type="checkbox" name="yardSides" defaultChecked={property.yardSides} />
                        Laterales
                      </label>
                    </div>
                  </div>
                  <label className="grid gap-1">
                    <span className={lbl}>Dificultad del trabajo</span>
                    <select name="jobDifficulty" defaultValue={property.jobDifficulty ?? ""} className={ic}>
                      <option value="">Sin especificar</option>
                      <option value="EASY">Fácil</option>
                      <option value="MEDIUM">Medio</option>
                      <option value="HARD">Difícil</option>
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className={lbl}>Duración estimada (min)</span>
                    <input name="estimatedDurationMin" type="number" min="0" step="5" defaultValue={property.estimatedDurationMin ?? ""} className={ic} />
                  </label>
                  <div className="flex gap-2 sm:col-span-2">
                    <button type="submit" disabled={isPending} className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition hover:bg-foreground/85 disabled:opacity-50">
                      Guardar
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/55 transition hover:bg-foreground/6">
                      Cancelar
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* ── Property card ── */
              <div key={property.id} className="rounded-lg border border-foreground/10 bg-white/60 p-3">
                {deletingId === property.id ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-foreground/60">¿Eliminar esta propiedad?</p>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => submitDelete(property.id)}
                        className="rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="rounded-md border border-foreground/15 px-3 py-1 text-xs font-medium text-foreground/55 transition hover:bg-foreground/6"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {property.label && (
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">{property.label}</p>
                      )}
                      <p className="text-sm font-medium">
                        {property.street}, {property.city}, {property.state} {property.zipCode}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-foreground/40">
                        {property.lotSizeSqFt && <span>{property.lotSizeSqFt.toLocaleString()} sqft</span>}
                        {property.accessNotes && <span>{property.accessNotes}</span>}
                        {property.estimatedDurationMin && <span>~{property.estimatedDurationMin} min</span>}
                      </div>
                      {(property.yardFront || property.yardBack || property.yardSides || property.jobDifficulty) && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {property.yardFront && (
                            <span className="rounded border border-primary/25 bg-primary/8 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Frente</span>
                          )}
                          {property.yardBack && (
                            <span className="rounded border border-primary/25 bg-primary/8 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Patio</span>
                          )}
                          {property.yardSides && (
                            <span className="rounded border border-primary/25 bg-primary/8 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Laterales</span>
                          )}
                          {property.jobDifficulty && (
                            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${DIFFICULTY_JOB_STYLE[property.jobDifficulty] ?? ""}`}>
                              {DIFFICULTY_LABEL[property.jobDifficulty]}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => { setEditingId(property.id); setDeletingId(null) }}
                        className="rounded-md border border-foreground/15 px-2 py-0.5 text-xs font-medium text-foreground/55 transition hover:bg-foreground/6 hover:text-foreground/80"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDeletingId(property.id); setEditingId(null) }}
                        className="rounded-md border border-rose-200 px-2 py-0.5 text-xs font-medium text-rose-500 transition hover:bg-rose-50"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* Add property */}
          {addingNew ? (
            <form onSubmit={submitCreate} className="rounded-lg border border-dashed border-foreground/20 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/40">Nueva propiedad</p>
              <input type="hidden" name="customerId" value={customerId} />
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid gap-1 sm:col-span-2">
                  <span className={lbl}>Label (opcional)</span>
                  <input name="label" placeholder="ej. Casa principal" className={ic} />
                </label>
                <label className="grid gap-1 sm:col-span-2">
                  <span className={lbl}>Calle</span>
                  <input name="street" required placeholder="123 Main St" className={ic} />
                </label>
                <label className="grid gap-1">
                  <span className={lbl}>Ciudad</span>
                  <input name="city" required placeholder="Toms River" className={ic} />
                </label>
                <label className="grid gap-1">
                  <span className={lbl}>Estado</span>
                  <input name="state" defaultValue="NJ" className={ic} />
                </label>
                <label className="grid gap-1">
                  <span className={lbl}>ZIP</span>
                  <input name="zipCode" required placeholder="08753" className={ic} />
                </label>
                <label className="grid gap-1">
                  <span className={lbl}>Lot size (sqft)</span>
                  <input name="lotSizeSqFt" type="number" placeholder="5000" className={ic} />
                </label>
                <label className="grid gap-1 sm:col-span-2">
                  <span className={lbl}>Notas de acceso</span>
                  <input name="accessNotes" placeholder="Gate code, parking notes…" className={ic} />
                </label>
                <div className="grid gap-1 sm:col-span-2">
                  <span className={lbl}>Áreas de trabajo</span>
                  <div className="flex flex-wrap gap-4 pt-0.5">
                    <label className="flex items-center gap-1.5 text-sm text-foreground/70">
                      <input type="checkbox" name="yardFront" />
                      Frente
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-foreground/70">
                      <input type="checkbox" name="yardBack" />
                      Patio
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-foreground/70">
                      <input type="checkbox" name="yardSides" />
                      Laterales
                    </label>
                  </div>
                </div>
                <label className="grid gap-1">
                  <span className={lbl}>Dificultad del trabajo</span>
                  <select name="jobDifficulty" className={ic}>
                    <option value="">Sin especificar</option>
                    <option value="EASY">Fácil</option>
                    <option value="MEDIUM">Medio</option>
                    <option value="HARD">Difícil</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className={lbl}>Duración estimada (min)</span>
                  <input name="estimatedDurationMin" type="number" min="0" step="5" placeholder="45" className={ic} />
                </label>
                <div className="flex gap-2 sm:col-span-2">
                  <button type="submit" disabled={isPending} className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50">
                    Guardar propiedad
                  </button>
                  <button type="button" onClick={() => setAddingNew(false)} className="rounded-md border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/55 transition hover:bg-foreground/6">
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => { setAddingNew(true); setEditingId(null); setDeletingId(null) }}
              className="w-full rounded-lg border border-dashed border-foreground/20 px-3 py-2.5 text-sm font-medium text-foreground/45 transition hover:border-foreground/35 hover:text-foreground/70"
            >
              + Agregar propiedad
            </button>
          )}

          {isPending && (
            <p className="text-xs text-foreground/40">Guardando…</p>
          )}
        </div>
      </dialog>
    </>
  )
}

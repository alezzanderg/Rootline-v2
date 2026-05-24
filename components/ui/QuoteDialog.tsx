"use client"

import { useRef, useState, useTransition } from "react"

type QuoteItem = {
  id: string
  serviceId: string
  serviceName: string
  quantity: string
  unitPrice: string
  lineTotal: string
  description: string | null
}

type ServiceOption = {
  id: string
  name: string
  defaultPrice: string | null
  startingAtPrice: string | null
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "border-foreground/20 bg-foreground/8 text-foreground/60",
  SENT: "border-blue-400/40 bg-blue-50 text-blue-700",
  APPROVED: "border-emerald-500/40 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-400/40 bg-rose-50 text-rose-600",
}

const ic = "rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

export function QuoteDialog({
  quoteId,
  quoteStatus,
  customerName,
  propertyAddress,
  subtotal,
  tax,
  total,
  notes,
  validUntil,
  items,
  services,
  addItemAction,
  removeItemAction,
  changeStatusAction,
}: {
  quoteId: string
  quoteStatus: string
  customerName: string
  propertyAddress: string | null
  subtotal: string
  tax: string
  total: string
  notes: string | null
  validUntil: string | null
  items: QuoteItem[]
  services: ServiceOption[]
  addItemAction: (formData: FormData) => Promise<void>
  removeItemAction: (formData: FormData) => Promise<void>
  changeStatusAction: (formData: FormData) => Promise<void>
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [addingItem, setAddingItem] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedServiceId, setSelectedServiceId] = useState("")
  const [unitPrice, setUnitPrice] = useState("")

  const isDraft = quoteStatus === "DRAFT"
  const isSent = quoteStatus === "SENT"

  function handleServiceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const svc = services.find((s) => s.id === e.target.value)
    setSelectedServiceId(e.target.value)
    if (svc) setUnitPrice(svc.defaultPrice ?? svc.startingAtPrice ?? "")
  }

  function submitAddItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await addItemAction(formData)
      setAddingItem(false)
      setSelectedServiceId("")
      setUnitPrice("")
    })
  }

  function submitRemoveItem(itemId: string) {
    const formData = new FormData()
    formData.set("itemId", itemId)
    formData.set("quoteId", quoteId)
    startTransition(async () => {
      await removeItemAction(formData)
      setRemovingId(null)
    })
  }

  function submitStatusChange(newStatus: string) {
    const formData = new FormData()
    formData.set("quoteId", quoteId)
    formData.set("status", newStatus)
    startTransition(async () => {
      await changeStatusAction(formData)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="rounded-md border border-foreground/15 px-2 py-1 text-xs font-medium text-foreground/55 transition hover:bg-foreground/6 hover:text-foreground/80"
      >
        Ver
      </button>

      <dialog
        ref={ref}
        onClick={(e) => { if (e.target === ref.current) ref.current?.close() }}
        className="m-auto w-full max-w-xl rounded-2xl border border-foreground/12 bg-[#fdfcf8] p-0 shadow-2xl outline-none backdrop:bg-black/50"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-foreground/10 px-6 py-4">
          <div>
            <p className="font-(family-name:--font-display-family) text-base font-semibold">
              Estimado{" "}
              <span className="font-mono text-sm font-normal text-foreground/40">#{quoteId.slice(0, 8)}</span>
            </p>
            <p className="text-sm text-foreground/65">{customerName}</p>
            {propertyAddress && <p className="text-xs text-foreground/40">{propertyAddress}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[quoteStatus] ?? STATUS_COLORS.DRAFT}`}
            >
              {STATUS_LABELS[quoteStatus] ?? quoteStatus}
            </span>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="flex h-7 w-7 items-center justify-center rounded-md text-sm text-foreground/40 transition hover:bg-foreground/8 hover:text-foreground/70"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">

          {/* Items table */}
          {items.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-foreground/10">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-foreground/10 bg-foreground/3">
                    <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Servicio</th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Cant.</th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/40">P. Unit.</th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Total</th>
                    {isDraft && <th className="w-8 px-3 py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) =>
                    removingId === item.id ? (
                      <tr key={item.id} className="border-b border-foreground/8 bg-rose-50/60">
                        <td colSpan={isDraft ? 5 : 4} className="px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-foreground/60">¿Eliminar esta línea?</span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => submitRemoveItem(item.id)}
                                className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                Sí
                              </button>
                              <button
                                type="button"
                                onClick={() => setRemovingId(null)}
                                className="rounded-md border border-foreground/15 px-2.5 py-1 text-xs text-foreground/55"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={item.id} className="border-b border-foreground/8 last:border-b-0">
                        <td className="px-3 py-2">
                          <p className="font-medium">{item.serviceName}</p>
                          {item.description && (
                            <p className="text-xs text-foreground/40">{item.description}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground/65">
                          {Number(item.quantity)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground/65">
                          ${Number(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">
                          ${Number(item.lineTotal).toFixed(2)}
                        </td>
                        {isDraft && (
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => { setRemovingId(item.id); setAddingItem(false) }}
                              className="rounded-md border border-rose-200 px-2 py-0.5 text-xs font-medium text-rose-500 transition hover:bg-rose-50"
                            >
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {items.length === 0 && !addingItem && (
            <p className="text-sm text-foreground/40">Sin líneas de servicio todavía.</p>
          )}

          {/* Add item */}
          {isDraft && (
            addingItem ? (
              <form onSubmit={submitAddItem} className="rounded-lg border border-dashed border-foreground/20 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/40">Nueva línea</p>
                <input type="hidden" name="quoteId" value={quoteId} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="grid gap-1 sm:col-span-2">
                    <span className={lbl}>Servicio</span>
                    <select
                      name="serviceId"
                      required
                      value={selectedServiceId}
                      onChange={handleServiceChange}
                      className={ic}
                    >
                      <option value="">Selecciona servicio…</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className={lbl}>Cantidad</span>
                    <input
                      name="quantity"
                      type="number"
                      step="0.01"
                      min="0.01"
                      defaultValue="1"
                      required
                      className={ic}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className={lbl}>Precio unitario ($)</span>
                    <input
                      name="unitPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className={ic}
                    />
                  </label>
                  <label className="grid gap-1 sm:col-span-2">
                    <span className={lbl}>Nota de línea (opcional)</span>
                    <input name="description" placeholder="Detalles adicionales…" className={ic} />
                  </label>
                  <div className="flex gap-2 sm:col-span-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
                    >
                      Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddingItem(false); setSelectedServiceId(""); setUnitPrice("") }}
                      className="rounded-md border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/55 transition hover:bg-foreground/6"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => { setAddingItem(true); setRemovingId(null) }}
                className="w-full rounded-lg border border-dashed border-foreground/20 px-3 py-2.5 text-sm font-medium text-foreground/45 transition hover:border-foreground/35 hover:text-foreground/70"
              >
                + Agregar servicio
              </button>
            )
          )}

          {/* Totals */}
          {items.length > 0 && (
            <div className="space-y-1 rounded-lg border border-foreground/10 bg-foreground/3 px-4 py-3 text-sm">
              <div className="flex justify-between text-foreground/60">
                <span>Subtotal</span>
                <span className="tabular-nums">${Number(subtotal).toFixed(2)}</span>
              </div>
              {Number(tax) > 0 && (
                <div className="flex justify-between text-foreground/60">
                  <span>Impuesto</span>
                  <span className="tabular-nums">${Number(tax).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-foreground/10 pt-1.5 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">${Number(total).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Meta */}
          {(notes || validUntil) && (
            <div className="space-y-0.5 text-xs text-foreground/50">
              {notes && (
                <p>
                  <span className="font-semibold uppercase tracking-wider">Notas:</span> {notes}
                </p>
              )}
              {validUntil && (
                <p>
                  <span className="font-semibold uppercase tracking-wider">Válido hasta:</span>{" "}
                  {new Date(validUntil).toLocaleDateString("es-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          )}

          {/* Status actions */}
          {(isDraft || isSent) && (
            <div className="border-t border-foreground/10 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/40">
                Cambiar estado
              </p>
              <div className="flex flex-wrap gap-2">
                {isDraft && (
                  <button
                    type="button"
                    disabled={isPending || items.length === 0}
                    onClick={() => submitStatusChange("SENT")}
                    title={items.length === 0 ? "Agrega al menos un servicio primero" : undefined}
                    className="rounded-md border border-blue-400/40 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Marcar como Enviado
                  </button>
                )}
                {isSent && (
                  <>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => submitStatusChange("APPROVED")}
                      className="rounded-md border border-emerald-500/40 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => submitStatusChange("REJECTED")}
                      className="rounded-md border border-rose-400/40 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-40"
                    >
                      Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {isPending && <p className="text-xs text-foreground/40">Guardando…</p>}
        </div>
      </dialog>
    </>
  )
}

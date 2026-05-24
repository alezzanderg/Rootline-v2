"use client"

import { useMemo, useState } from "react"

export type AssignPlanCustomerOption = {
  id: string
  firstName: string
  lastName: string
  properties: { id: string; label: string | null; street: string; city: string }[]
}

export function AssignPlanCustomerPropertyFields({
  customers,
  ic,
  lbl,
}: {
  customers: AssignPlanCustomerOption[]
  ic: string
  lbl: string
}) {
  const [customerId, setCustomerId] = useState("")

  const selected = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  )

  return (
    <>
      <label className="grid gap-1 md:col-span-2">
        <span className={lbl}>Cliente</span>
        <select
          name="customerId"
          required
          className={ic}
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">Selecciona cliente</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      </label>

      {selected && selected.properties.length > 1 ? (
        <label key={`${selected.id}-prop-wrap`} className="grid gap-1 md:col-span-2">
          <span className={lbl}>Propiedad a programar</span>
          <select
            key={`${selected.id}-propertyId`}
            name="propertyId"
            required
            className={ic}
            defaultValue=""
          >
            <option value="" disabled>
              Selecciona una propiedad…
            </option>
            {selected.properties.map((p) => (
              <option key={p.id} value={p.id}>
                {(p.label ? `${p.label} · ` : "") + `${p.street}, ${p.city}`}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {selected && selected.properties.length === 1 ? (
        <input type="hidden" name="propertyId" value={selected.properties[0].id} />
      ) : null}

      {selected && selected.properties.length === 0 ? (
        <p className="text-xs text-amber-700 md:col-span-2">
          Este cliente no tiene direcciones guardadas: solo se guardará el plan (sin visitas en Scheduling) hasta
          agregar una propiedad.
        </p>
      ) : null}
    </>
  )
}

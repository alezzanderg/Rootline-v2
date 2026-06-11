import {
  TOOL_CATEGORIES,
  TOOL_FUEL_TYPES,
  TOOL_STATUS_OPTIONS,
  specsToText,
  toInputDate,
  type ToolFormValue,
} from "@/lib/tools-shared"

const ic =
  "w-full rounded-xl border border-foreground/20 bg-white/60 px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5">
      <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

/** Editable fields for the create/edit tool forms. */
export function ToolFormFields({ tool, editing = false }: { tool?: ToolFormValue; editing?: boolean }) {
  return (
    <div className="grid gap-5">
      <Section title="Identificación">
        <label className="grid gap-1 sm:col-span-2">
          <span className={lbl}>Nombre *</span>
          <input name="name" required defaultValue={tool?.name ?? ""} placeholder="Ej. Toro TimeMaster 30" className={ic} />
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Categoría</span>
          <select name="category" defaultValue={tool?.category ?? ""} className={ic}>
            <option value="">— Sin categoría —</option>
            {TOOL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Estado</span>
          <select name="status" defaultValue={tool?.status ?? "AVAILABLE"} className={ic}>
            {TOOL_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Marca</span>
          <input name="brand" defaultValue={tool?.brand ?? ""} placeholder="Ej. Toro" className={ic} />
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Modelo</span>
          <input name="model" defaultValue={tool?.model ?? ""} placeholder="Ej. TurfMaster HDX" className={ic} />
        </label>
        <label className="grid gap-1">
          <span className={lbl}>SKU</span>
          <input name="sku" defaultValue={tool?.sku ?? ""} placeholder="Código de producto" className={ic} />
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Número de serie</span>
          <input name="serialNumber" defaultValue={tool?.serialNumber ?? ""} placeholder="Opcional" className={ic} />
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Combustible / energía</span>
          <select name="fuelType" defaultValue={tool?.fuelType ?? ""} className={ic}>
            <option value="">— No especificado —</option>
            {TOOL_FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Motor / potencia</span>
          <input name="engine" defaultValue={tool?.engine ?? ""} placeholder="Ej. Kohler 224cc · Batería 80V" className={ic} />
        </label>
      </Section>

      <Section title="Compra">
        <label className="grid gap-1">
          <span className={lbl}>Fecha de compra</span>
          <input name="purchaseDate" type="date" defaultValue={toInputDate(tool?.purchaseDate ?? null)} className={ic} />
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Precio de compra</span>
          <input
            name="purchasePrice"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            defaultValue={tool?.purchasePrice != null ? Number(tool.purchasePrice).toString() : ""}
            placeholder="0.00"
            className={ic}
          />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          <span className={lbl}>Link de compra</span>
          <input name="purchaseUrl" type="url" defaultValue={tool?.purchaseUrl ?? ""} placeholder="https://…" className={ic} />
        </label>
      </Section>

      <Section title="Mantenimiento">
        <label className="grid gap-1">
          <span className={lbl}>Frecuencia de mantenimiento</span>
          <input
            name="maintenanceFrequency"
            defaultValue={tool?.maintenanceFrequency ?? ""}
            placeholder="Ej. Cada 50 horas · Mensual"
            className={ic}
          />
        </label>
        {editing ? (
          <label className="grid gap-1">
            <span className={lbl}>Último mantenimiento</span>
            <input name="lastMaintenance" type="date" defaultValue={toInputDate(tool?.lastMaintenance ?? null)} className={ic} />
          </label>
        ) : (
          <div className="hidden sm:block" />
        )}
        <label className="grid gap-1">
          <span className={lbl}>Próximo mantenimiento</span>
          <input name="nextMaintenance" type="date" defaultValue={toInputDate(tool?.nextMaintenance ?? null)} className={ic} />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          <span className={lbl}>Notas de mantenimiento</span>
          <textarea
            name="maintenanceNotes"
            rows={2}
            defaultValue={tool?.maintenanceNotes ?? ""}
            placeholder="Tipo de aceite, filtro, bujía…"
            className={`${ic} resize-none`}
          />
        </label>
      </Section>

      <Section title="Ficha técnica">
        <label className="grid gap-1 sm:col-span-2">
          <span className={lbl}>Especificaciones (una por línea: Nombre: Valor)</span>
          <textarea
            name="specs"
            rows={6}
            defaultValue={specsToText(tool?.specs)}
            placeholder={"Deck size: 30 in\nCapacidad de bolsa: 2.5 bushels\nMotor: Kohler CV224 224cc"}
            className={`${ic} resize-none font-mono text-xs`}
          />
          <span className="text-[10px] text-foreground/40">
            Pega aquí specs específicas del equipo. Cada línea es un dato: nombre, dos puntos y valor.
          </span>
        </label>
      </Section>
    </div>
  )
}

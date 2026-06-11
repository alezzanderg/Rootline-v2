import type { Prisma } from "@/lib/generated/prisma/client"

export const TOOL_CATEGORIES = [
  "Cortadora (Mower)",
  "Bordeadora (Trimmer)",
  "Sopladora (Blower)",
  "Bordeadora de filo (Edger)",
  "Podadora de setos",
  "Motosierra (Chainsaw)",
  "Fumigador (Sprayer)",
  "Remolque (Trailer)",
  "Otro",
]

export const TOOL_FUEL_TYPES = ["Gasolina", "Diésel", "Batería", "Eléctrico", "Manual"]

export const TOOL_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "ASSIGNED", label: "Asignado" },
  { value: "MAINTENANCE", label: "En mantenimiento" },
  { value: "OUT_OF_SERVICE", label: "Fuera de servicio" },
] as const

export type ToolStatus = (typeof TOOL_STATUS_OPTIONS)[number]["value"]

export type ToolSpec = { label: string; value: string }

export type ToolFormValue = {
  name: string
  category: string | null
  brand: string | null
  model: string | null
  sku: string | null
  serialNumber: string | null
  status: string
  fuelType: string | null
  engine: string | null
  purchaseDate: Date | null
  purchasePrice: Prisma.Decimal | null
  purchaseUrl: string | null
  lastMaintenance: Date | null
  nextMaintenance: Date | null
  maintenanceFrequency: string | null
  maintenanceNotes: string | null
  specs: Prisma.JsonValue | null
}

export function normalizeToolStatus(raw: string): ToolStatus {
  return raw === "AVAILABLE" || raw === "ASSIGNED" || raw === "MAINTENANCE" || raw === "OUT_OF_SERVICE"
    ? raw
    : "AVAILABLE"
}

export function statusBadgeCls(status: string) {
  return (
    {
      AVAILABLE: "border-emerald-500/35 bg-emerald-50 text-emerald-700",
      ASSIGNED: "border-blue-400/40 bg-blue-50 text-blue-700",
      MAINTENANCE: "border-amber-400/40 bg-amber-50 text-amber-800",
      OUT_OF_SERVICE: "border-rose-400/40 bg-rose-50 text-rose-600",
    }[status] ?? "border-foreground/20 bg-foreground/8 text-foreground/60"
  )
}

export function statusLabel(status: string) {
  return (
    {
      AVAILABLE: "Disponible",
      ASSIGNED: "Asignado",
      MAINTENANCE: "En mantenimiento",
      OUT_OF_SERVICE: "Fuera de servicio",
    }[status] ?? status
  )
}

export function fmtToolDate(d: Date | null) {
  if (!d) return null
  return d.toLocaleDateString("es-US", { month: "short", day: "numeric", year: "numeric" })
}

export function fmtMoney(v: Prisma.Decimal | null) {
  if (v == null) return null
  return `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function toInputDate(d: Date | null) {
  if (!d) return ""
  return d.toISOString().slice(0, 10)
}

export function maintenanceAlert(next: Date | null): "overdue" | "soon" | null {
  if (!next) return null
  const now = new Date()
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  if (next < now) return "overdue"
  if (next <= in7) return "soon"
  return null
}

export function readSpecs(specs: Prisma.JsonValue | null | undefined): ToolSpec[] {
  if (!Array.isArray(specs)) return []
  const out: ToolSpec[] = []
  for (const s of specs) {
    if (s && typeof s === "object" && "label" in s) {
      const label = String((s as Record<string, unknown>).label ?? "").trim()
      const value = String((s as Record<string, unknown>).value ?? "").trim()
      if (label) out.push({ label, value })
    }
  }
  return out
}

export function specsToText(specs: Prisma.JsonValue | null | undefined): string {
  return readSpecs(specs)
    .map((s) => (s.value ? `${s.label}: ${s.value}` : s.label))
    .join("\n")
}

export function parseSpecsText(text: string): ToolSpec[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":")
      if (idx === -1) return { label: line, value: "" }
      return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }
    })
    .filter((r) => r.label)
}

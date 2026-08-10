import Link from "next/link"
import { redirect } from "next/navigation"

import { ActionBanner } from "@/components/ui/ActionBanner"
import { PropertyMetricsStepper } from "@/components/ui/PropertyMetricsStepper"
import { SubmitButton } from "@/components/ui/SubmitButton"
import { ActionError, requireAdmin, runAction, withError } from "@/lib/admin-action"
import { parseOptInt, parseOptPositiveInt } from "@/lib/form-parse"
import { prisma } from "@/lib/prisma"

function parseStr(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : ""
}

function parseOptStr(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null
  const s = v.trim()
  return s || null
}

function parseDifficulty(v: FormDataEntryValue | null): "EASY" | "MEDIUM" | "HARD" | null {
  const s = typeof v === "string" ? v.trim() : ""
  return s === "EASY" || s === "MEDIUM" || s === "HARD" ? s : null
}

type Props = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ error?: string; ok?: string }>
}

export default async function NuevaPropiedadPage({ params, searchParams }: Props) {
  const { id: customerId } = await params
  const banner = (await searchParams) ?? {}
  const pagePath = `/dashboard/clientes/${customerId}/propiedades/nueva`

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, firstName: true, lastName: true },
  })

  if (!customer) {
    redirect("/dashboard/clientes")
  }

  async function createPropertyAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("properties:write")
    if (!auth.ok) redirect(withError(pagePath, auth.code))

    const result = await runAction(
      auth.user,
      { action: "property.create", entityType: "Property" },
      async () => {
        const cId = parseStr(formData.get("customerId"))
        const street = parseStr(formData.get("street"))
        const city = parseStr(formData.get("city"))
        const zipCode = parseStr(formData.get("zipCode"))
        if (!cId || !street || !city || !zipCode) throw new ActionError("datos")
        // The customer id arrives from a hidden field; it must match the route.
        if (cId !== customerId) throw new ActionError("no_encontrado")

        await prisma.property.create({
          data: {
            customerId: cId,
            street,
            city,
            zipCode,
            state: parseStr(formData.get("state")) || "NJ",
            label: parseOptStr(formData.get("label")),
            accessNotes: parseOptStr(formData.get("accessNotes")),
            lotSizeSqFt: parseOptPositiveInt(formData.get("lotSizeSqFt")),
            flowerBedsCount: parseOptPositiveInt(formData.get("flowerBedsCount")),
            shrubsCount: parseOptPositiveInt(formData.get("shrubsCount")),
            treesCount: parseOptPositiveInt(formData.get("treesCount")),
            turfAreaSqFt: parseOptPositiveInt(formData.get("turfAreaSqFt")),
            bedsAreaSqFt: parseOptPositiveInt(formData.get("bedsAreaSqFt")),
            hardscapeAreaSqFt: parseOptPositiveInt(formData.get("hardscapeAreaSqFt")),
            yardFront: formData.get("yardFront") === "on",
            yardBack: formData.get("yardBack") === "on",
            yardSides: formData.get("yardSides") === "on",
            jobDifficulty: parseDifficulty(formData.get("jobDifficulty")),
            estimatedDurationMin: parseOptInt(formData.get("estimatedDurationMin")),
          },
        })
      }
    )
    if (!result.ok) redirect(withError(pagePath, result.code))

    redirect(`/dashboard/clientes/${customerId}`)
  }

  const ic =
    "rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

  return (
    <section className="admin-page--narrow text-foreground">
      <Link href={`/dashboard/clientes/${customer.id}`} className="text-sm text-foreground/55 hover:text-foreground">
        ← Volver al cliente
      </Link>

      <ActionBanner error={banner.error} notice={banner.ok} />

      <div className="mt-3">
        <h1 className="font-display text-3xl font-semibold">Nueva propiedad</h1>
        <p className="mt-1 text-sm text-foreground/55">
          {customer.firstName} {customer.lastName}
        </p>
      </div>

      <form action={createPropertyAction} className="mt-6 rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5">
        <input type="hidden" name="customerId" value={customer.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 sm:col-span-2">
            <span className={lbl}>Label (opcional)</span>
            <input name="label" placeholder="Ej. Casa principal" className={ic} />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className={lbl}>Calle</span>
            <input name="street" required className={ic} />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Ciudad</span>
            <input name="city" required className={ic} />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Estado</span>
            <input name="state" defaultValue="NJ" className={ic} />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>ZIP</span>
            <input name="zipCode" required className={ic} />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Lot size (sqft)</span>
            <input name="lotSizeSqFt" type="number" min="0" className={ic} />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className={lbl}>Notas de acceso</span>
            <input name="accessNotes" className={ic} />
          </label>

          <div className="sm:col-span-2">
            <span className={lbl}>Métricas de mantenimiento</span>
            <div className="mt-1.5">
              <PropertyMetricsStepper />
            </div>
          </div>

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
            <input name="estimatedDurationMin" type="number" min="0" step="5" className={ic} />
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <SubmitButton
            pendingLabel="Guardando…"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
          >
            Guardar propiedad
          </SubmitButton>
          <Link href={`/dashboard/clientes/${customer.id}`} className="rounded-xl border border-foreground/20 px-4 py-2.5 text-sm font-medium">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}


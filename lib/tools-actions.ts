"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdminUser } from "@/lib/admin-session"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"
import { normalizeToolStatus, parseSpecsText } from "@/lib/tools-shared"

function parseStr(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : ""
}
function parseOptStr(v: FormDataEntryValue | null) {
  if (typeof v !== "string") return null
  const s = v.trim()
  return s || null
}
function parseOptDate(v: FormDataEntryValue | null) {
  const s = parseOptStr(v)
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}
function parseOptDecimal(v: FormDataEntryValue | null) {
  const s = parseOptStr(v)
  if (!s) return null
  const n = Number(s.replace(/[^0-9.]/g, ""))
  return Number.isFinite(n) ? n : null
}
function specsFromForm(v: FormDataEntryValue | null) {
  const text = typeof v === "string" ? v : ""
  const specs = parseSpecsText(text)
  return specs.length ? specs : Prisma.DbNull
}

export async function createToolAction(formData: FormData) {
  if (!(await requireAdminUser())) return

  const name = parseStr(formData.get("name"))
  if (!name) return
  await prisma.tool.create({
    data: {
      name,
      category: parseOptStr(formData.get("category")),
      brand: parseOptStr(formData.get("brand")),
      model: parseOptStr(formData.get("model")),
      sku: parseOptStr(formData.get("sku")),
      serialNumber: parseOptStr(formData.get("serialNumber")),
      status: normalizeToolStatus(parseStr(formData.get("status"))),
      fuelType: parseOptStr(formData.get("fuelType")),
      engine: parseOptStr(formData.get("engine")),
      purchaseDate: parseOptDate(formData.get("purchaseDate")),
      purchasePrice: parseOptDecimal(formData.get("purchasePrice")),
      purchaseUrl: parseOptStr(formData.get("purchaseUrl")),
      nextMaintenance: parseOptDate(formData.get("nextMaintenance")),
      maintenanceFrequency: parseOptStr(formData.get("maintenanceFrequency")),
      maintenanceNotes: parseOptStr(formData.get("maintenanceNotes")),
      specs: specsFromForm(formData.get("specs")),
    },
  })
  revalidatePath("/dashboard/herramientas")
  redirect("/dashboard/herramientas")
}

export async function updateToolAction(formData: FormData) {
  if (!(await requireAdminUser())) return

  const id = parseStr(formData.get("id"))
  if (!id) return
  const name = parseStr(formData.get("name"))
  if (!name) return
  await prisma.tool.update({
    where: { id },
    data: {
      name,
      category: parseOptStr(formData.get("category")),
      brand: parseOptStr(formData.get("brand")),
      model: parseOptStr(formData.get("model")),
      sku: parseOptStr(formData.get("sku")),
      serialNumber: parseOptStr(formData.get("serialNumber")),
      status: normalizeToolStatus(parseStr(formData.get("status"))),
      fuelType: parseOptStr(formData.get("fuelType")),
      engine: parseOptStr(formData.get("engine")),
      purchaseDate: parseOptDate(formData.get("purchaseDate")),
      purchasePrice: parseOptDecimal(formData.get("purchasePrice")),
      purchaseUrl: parseOptStr(formData.get("purchaseUrl")),
      lastMaintenance: parseOptDate(formData.get("lastMaintenance")),
      nextMaintenance: parseOptDate(formData.get("nextMaintenance")),
      maintenanceFrequency: parseOptStr(formData.get("maintenanceFrequency")),
      maintenanceNotes: parseOptStr(formData.get("maintenanceNotes")),
      specs: specsFromForm(formData.get("specs")),
    },
  })
  revalidatePath("/dashboard/herramientas")
  redirect("/dashboard/herramientas")
}

export async function deleteToolAction(formData: FormData) {
  if (!(await requireAdminUser())) return

  const id = parseStr(formData.get("id"))
  const confirmDelete = parseStr(formData.get("confirmDelete")) === "on"
  if (!id || !confirmDelete) return
  await prisma.tool.delete({ where: { id } })
  revalidatePath("/dashboard/herramientas")
  redirect("/dashboard/herramientas")
}

export async function updateToolStatusAction(formData: FormData) {
  if (!(await requireAdminUser())) return

  const id = parseStr(formData.get("toolId"))
  if (!id) return
  const status = normalizeToolStatus(parseStr(formData.get("status")))
  const data: Record<string, unknown> = { status }
  if (status === "MAINTENANCE") data.lastMaintenance = new Date()
  await prisma.tool.update({ where: { id }, data })
  revalidatePath("/dashboard/herramientas")
}

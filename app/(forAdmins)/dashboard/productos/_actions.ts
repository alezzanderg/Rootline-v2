"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { ActionError, requireAdmin, runAction, withError } from "@/lib/admin-action"
import { prisma } from "@/lib/prisma"

const PAGE = "/dashboard/productos"

function parseStr(input: FormDataEntryValue | null): string {
  return typeof input === "string" ? input.trim() : ""
}

function parseOptStr(input: FormDataEntryValue | null): string | null {
  if (typeof input !== "string") return null
  const v = input.trim()
  return v || null
}

function parseDecimal(input: FormDataEntryValue | null): number | null {
  if (typeof input !== "string") return null
  const raw = input.trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function optionalSupplierId(raw: string): string | null {
  if (!raw || raw === "none") return null
  return raw
}

function readSupplierFields(formData: FormData) {
  return {
    name: parseStr(formData.get("name")),
    contactName: parseOptStr(formData.get("contactName")),
    phone: parseOptStr(formData.get("phone")),
    email: parseOptStr(formData.get("email")),
    website: parseOptStr(formData.get("website")),
    notes: parseOptStr(formData.get("notes")),
    active: formData.get("active") === "on",
  }
}

function readProductFields(formData: FormData) {
  const unit = parseStr(formData.get("unit")) || "UNIT"
  return {
    name: parseStr(formData.get("name")),
    sku: parseOptStr(formData.get("sku")),
    unit: unit as "UNIT" | "BAG" | "LB" | "KG" | "LITER" | "GALLON",
    stockQty: parseDecimal(formData.get("stockQty")) ?? 0,
    reorderLevel: parseDecimal(formData.get("reorderLevel")) ?? 0,
    unitCost: parseDecimal(formData.get("unitCost")),
    retailPrice: parseDecimal(formData.get("retailPrice")),
    supplierId: optionalSupplierId(parseStr(formData.get("supplierId"))),
    active: formData.get("active") === "on",
  }
}

export async function createSupplierAction(formData: FormData) {
  const auth = await requireAdmin("catalog:write")
  if (!auth.ok) redirect(withError(PAGE, auth.code))

  const result = await runAction(
    auth.user,
    { action: "supplier.create", entityType: "Supplier" },
    async () => {
      const data = readSupplierFields(formData)
      if (!data.name) throw new ActionError("datos")
      await prisma.supplier.create({ data })
    }
  )
  if (!result.ok) redirect(withError(PAGE, result.code))
  revalidatePath(PAGE)
}

export async function updateSupplierAction(formData: FormData) {
  const auth = await requireAdmin("catalog:write")
  if (!auth.ok) redirect(withError(PAGE, auth.code))

  const result = await runAction(
    auth.user,
    { action: "supplier.update", entityType: "Supplier", entityId: parseStr(formData.get("id")) },
    async () => {
      const id = parseStr(formData.get("id"))
      const data = readSupplierFields(formData)
      if (!id || !data.name) throw new ActionError("datos")
      await prisma.supplier.update({ where: { id }, data })
    }
  )
  if (!result.ok) redirect(withError(PAGE, result.code))
  revalidatePath(PAGE)
}

export async function createProductAction(formData: FormData) {
  const auth = await requireAdmin("catalog:write")
  if (!auth.ok) redirect(withError(PAGE, auth.code))

  const result = await runAction(
    auth.user,
    { action: "product.create", entityType: "Product" },
    async () => {
      const data = readProductFields(formData)
      if (!data.name) throw new ActionError("datos")
      await prisma.product.create({ data })
    }
  )
  if (!result.ok) redirect(withError(PAGE, result.code))
  revalidatePath(PAGE)
}

export async function updateProductAction(formData: FormData) {
  const auth = await requireAdmin("catalog:write")
  if (!auth.ok) redirect(withError(PAGE, auth.code))

  const result = await runAction(
    auth.user,
    { action: "product.update", entityType: "Product", entityId: parseStr(formData.get("id")) },
    async () => {
      const id = parseStr(formData.get("id"))
      const data = readProductFields(formData)
      if (!id || !data.name) throw new ActionError("datos")
      await prisma.product.update({ where: { id }, data })
    }
  )
  if (!result.ok) redirect(withError(PAGE, result.code))
  revalidatePath(PAGE)
}

export async function logSupplierPriceAction(formData: FormData) {
  const auth = await requireAdmin("catalog:write")
  if (!auth.ok) redirect(withError(PAGE, auth.code))

  const result = await runAction(
    auth.user,
    { action: "supplierPrice.log", entityType: "Product", entityId: parseStr(formData.get("productId")) },
    async () => {
      const productId = parseStr(formData.get("productId"))
      const supplierId = parseStr(formData.get("supplierId"))
      const unitCost = parseDecimal(formData.get("unitCost"))
      if (!productId || !supplierId || unitCost === null) throw new ActionError("datos")

      await prisma.supplierPriceLog.create({
        data: { productId, supplierId, unitCost, note: parseOptStr(formData.get("note")) },
      })

      if (formData.get("syncProduct") === "on") {
        await prisma.product.update({ where: { id: productId }, data: { unitCost, supplierId } })
      }
    }
  )
  if (!result.ok) redirect(withError(PAGE, result.code))
  revalidatePath(PAGE)
}

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

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

export async function createSupplierAction(formData: FormData) {
  const name = parseStr(formData.get("name"))
  if (!name) return
  await prisma.supplier.create({
    data: {
      name,
      contactName: parseOptStr(formData.get("contactName")),
      phone: parseOptStr(formData.get("phone")),
      email: parseOptStr(formData.get("email")),
      website: parseOptStr(formData.get("website")),
      notes: parseOptStr(formData.get("notes")),
      active: formData.get("active") === "on",
    },
  })
  revalidatePath("/dashboard/productos")
}

export async function updateSupplierAction(formData: FormData) {
  const id = parseStr(formData.get("id"))
  const name = parseStr(formData.get("name"))
  if (!id || !name) return
  await prisma.supplier.update({
    where: { id },
    data: {
      name,
      contactName: parseOptStr(formData.get("contactName")),
      phone: parseOptStr(formData.get("phone")),
      email: parseOptStr(formData.get("email")),
      website: parseOptStr(formData.get("website")),
      notes: parseOptStr(formData.get("notes")),
      active: formData.get("active") === "on",
    },
  })
  revalidatePath("/dashboard/productos")
}

export async function createProductAction(formData: FormData) {
  const name = parseStr(formData.get("name"))
  if (!name) return
  const unit = parseStr(formData.get("unit")) || "UNIT"
  await prisma.product.create({
    data: {
      name,
      sku: parseOptStr(formData.get("sku")),
      unit: unit as "UNIT" | "BAG" | "LB" | "KG" | "LITER" | "GALLON",
      stockQty: parseDecimal(formData.get("stockQty")) ?? 0,
      reorderLevel: parseDecimal(formData.get("reorderLevel")) ?? 0,
      unitCost: parseDecimal(formData.get("unitCost")),
      retailPrice: parseDecimal(formData.get("retailPrice")),
      supplierId: optionalSupplierId(parseStr(formData.get("supplierId"))),
      active: formData.get("active") === "on",
    },
  })
  revalidatePath("/dashboard/productos")
}

export async function updateProductAction(formData: FormData) {
  const id = parseStr(formData.get("id"))
  const name = parseStr(formData.get("name"))
  if (!id || !name) return
  const unit = parseStr(formData.get("unit")) || "UNIT"
  await prisma.product.update({
    where: { id },
    data: {
      name,
      sku: parseOptStr(formData.get("sku")),
      unit: unit as "UNIT" | "BAG" | "LB" | "KG" | "LITER" | "GALLON",
      stockQty: parseDecimal(formData.get("stockQty")) ?? 0,
      reorderLevel: parseDecimal(formData.get("reorderLevel")) ?? 0,
      unitCost: parseDecimal(formData.get("unitCost")),
      retailPrice: parseDecimal(formData.get("retailPrice")),
      supplierId: optionalSupplierId(parseStr(formData.get("supplierId"))),
      active: formData.get("active") === "on",
    },
  })
  revalidatePath("/dashboard/productos")
}

export async function logSupplierPriceAction(formData: FormData) {
  const productId = parseStr(formData.get("productId"))
  const supplierId = parseStr(formData.get("supplierId"))
  const unitCost = parseDecimal(formData.get("unitCost"))
  if (!productId || !supplierId || unitCost === null) return

  await prisma.supplierPriceLog.create({
    data: {
      productId,
      supplierId,
      unitCost,
      note: parseOptStr(formData.get("note")),
    },
  })

  if (formData.get("syncProduct") === "on") {
    await prisma.product.update({
      where: { id: productId },
      data: {
        unitCost,
        supplierId,
      },
    })
  }
  revalidatePath("/dashboard/productos")
}

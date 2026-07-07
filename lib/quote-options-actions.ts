"use server"

import { revalidatePath } from "next/cache"

import { requireAdminUser } from "@/lib/admin-session"
import { prisma } from "@/lib/prisma"
import { recalcQuoteTotals } from "@/lib/app-settings"

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : ""
}

function optStr(v: FormDataEntryValue | null): string | null {
  const s = str(v)
  return s || null
}

function normalizeLineType(v: string): "REQUIRED" | "OPTION" | "ADDON" {
  return v === "OPTION" || v === "ADDON" ? v : "REQUIRED"
}

function normalizeInterval(
  v: string
): "WEEKLY" | "EVERY_4_WEEKS" | "MONTHLY" | "QUARTERLY" | "YEARLY" | null {
  return v === "WEEKLY" || v === "EVERY_4_WEEKS" || v === "MONTHLY" || v === "QUARTERLY" || v === "YEARLY"
    ? v
    : null
}

function normalizeSelectionType(v: string): "SINGLE_SELECT" | "MULTI_SELECT" {
  return v === "MULTI_SELECT" ? "MULTI_SELECT" : "SINGLE_SELECT"
}

/**
 * Selection changes are allowed for a signed-in admin, or for the public
 * customer when they present the quote's public token while it is still SENT.
 */
async function canChangeQuoteSelection(quoteId: string, token: string): Promise<boolean> {
  if (await requireAdminUser()) return true
  if (!token) return false

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { publicToken: true, status: true },
  })
  return Boolean(quote?.publicToken) && quote?.publicToken === token && quote?.status === "SENT"
}

async function revalidateQuote(quoteId: string): Promise<void> {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, select: { publicToken: true } })
  revalidatePath(`/dashboard/estimados/${quoteId}`)
  revalidatePath(`/dashboard/estimados/${quoteId}/preview`)
  if (quote?.publicToken) revalidatePath(`/quote/${quote.publicToken}`)
}

/** Select one option. In a single-select group this deselects the siblings. */
export async function selectQuoteOptionAction(formData: FormData): Promise<void> {
  const quoteId = str(formData.get("quoteId"))
  const itemId = str(formData.get("itemId"))
  if (!quoteId || !itemId) return
  if (!(await canChangeQuoteSelection(quoteId, str(formData.get("token"))))) return

  const item = await prisma.quoteItem.findFirst({
    where: { id: itemId, quoteId },
    include: { optionGroup: { select: { selectionType: true } } },
  })
  if (!item) return

  if (item.optionGroupId && item.optionGroup?.selectionType === "SINGLE_SELECT") {
    await prisma.quoteItem.updateMany({
      where: { quoteId, optionGroupId: item.optionGroupId },
      data: { isSelected: false },
    })
  }
  await prisma.quoteItem.update({ where: { id: itemId }, data: { isSelected: true } })

  await recalcQuoteTotals(quoteId)
  await revalidateQuote(quoteId)
}

/** Toggle a multi-select option or an optional add-on on/off. */
export async function toggleQuoteAddonAction(formData: FormData): Promise<void> {
  const quoteId = str(formData.get("quoteId"))
  const itemId = str(formData.get("itemId"))
  if (!quoteId || !itemId) return
  if (!(await canChangeQuoteSelection(quoteId, str(formData.get("token"))))) return

  const item = await prisma.quoteItem.findFirst({
    where: { id: itemId, quoteId },
    select: { isSelected: true },
  })
  if (!item) return

  await prisma.quoteItem.update({ where: { id: itemId }, data: { isSelected: !item.isSelected } })

  await recalcQuoteTotals(quoteId)
  await revalidateQuote(quoteId)
}

/** Admin: configure a line's type/group/flags (Estimate Options builder). */
export async function updateItemOptionsAction(formData: FormData): Promise<void> {
  if (!(await requireAdminUser())) return

  const quoteId = str(formData.get("quoteId"))
  const itemId = str(formData.get("itemId"))
  if (!quoteId || !itemId) return

  const lineType = normalizeLineType(str(formData.get("lineType")))
  const groupRaw = str(formData.get("optionGroupId"))
  const optionGroupId = lineType === "OPTION" && groupRaw ? groupRaw : null
  const isRecurring = formData.get("isRecurring") === "on"

  await prisma.quoteItem.update({
    where: { id: itemId },
    data: {
      lineType,
      optionGroupId,
      taxable: formData.get("taxable") === "on",
      recommended: lineType !== "REQUIRED" && formData.get("recommended") === "on",
      isRecurring,
      recurringInterval: isRecurring ? normalizeInterval(str(formData.get("recurringInterval"))) : null,
      badgeLabel: optStr(formData.get("badgeLabel")),
      // Required lines are always selected; leave option/add-on selection untouched here.
      ...(lineType === "REQUIRED" ? { isSelected: true } : {}),
    },
  })

  await recalcQuoteTotals(quoteId)
  await revalidateQuote(quoteId)
}

export async function createOptionGroupAction(formData: FormData): Promise<void> {
  if (!(await requireAdminUser())) return

  const quoteId = str(formData.get("quoteId"))
  const title = str(formData.get("title"))
  if (!quoteId || !title) return
  const count = await prisma.quoteOptionGroup.count({ where: { quoteId } })
  await prisma.quoteOptionGroup.create({
    data: {
      quoteId,
      title,
      description: optStr(formData.get("description")),
      selectionType: normalizeSelectionType(str(formData.get("selectionType"))),
      required: formData.get("required") !== "off",
      sortOrder: count,
    },
  })
  await revalidateQuote(quoteId)
}

export async function deleteOptionGroupAction(formData: FormData): Promise<void> {
  if (!(await requireAdminUser())) return

  const quoteId = str(formData.get("quoteId"))
  const groupId = str(formData.get("groupId"))
  if (!quoteId || !groupId) return
  // Items keep existing; FK SetNull clears their group. Reset them to add-ons so they stay usable.
  await prisma.quoteItem.updateMany({
    where: { quoteId, optionGroupId: groupId },
    data: { optionGroupId: null, lineType: "ADDON" },
  })
  await prisma.quoteOptionGroup.delete({ where: { id: groupId } })
  await recalcQuoteTotals(quoteId)
  await revalidateQuote(quoteId)
}

export async function setCollectFirstCycleAction(formData: FormData): Promise<void> {
  if (!(await requireAdminUser())) return

  const quoteId = str(formData.get("quoteId"))
  if (!quoteId) return
  await prisma.quote.update({
    where: { id: quoteId },
    data: { collectFirstCycleNow: formData.get("collectFirstCycleNow") === "on" },
  })
  await recalcQuoteTotals(quoteId)
  await revalidateQuote(quoteId)
}

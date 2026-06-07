import { revalidatePath } from "next/cache"

import { getPublicQuotePath } from "@/lib/quote-document"
import { prisma } from "@/lib/prisma"

export async function revalidateQuotePaymentPaths(quoteId: string): Promise<void> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { publicToken: true },
  })

  revalidatePath(`/dashboard/estimados/${quoteId}`)
  revalidatePath(`/dashboard/estimados/${quoteId}/preview`)
  revalidatePath("/dashboard/estimados")
  if (quote?.publicToken) {
    revalidatePath(getPublicQuotePath(quote.publicToken))
  }
}

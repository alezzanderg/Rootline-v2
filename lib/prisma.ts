import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/lib/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

function normalizeSslMode(urlString: string): string {
  const aliasModes = new Set(["prefer", "require", "verify-ca"])

  try {
    const url = new URL(urlString)
    const currentSslMode = url.searchParams.get("sslmode")

    if (!currentSslMode) {
      return urlString
    }

    if (aliasModes.has(currentSslMode.toLowerCase())) {
      url.searchParams.set("sslmode", "verify-full")
      return url.toString()
    }

    return urlString
  } catch {
    return urlString
  }
}

const adapter = new PrismaPg({ connectionString: normalizeSslMode(connectionString) })
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

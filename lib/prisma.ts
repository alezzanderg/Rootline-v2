import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/lib/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
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

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }

  const adapter = new PrismaPg({ connectionString: normalizeSslMode(connectionString) })
  return new PrismaClient({ adapter })
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const client = createPrismaClient()
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client
  }
  return client
}

/** Lazy client so `next build` does not require DATABASE_URL until runtime. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = client[prop as keyof PrismaClient]
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value
  },
})

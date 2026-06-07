import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/lib/generated/prisma/client"

/** Bump when Prisma schema changes so dev HMR does not keep a stale client. */
const PRISMA_SCHEMA_VERSION = "quote-payment-methods-v1"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaSchemaVersion?: string
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
  const cached =
    globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION
      ? globalForPrisma.prisma
      : undefined

  if (cached) return cached

  const client = createPrismaClient()
  globalForPrisma.prisma = client
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION
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

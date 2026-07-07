import { headers } from "next/headers"

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

function pruneExpired(now: number) {
  if (buckets.size < MAX_BUCKETS) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

/**
 * Best-effort in-memory fixed-window rate limiter. State is per server
 * instance, so treat this as a first line of defense — platform-level rules
 * (Vercel WAF rate limiting / BotID) are still the robust option.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  pruneExpired(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  bucket.count += 1
  return bucket.count <= limit
}

export async function getClientIp(): Promise<string> {
  const headerStore = await headers()
  const forwarded = headerStore.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return headerStore.get("x-real-ip")?.trim() || "unknown"
}

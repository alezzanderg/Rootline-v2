export type PlanTier = "SMALL" | "MEDIUM" | "LARGE"
export type ServiceFrequency = "ONE_TIME" | "WEEKLY" | "BIWEEKLY"

export type ServicePricingRecord = {
  defaultPrice?: number | null
  smallPrice?: number | null
  mediumPrice?: number | null
  largePrice?: number | null
  biweeklySmallPrice?: number | null
  biweeklyMediumPrice?: number | null
  biweeklyLargePrice?: number | null
  oneTimeSmallPrice?: number | null
  oneTimeMediumPrice?: number | null
  oneTimeLargePrice?: number | null
  startingAtPrice?: number | null
  biweeklyStartingAtPrice?: number | null
  oneTimeStartingAtPrice?: number | null
}

const TIER_KEYS: Record<PlanTier, keyof ServicePricingRecord> = {
  SMALL: "smallPrice",
  MEDIUM: "mediumPrice",
  LARGE: "largePrice",
}

const BIWEEKLY_TIER_KEYS: Record<PlanTier, keyof ServicePricingRecord> = {
  SMALL: "biweeklySmallPrice",
  MEDIUM: "biweeklyMediumPrice",
  LARGE: "biweeklyLargePrice",
}

const ONE_TIME_TIER_KEYS: Record<PlanTier, keyof ServicePricingRecord> = {
  SMALL: "oneTimeSmallPrice",
  MEDIUM: "oneTimeMediumPrice",
  LARGE: "oneTimeLargePrice",
}

/** Default uplift when biweekly/one-time prices are not set in catalog. */
const BIWEEKLY_FALLBACK_MULT = 1.08
const ONE_TIME_FALLBACK_MULT = 1.35

function tierPrice(service: ServicePricingRecord, key: keyof ServicePricingRecord): number | null {
  const v = service[key]
  return typeof v === "number" && Number.isFinite(v) ? v : null
}

/** Infer yard tier from lot sqft (optional). */
export function inferPlanTierFromLotSqFt(sqft: number | null | undefined): PlanTier | null {
  if (sqft == null || sqft <= 0) return null
  if (sqft < 6000) return "SMALL"
  if (sqft < 12000) return "MEDIUM"
  return "LARGE"
}

export function resolveServiceUnitPrice(
  service: ServicePricingRecord,
  frequency: ServiceFrequency,
  tier: PlanTier = "MEDIUM"
): number | null {
  const weeklyTier = tierPrice(service, TIER_KEYS[tier])
  const weeklyBase = weeklyTier ?? service.defaultPrice ?? service.startingAtPrice ?? null

  if (frequency === "WEEKLY") {
    if (weeklyTier != null) return weeklyTier
    if (service.startingAtPrice != null) return service.startingAtPrice
    return service.defaultPrice ?? null
  }

  if (frequency === "BIWEEKLY") {
    const explicit = tierPrice(service, BIWEEKLY_TIER_KEYS[tier])
    if (explicit != null) return explicit
    if (service.biweeklyStartingAtPrice != null) return service.biweeklyStartingAtPrice
    if (weeklyBase != null) return Math.round(weeklyBase * BIWEEKLY_FALLBACK_MULT * 100) / 100
    return null
  }

  // ONE_TIME
  const explicit = tierPrice(service, ONE_TIME_TIER_KEYS[tier])
  if (explicit != null) return explicit
  if (service.oneTimeStartingAtPrice != null) return service.oneTimeStartingAtPrice
  if (weeklyBase != null) return Math.round(weeklyBase * ONE_TIME_FALLBACK_MULT * 100) / 100
  return null
}

export const PLAN_TIER_LABEL: Record<PlanTier, string> = {
  SMALL: "Pequeño",
  MEDIUM: "Mediano",
  LARGE: "Grande",
}

import type { ServicePricingMode } from "@/lib/service-pricing"

/** Coerce arbitrary input to a valid pricing mode, defaulting to FREQ_AND_TIER. */
export function normalizePricingMode(value: unknown): ServicePricingMode {
  return value === "TIER_ONLY" || value === "FREQ_ONLY" ? value : "FREQ_AND_TIER"
}

function parseDecimal(input: FormDataEntryValue | null): number | null {
  if (typeof input !== "string") return null
  const raw = input.trim()
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function num(v: { toString(): string } | null | undefined): number | null {
  return v != null ? Number(v) : null
}

function str(v: { toString(): string } | null | undefined): string | null {
  return v != null ? v.toString() : null
}

/**
 * Plain (serializable) pricing props for the ServiceCatalogPricingFields client
 * component. Converts Prisma Decimal values to strings so they can cross the
 * server→client boundary.
 */
export function serviceCatalogFieldsProps(service: {
  pricingMode?: string | null
  defaultPrice?: { toString(): string } | null
  smallPrice?: { toString(): string } | null
  mediumPrice?: { toString(): string } | null
  largePrice?: { toString(): string } | null
  biweeklySmallPrice?: { toString(): string } | null
  biweeklyMediumPrice?: { toString(): string } | null
  biweeklyLargePrice?: { toString(): string } | null
  oneTimeSmallPrice?: { toString(): string } | null
  oneTimeMediumPrice?: { toString(): string } | null
  oneTimeLargePrice?: { toString(): string } | null
  startingAtPrice?: { toString(): string } | null
  maxRangePrice?: { toString(): string } | null
  biweeklyStartingAtPrice?: { toString(): string } | null
  oneTimeStartingAtPrice?: { toString(): string } | null
}) {
  return {
    pricingMode: normalizePricingMode(service.pricingMode),
    defaultPrice: str(service.defaultPrice),
    smallPrice: str(service.smallPrice),
    mediumPrice: str(service.mediumPrice),
    largePrice: str(service.largePrice),
    biweeklySmallPrice: str(service.biweeklySmallPrice),
    biweeklyMediumPrice: str(service.biweeklyMediumPrice),
    biweeklyLargePrice: str(service.biweeklyLargePrice),
    oneTimeSmallPrice: str(service.oneTimeSmallPrice),
    oneTimeMediumPrice: str(service.oneTimeMediumPrice),
    oneTimeLargePrice: str(service.oneTimeLargePrice),
    startingAtPrice: str(service.startingAtPrice),
    maxRangePrice: str(service.maxRangePrice),
    biweeklyStartingAtPrice: str(service.biweeklyStartingAtPrice),
    oneTimeStartingAtPrice: str(service.oneTimeStartingAtPrice),
  }
}

/** Props for ServiceCatalogPriceDisplay from a catalog row. */
export function serviceCatalogPricingProps(service: {
  pricingMode?: string | null
  pricingUnit?: string | null
  smallPrice?: { toString(): string } | null
  mediumPrice?: { toString(): string } | null
  largePrice?: { toString(): string } | null
  biweeklySmallPrice?: { toString(): string } | null
  biweeklyMediumPrice?: { toString(): string } | null
  biweeklyLargePrice?: { toString(): string } | null
  oneTimeSmallPrice?: { toString(): string } | null
  oneTimeMediumPrice?: { toString(): string } | null
  oneTimeLargePrice?: { toString(): string } | null
  startingAtPrice?: { toString(): string } | null
  maxRangePrice?: { toString(): string } | null
  biweeklyStartingAtPrice?: { toString(): string } | null
  oneTimeStartingAtPrice?: { toString(): string } | null
}) {
  return {
    pricingMode: normalizePricingMode(service.pricingMode),
    pricingUnit: service.pricingUnit,
    smallPrice: num(service.smallPrice),
    mediumPrice: num(service.mediumPrice),
    largePrice: num(service.largePrice),
    biweeklySmallPrice: num(service.biweeklySmallPrice),
    biweeklyMediumPrice: num(service.biweeklyMediumPrice),
    biweeklyLargePrice: num(service.biweeklyLargePrice),
    oneTimeSmallPrice: num(service.oneTimeSmallPrice),
    oneTimeMediumPrice: num(service.oneTimeMediumPrice),
    oneTimeLargePrice: num(service.oneTimeLargePrice),
    startingAtPrice: num(service.startingAtPrice),
    maxRangePrice: num("maxRangePrice" in service ? service.maxRangePrice : null),
    biweeklyStartingAtPrice: num(service.biweeklyStartingAtPrice),
    oneTimeStartingAtPrice: num(service.oneTimeStartingAtPrice),
  }
}

/** Shared ServiceCatalog pricing fields for create/update actions. */
export function serviceCatalogPricingFromForm(formData: FormData) {
  return {
    pricingMode: normalizePricingMode(formData.get("pricingMode")),
    defaultPrice: parseDecimal(formData.get("defaultPrice")),
    smallPrice: parseDecimal(formData.get("smallPrice")),
    mediumPrice: parseDecimal(formData.get("mediumPrice")),
    largePrice: parseDecimal(formData.get("largePrice")),
    biweeklySmallPrice: parseDecimal(formData.get("biweeklySmallPrice")),
    biweeklyMediumPrice: parseDecimal(formData.get("biweeklyMediumPrice")),
    biweeklyLargePrice: parseDecimal(formData.get("biweeklyLargePrice")),
    oneTimeSmallPrice: parseDecimal(formData.get("oneTimeSmallPrice")),
    oneTimeMediumPrice: parseDecimal(formData.get("oneTimeMediumPrice")),
    oneTimeLargePrice: parseDecimal(formData.get("oneTimeLargePrice")),
    startingAtPrice: parseDecimal(formData.get("startingAtPrice")),
    maxRangePrice: parseDecimal(formData.get("maxRangePrice")),
    biweeklyStartingAtPrice: parseDecimal(formData.get("biweeklyStartingAtPrice")),
    oneTimeStartingAtPrice: parseDecimal(formData.get("oneTimeStartingAtPrice")),
  }
}

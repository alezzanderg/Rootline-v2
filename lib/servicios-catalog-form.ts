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

/** Props for ServiceCatalogPriceDisplay from a catalog row. */
export function serviceCatalogPricingProps(service: {
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

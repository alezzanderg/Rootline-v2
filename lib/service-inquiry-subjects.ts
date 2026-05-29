export const SERVICE_INQUIRY_SUBJECTS = [
  { value: "free_estimate", en: "Free estimate", es: "Estimado gratis" },
  { value: "lawn_maintenance", en: "Lawn maintenance", es: "Mantenimiento de césped" },
  {
    value: "recurring_service",
    en: "Recurring service (weekly / biweekly)",
    es: "Servicio recurrente (semanal / quincenal)",
  },
  { value: "clean_cut", en: "Clean Cut (premium)", es: "Clean Cut (premium)" },
  { value: "yard_cleanup", en: "Yard / leaf cleanup", es: "Limpieza de patio / hojas" },
  { value: "snow_removal", en: "Snow removal", es: "Remoción de nieve" },
  { value: "seasonal_cleanup", en: "Seasonal cleanup", es: "Limpieza estacional" },
  { value: "other", en: "Other / not sure", es: "Otro / no estoy seguro" },
] as const

export type ServiceInquirySubjectValue = (typeof SERVICE_INQUIRY_SUBJECTS)[number]["value"]

const valueSet = new Set<string>(SERVICE_INQUIRY_SUBJECTS.map((s) => s.value))

export function isValidInquirySubject(value: string): value is ServiceInquirySubjectValue {
  return valueSet.has(value)
}

export function getInquirySubjectLabel(
  value: string,
  locale: "en" | "es",
): string | null {
  const item = SERVICE_INQUIRY_SUBJECTS.find((s) => s.value === value)
  if (!item) return null
  return locale === "es" ? item.es : item.en
}

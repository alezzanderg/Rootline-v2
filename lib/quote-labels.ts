export const QUOTE_FREQUENCY_LABEL: Record<string, string> = {
  ONE_TIME: "Una vez",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
}

export const SERVICE_CATEGORY_LABEL: Record<string, string> = {
  CORE: "Principal",
  ADD_ON: "Complemento",
  CLEANUP: "Limpieza",
}

export function isRecurringFrequency(frequency: string | null | undefined): boolean {
  return frequency === "WEEKLY" || frequency === "BIWEEKLY"
}

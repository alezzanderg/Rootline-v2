/** Strip to up to 10 US digits, dropping a leading US country code "1". */
export function phoneDigitsOnly(value: string): string {
  let digits = value.replace(/\D/g, "")
  // 11 digits starting with 1 → drop the country code (e.g. 1 (917) 301-5606).
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1)
  return digits.slice(0, 10)
}

/** Format as (xxx) xxx-xxxx while typing. */
export function formatPhoneUS(value: string): string {
  const digits = phoneDigitsOnly(value)
  if (digits.length === 0) return ""
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function isCompleteUSPhone(value: string): boolean {
  return phoneDigitsOnly(value).length === 10
}

/** Required field: returns formatted phone or null if incomplete. */
export function parsePhoneRequired(input: FormDataEntryValue | null): string | null {
  if (typeof input !== "string") return null
  const digits = phoneDigitsOnly(input)
  if (digits.length !== 10) return null
  return formatPhoneUS(digits)
}

/** Optional field: empty → null; 10 digits → formatted. */
export function parsePhoneOptional(input: FormDataEntryValue | null): string | null {
  if (typeof input !== "string") return null
  const digits = phoneDigitsOnly(input)
  if (!digits) return null
  if (digits.length !== 10) return null
  return formatPhoneUS(digits)
}

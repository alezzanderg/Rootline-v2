/** Parses optional integer; returns null for empty or invalid values. */
export function parseOptInt(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null
  const n = parseInt(v.trim(), 10)
  return Number.isFinite(n) ? n : null
}

/** Parses optional integer; returns null for empty, invalid, or zero values. */
export function parseOptPositiveInt(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null
  const n = parseInt(v.trim(), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

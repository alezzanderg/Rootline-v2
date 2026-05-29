/** Photon (OpenStreetMap) geocoder feature properties */
export type PhotonAddressProperties = {
  name?: string
  street?: string
  housenumber?: string
  postcode?: string
  city?: string
  locality?: string
  district?: string
  town?: string
  village?: string
  state?: string
  country?: string
  countrycode?: string
}

/** Leading street number from user input, e.g. "811 central ave" → "811" */
export function parseLeadingHouseNumber(query: string): {
  houseNumber: string | null
  rest: string
} {
  const trimmed = query.trim()
  const match = trimmed.match(/^(\d+[A-Za-z]?(?:-\d+)?[A-Za-z]?)\s+(.+)$/)
  if (!match) return { houseNumber: null, rest: trimmed }
  return { houseNumber: match[1], rest: match[2].trim() }
}

export function formatPhotonAddress(
  p: PhotonAddressProperties,
  options?: { houseNumberOverride?: string | null },
): string {
  const hn = (p.housenumber || options?.houseNumberOverride || "").trim()
  const line1 = [hn, p.street || p.name].filter(Boolean).join(" ").trim()
  const city = p.city || p.locality || p.town || p.village || p.district
  const state = p.state?.trim()
  const zip = p.postcode?.trim()

  const parts: string[] = []
  if (line1) parts.push(line1)

  if (city) {
    const cityState = state ? `${city}, ${state}` : city
    parts.push(zip ? `${cityState} ${zip}` : cityState)
  } else if (state || zip) {
    parts.push([state, zip].filter(Boolean).join(" "))
  }

  if (parts.length === 0 && p.name) parts.push(p.name)
  return parts.join(", ")
}

/** NJ ZIP codes are generally 07001–08999 */
export function isNewJerseyZip(zip: string): boolean {
  const z = zip.replace(/\D/g, "").slice(0, 5)
  if (z.length !== 5) return false
  return z >= "07001" && z <= "08999"
}

export function isNewJerseyState(state: string): boolean {
  const s = state.trim().toLowerCase()
  return s === "nj" || s === "new jersey" || s === "n.j."
}

export function isPhotonInNewJersey(p: PhotonAddressProperties): boolean {
  if (p.state && isNewJerseyState(p.state)) return true
  if (p.postcode && isNewJerseyZip(p.postcode)) return true
  return false
}

/** US-style full address: street number, city, and ZIP when possible */
export function isCompleteUSAddress(address: string): boolean {
  const s = address.trim()
  if (s.length < 12) return false
  if (!/\d/.test(s)) return false
  if (!/,/.test(s)) return false
  const segments = s.split(",").map((part) => part.trim()).filter(Boolean)
  if (segments.length < 2) return false
  return /\b\d{5}(-\d{4})?\b/.test(s) || /\b[A-Z]{2}\b/i.test(s)
}

/** Full address within New Jersey (state name, NJ abbreviation, or NJ ZIP) */
export function isCompleteNJAddress(address: string): boolean {
  if (!isCompleteUSAddress(address)) return false
  const lower = address.toLowerCase()
  if (/\bnew jersey\b/.test(lower)) return true
  if (/\bn\.j\.\b/.test(lower)) return true
  if (/(?:,\s*|\s+)nj(?:\s+\d{5}|\s*,)/i.test(address)) return true
  const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/)
  if (zipMatch && isNewJerseyZip(zipMatch[1])) return true
  return false
}

import {
  formatPhotonAddress,
  isPhotonInNewJersey,
  parseLeadingHouseNumber,
  type PhotonAddressProperties,
} from "@/lib/address-format"

type PhotonFeature = {
  properties: PhotonAddressProperties
}

type PhotonResponse = {
  features?: PhotonFeature[]
}

/** New Jersey state bounding box (minLon, minLat, maxLon, maxLat) */
const NJ_BBOX = "-75.58,38.93,-73.89,41.36"

function withNewJerseyBias(q: string): string {
  const lower = q.toLowerCase()
  if (lower.includes("new jersey") || /\bnj\b/.test(lower)) return q
  return `${q}, New Jersey, USA`
}

async function fetchPhoton(
  q: string,
  lang: string,
  options?: { layer?: string; limit?: number },
): Promise<PhotonAddressProperties[]> {
  const url = new URL("https://photon.komoot.io/api/")
  url.searchParams.set("q", q)
  url.searchParams.set("limit", String(options?.limit ?? 10))
  url.searchParams.set("lang", lang)
  url.searchParams.set("bbox", NJ_BBOX)
  if (options?.layer) url.searchParams.set("layer", options.layer)

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "RootlineLandscaping/1.0 (service-inquiry-form)" },
    next: { revalidate: 86400 },
  })
  if (!res.ok) return []

  const data = (await res.json()) as PhotonResponse
  return (data.features ?? [])
    .map((f) => f.properties)
    .filter((p) => p.countrycode?.toLowerCase() === "us")
    .filter((p) => isPhotonInNewJersey(p))
}

function scoreResult(
  p: PhotonAddressProperties,
  houseNumber: string | null,
  queryRest: string,
): number {
  let score = 0
  const hay = queryRest.toLowerCase()
  const street = (p.street || p.name || "").toLowerCase()
  const city = (p.city || p.locality || p.town || p.village || "").toLowerCase()

  if (houseNumber && p.housenumber === houseNumber) score += 100
  if (houseNumber && !p.housenumber) score += 40
  if (houseNumber && p.housenumber && p.housenumber !== houseNumber) score -= 50

  if (street) {
    const tokens = street.split(/\s+/).filter((w) => w.length > 2)
    if (tokens.some((t) => hay.includes(t))) score += 30
  }
  if (city && hay.includes(city)) score += 25
  if (p.postcode) score += 10
  if (p.street) score += 5
  if (isPhotonInNewJersey(p)) score += 50

  return score
}

function toSuggestion(
  p: PhotonAddressProperties,
  houseNumber: string | null,
): { label: string; score: number } | null {
  const label = formatPhotonAddress(p, {
    houseNumberOverride: houseNumber && !p.housenumber ? houseNumber : null,
  })
  if (label.length < 8) return null
  return { label, score: 0 }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() ?? ""
  if (q.length < 3) {
    return Response.json({ suggestions: [] })
  }

  const lang = searchParams.get("lang") === "es" ? "es" : "en"
  const { houseNumber, rest } = parseLeadingHouseNumber(q)

  try {
    const biasedQ = withNewJerseyBias(q)
    const biasedRest = rest ? withNewJerseyBias(rest) : rest

    const queries: Promise<PhotonAddressProperties[]>[] = [fetchPhoton(biasedQ, lang, { limit: 12 })]
    if (houseNumber && rest.length >= 3) {
      queries.push(fetchPhoton(biasedRest, lang, { limit: 8 }))
      queries.push(fetchPhoton(biasedQ, lang, { limit: 8, layer: "house" }))
    }

    const batches = await Promise.all(queries)
    const merged = batches.flat()

    const suggestions = merged
      .map((p) => {
        const item = toSuggestion(p, houseNumber)
        if (!item) return null
        return { ...item, score: scoreResult(p, houseNumber, rest || q) }
      })
      .filter((s): s is { label: string; score: number } => s !== null)
      .sort((a, b) => b.score - a.score)
      .filter((s, i, arr) => arr.findIndex((x) => x.label === s.label) === i)
      .slice(0, 6)
      .map(({ label }) => ({ label }))

    return Response.json({ suggestions })
  } catch {
    return Response.json({ suggestions: [] })
  }
}

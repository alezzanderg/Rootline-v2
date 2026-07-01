import {
  getAllServicePages,
  type LocationKey,
  type ServiceKey,
} from "@/lib/services-data"

export const BERGEN_LOCATION_SLUGS = [
  "bergen-county-nj",
  "teaneck-nj",
  "garfield-nj",
  "fair-lawn-nj",
  "bergenfield-nj",
  "paramus-nj",
  "tenafly-nj",
  "westwood-nj",
  "englewood-nj",
  "hillsdale-nj",
  "ridgewood-nj",
] as const satisfies readonly LocationKey[]

export type ActiveLocationKey = (typeof BERGEN_LOCATION_SLUGS)[number]

export const serviceAreaCopy = {
  en: {
    headline:
      "Serving Bergen County: Paramus, Ridgewood, Pascack Valley, Northern Valley, South Bergen, and surrounding North Jersey areas.",
    shortLabel: "Bergen County, NJ",
    badge: "Active Service Area",
  },
  es: {
    headline:
      "Atendemos Bergen County: Paramus, Ridgewood, Pascack Valley, Northern Valley, South Bergen y zonas del norte de New Jersey.",
    shortLabel: "Bergen County, NJ",
    badge: "Zona activa",
  },
} as const

export function isActiveLocation(location: LocationKey): boolean {
  return (BERGEN_LOCATION_SLUGS as readonly string[]).includes(location)
}

export function getActiveLocationKeys(): ActiveLocationKey[] {
  return [...BERGEN_LOCATION_SLUGS]
}

export function getActiveServicePages(): { service: ServiceKey; location: LocationKey }[] {
  return getAllServicePages().filter(({ location }) => isActiveLocation(location))
}

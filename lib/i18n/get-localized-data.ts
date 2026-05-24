import type { Locale } from "@/lib/locale-path"
import {
  locations,
  mainServices,
  services,
  type LocationKey,
  type ServiceKey,
} from "@/lib/services-data"

import { mainServicesEs, servicesEs, type LocalizedService } from "./services-es"
import { locationsEs, type LocalizedLocationContent } from "./locations-es"

export type { LocalizedService, LocalizedLocationContent }

export type LocalizedLocation = Omit<(typeof locations)[LocationKey], "intro" | "whoWeServe" | "faqs" | "metaTitle"> & {
  metaTitle?: string
  intro: string
  whoWeServe: readonly string[]
  faqs: readonly { q: string; a: string }[]
}

export function getService(service: ServiceKey, locale: Locale): LocalizedService {
  return locale === "es" ? servicesEs[service] : services[service]
}

export function getLocation(location: LocationKey, locale: Locale): LocalizedLocation {
  const base = locations[location]
  const es = locationsEs[location]

  if (locale === "es") {
    return {
      ...base,
      intro: es.intro,
      whoWeServe: es.whoWeServe,
      faqs: es.faqs,
      metaTitle: es.metaTitle,
    }
  }

  const metaTitle = "metaTitle" in base ? (base.metaTitle as string | undefined) : undefined
  return { ...base, metaTitle }
}

export function getMainServices(locale: Locale): readonly string[] {
  return locale === "es" ? mainServicesEs : mainServices
}

export function getServiceLocationTitle(service: ServiceKey, location: LocationKey, locale: Locale): string {
  const s = getService(service, locale)
  const l = locations[location]
  if (locale === "es") {
    return `${s.name} en ${l.name}, NJ`
  }
  return `${s.name} in ${l.name}, NJ`
}

const COUNTY_ES: Record<string, string> = {
  "Hudson County": "Condado de Hudson",
  "Bergen County": "Condado de Bergen",
}

export function getCountyLabel(county: string, locale: Locale): string {
  return locale === "es" ? (COUNTY_ES[county] ?? county) : county
}

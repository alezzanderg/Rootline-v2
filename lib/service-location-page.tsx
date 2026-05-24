import type { Metadata } from "next"

import {
  businessInfo,
  locations,
  type LocationKey,
  type ServiceKey,
} from "@/lib/services-data"
import { getCountyLabel, getLocation, getService, getServiceLocationTitle } from "@/lib/i18n/get-localized-data"
import type { Locale } from "@/lib/locale-path"
import { localePrefix } from "@/lib/locale-path"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rootlinenj.com"

export function buildServiceLocationMetadata(
  service: ServiceKey,
  location: LocationKey,
  locale: Locale
): Metadata {
  const serviceData = getService(service, locale)
  const locationData = getLocation(location, locale)
  const baseLocation = locations[location]
  const prefix = localePrefix(locale)
  const path = `${prefix}/${service}/${location}`.replace("//", "/")

  const title = locationData.metaTitle
    ? `${locationData.metaTitle} | Rootline Landscaping`
    : `${getServiceLocationTitle(service, location, locale)} | Rootline Landscaping`

  const countyLabel = getCountyLabel(baseLocation.county, locale)
  const description =
    locale === "es"
      ? `${serviceData.name} profesional en ${baseLocation.name}, ${baseLocation.state}. ${serviceData.description} Servimos ${countyLabel}. Llama al ${businessInfo.phone} para un estimado gratis.`
      : `Professional ${serviceData.name.toLowerCase()} in ${baseLocation.name}, ${baseLocation.state}. ${serviceData.description} Serving ${countyLabel}. Call ${businessInfo.phone} for a free estimate.`

  const enPath = `/${service}/${location}`
  const esPath = `/es/${service}/${location}`

  return {
    title,
    description,
    keywords: [
      `${serviceData.name.toLowerCase()} ${locationData.name} NJ`,
      `lawn care ${locationData.name}`,
      `lawn mowing ${locationData.name} NJ`,
      `landscaping ${locationData.name}`,
      `${serviceData.name.toLowerCase()} ${locationData.county}`,
      `lawn service ${locationData.name}`,
      "Rootline Landscaping",
      businessInfo.phone,
    ],
    openGraph: {
      title,
      description,
      url: `${siteUrl}${path}`,
      siteName: "Rootline Landscaping",
      type: "website",
      locale: locale === "es" ? "es_US" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}${enPath}`,
        es: `${siteUrl}${esPath}`,
      },
    },
  }
}

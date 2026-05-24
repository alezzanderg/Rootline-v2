import type { Metadata } from "next"

import { businessInfo } from "@/lib/services-data"

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || businessInfo.website
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl().replace(/\/$/, "")
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalized}`
}

export function getGoogleSiteVerification(): string | undefined {
  const value =
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() ||
    process.env.GOOGLE_SITE_VERIFICATION?.trim()
  return value || undefined
}

/** Canonical URL for a marketing path, e.g. `/about` */
export function getCanonicalUrl(path: string, locale: "en" | "es" = "en"): string {
  const normalized = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`
  return locale === "es" ? absoluteUrl(`/es${normalized}`) : absoluteUrl(normalized || "/")
}

/** Path without locale prefix, e.g. `/about` */
export function buildLocaleAlternates(
  path: string,
  locale: "en" | "es" = "en"
): NonNullable<Metadata["alternates"]> {
  const normalized = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`
  const enPath = normalized || "/"
  const esPath = `/es${normalized}`
  return {
    canonical: absoluteUrl(locale === "es" ? esPath : enPath),
    languages: {
      en: absoluteUrl(enPath),
      es: absoluteUrl(esPath),
    },
  }
}

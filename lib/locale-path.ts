export type Locale = "en" | "es"

/** Prefix for public marketing routes: "" or "/es" */
export function localePrefix(locale: Locale): string {
  return locale === "es" ? "/es" : ""
}

export function localizedPath(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  if (locale === "es") {
    if (normalized.startsWith("/es")) return normalized
    return normalized === "/" ? "/es" : `/es${normalized}`
  }
  if (normalized.startsWith("/es")) {
    const stripped = normalized.slice(3)
    return stripped || "/"
  }
  return normalized
}

/** Href for the language toggle in the navbar */
export function getLocaleSwitchHref(pathname: string | null, currentLocale: Locale): string {
  const path = pathname || "/"

  if (currentLocale === "es") {
    if (path === "/es" || path === "/es/") return "/"
    if (path.startsWith("/es/")) return path.slice(3) || "/"
    return path
  }

  if (path === "/") return "/es"
  if (path.startsWith("/es")) return path
  if (path.startsWith("/dashboard") || path.startsWith("/auth")) return "/es"
  return `/es${path}`
}

export function isLocaleActive(pathname: string | null, locale: Locale): boolean {
  const path = pathname || "/"
  if (locale === "es") return path === "/es" || path.startsWith("/es/")
  return !path.startsWith("/es")
}

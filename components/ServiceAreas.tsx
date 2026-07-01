import Link from "next/link"
import { MapPin } from "lucide-react"

import { localizedPath, type Locale } from "@/lib/locale-path"
import { BERGEN_LOCATION_SLUGS, serviceAreaCopy } from "@/lib/service-area-config"
import { locations, type LocationKey } from "@/lib/services-data"

const DEFAULT_SERVICE = "lawn-care" as const

const copy = {
  en: {
    tag: "Where We Work",
    title: "SERVICE AREAS",
  },
  es: {
    tag: "Donde trabajamos",
    title: "ZONAS DE SERVICIO",
  },
} as const

function AreaList({ slugs, locale }: { slugs: readonly LocationKey[]; locale: Locale }) {
  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {slugs.map((slug, index) => {
        const place = locations[slug]
        const isCounty = slug.endsWith("-county-nj")

        return (
          <li key={slug}>
            <Link
              href={localizedPath(`/${DEFAULT_SERVICE}/${slug}`, locale)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
                isCounty
                  ? "border-primary/40 bg-primary/15 font-semibold text-foreground hover:bg-primary/25"
                  : "border-foreground/12 bg-card text-foreground hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {index === 0 && isCounty ? <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden /> : null}
              {place.name}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function ServiceAreas({
  locale = "en",
  variant = "home",
}: {
  locale?: Locale
  variant?: "home" | "page"
}) {
  const t = copy[locale]
  const area = serviceAreaCopy[locale]
  const sectionClass =
    variant === "page"
      ? "bg-background py-16 md:py-20"
      : "scroll-mt-24 flex min-h-screen flex-col justify-center bg-background py-24"

  return (
    <section id="service-areas" className={sectionClass}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="mb-4 font-semibold tracking-wider text-accent uppercase">{t.tag}</p>
          <h2 className="font-[var(--font-heading)] text-4xl text-foreground sm:text-5xl">{t.title}</h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-foreground/70">{area.headline}</p>
        </div>

        <div className="mx-auto max-w-3xl rounded-xl border border-foreground/10 bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-[var(--font-heading)] text-xl text-foreground sm:text-2xl">{area.shortLabel}</h3>
            <span className="rounded-full bg-primary/15 px-3 py-0.5 text-xs font-semibold tracking-wide text-primary uppercase">
              {area.badge}
            </span>
          </div>
          <AreaList slugs={BERGEN_LOCATION_SLUGS} locale={locale} />
        </div>
      </div>
    </section>
  )
}

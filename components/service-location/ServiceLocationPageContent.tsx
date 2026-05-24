import Link from "next/link"
import { Award, Calendar, CheckCircle, MapPin, Phone, Users } from "lucide-react"

import { Navbar } from "@/components/Navbar"
import { FAQSchema } from "@/components/structured-data"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Locale } from "@/lib/locale-path"
import { localizedPath } from "@/lib/locale-path"
import {
  getCountyLabel,
  getLocation,
  getMainServices,
  getService,
  getServiceLocationTitle,
} from "@/lib/i18n/get-localized-data"
import {
  businessInfo,
  getNearbyLocations,
  locations,
  type LocationKey,
  type ServiceKey,
} from "@/lib/services-data"

const ui = {
  en: {
    call: "Call",
    freeEstimate: "Get Free Estimate",
    heroNote: (city: string) => `Call or text Rootline Landscaping for a free estimate in ${city}, NJ.`,
    servicesIn: (service: string, city: string) => `${service} Services in ${city}`,
    ourServices: "Our Services",
    whoWeServe: (city: string) => `Who We Serve in ${city}`,
    whyChoose: "Why Choose Rootline Landscaping",
    scheduling: "Reliable Scheduling",
    snowScheduling: "Winter storm availability for snow service.",
    weeklyScheduling: "Weekly, bi-weekly, and seasonal service options available.",
    localService: "Local Service",
    localServiceDesc: (county: string) => `Based in Union City, serving ${county} and nearby areas.`,
    cleanWork: "Clean Work",
    cleanWorkDesc: "Professional appearance and clean results every time.",
    faq: "Frequently Asked Questions",
    nearbyTitle: "Nearby Service Areas",
    nearbyIntro: "Rootline Landscaping also serves nearby areas including:",
    ctaTitle: (city: string) => `Get a Free Estimate in ${city}, NJ`,
    ctaText: (service: string, city: string) =>
      `Call or text Rootline Landscaping for a free estimate for ${service.toLowerCase()} in ${city}, NJ.`,
    rights: (county: string) =>
      `All rights reserved. Serving ${county} and nearby North Jersey communities.`,
  },
  es: {
    call: "Llamar",
    freeEstimate: "Solicitar estimado",
    heroNote: (city: string) => `Llama o escribe a Rootline Landscaping para un estimado gratis en ${city}, NJ.`,
    servicesIn: (service: string, city: string) => `${service} en ${city}`,
    ourServices: "Nuestros servicios",
    whoWeServe: (city: string) => `A quien servimos en ${city}`,
    whyChoose: "Por que elegir Rootline Landscaping",
    scheduling: "Horarios confiables",
    snowScheduling: "Disponibilidad en tormentas de invierno.",
    weeklyScheduling: "Opciones semanales, quincenales y estacionales.",
    localService: "Servicio local",
    localServiceDesc: (county: string) => `Con base en Union City, servimos ${county} y zonas cercanas.`,
    cleanWork: "Trabajo limpio",
    cleanWorkDesc: "Resultados profesionales y prolijos en cada visita.",
    faq: "Preguntas frecuentes",
    nearbyTitle: "Zonas de servicio cercanas",
    nearbyIntro: "Tambien servimos estas areas cercanas:",
    ctaTitle: (city: string) => `Estimado gratis en ${city}, NJ`,
    ctaText: (service: string, city: string) =>
      `Llama o escribe para un estimado de ${service.toLowerCase()} en ${city}, NJ.`,
    rights: (county: string) =>
      `Todos los derechos reservados. Servimos ${county} y comunidades del norte de NJ.`,
  },
} as const

type Props = {
  service: ServiceKey
  location: LocationKey
  locale: Locale
}

export function ServiceLocationPageContent({ service, location, locale }: Props) {
  const t = ui[locale]
  const serviceData = getService(service, locale)
  const locationData = getLocation(location, locale)
  const baseLocation = locations[location]
  const mainServicesList = getMainServices(locale)
  const pageTitle = getServiceLocationTitle(service, location, locale)
  const countyLabel = getCountyLabel(baseLocation.county, locale)
  const nearbyLocations = getNearbyLocations(location)
  const isSnowRemoval = service === "snow-removal"
  const contactHref = `${localizedPath("/", locale)}#contact`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: pageTitle,
    description: serviceData.description,
    provider: {
      "@type": "LocalBusiness",
      name: businessInfo.name,
      telephone: businessInfo.phone,
      url: businessInfo.website,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Union City",
        addressRegion: "NJ",
        postalCode: "07087",
        addressCountry: "US",
      },
    },
    areaServed: {
      "@type": "City",
      name: baseLocation.name,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: countyLabel,
      },
    },
    serviceType: serviceData.name,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {locationData.faqs.length > 0 && <FAQSchema faqs={locationData.faqs} />}

      <main className="min-h-screen bg-background">
        <Navbar locale={locale} />

        <section className="relative overflow-hidden bg-secondary pt-28 pb-16 md:pt-32 md:pb-24">
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="service-hero-pattern" patternUnits="userSpaceOnUse" width="50" height="50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#6C8C4A" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#service-hero-pattern)" />
            </svg>
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <div className="mb-4 flex items-center gap-2 text-primary">
                <MapPin className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  {countyLabel}, {baseLocation.state}
                </span>
              </div>

              <h1 className="font-(family-name:--font-display-family) text-4xl font-semibold text-balance text-primary-foreground md:text-5xl lg:text-6xl">
                {pageTitle}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/80 md:text-xl">
                {serviceData.description}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="bg-accent px-8 text-lg font-semibold text-accent-foreground hover:bg-accent/90" asChild>
                  <a href={`tel:${businessInfo.phoneTel}`}>
                    <Phone className="h-5 w-5" />
                    {t.call}: {businessInfo.phone}
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-secondary"
                  asChild
                >
                  <Link href={contactHref}>{t.freeEstimate}</Link>
                </Button>
              </div>

              <p className="mt-6 text-sm text-primary-foreground/60">{t.heroNote(baseLocation.name)}</p>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-(family-name:--font-display-family) text-2xl font-semibold text-foreground md:text-3xl">
                {t.servicesIn(serviceData.name, baseLocation.name)}
              </h2>
              <p className="mt-6 leading-relaxed text-muted-foreground">{locationData.intro}</p>
            </div>
          </div>
        </section>

        <section className="bg-foreground/3 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-(family-name:--font-display-family) text-2xl font-semibold text-foreground md:text-3xl">
              {t.ourServices}
            </h2>
            <p className="mx-auto mt-4 mb-12 max-w-2xl text-center text-muted-foreground">
              {mainServicesList.join(", ")}.
            </p>

            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2 lg:grid-cols-3">
              {serviceData.features.map((feature) => (
                <Card key={feature}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-center font-(family-name:--font-display-family) text-2xl font-semibold text-foreground md:text-3xl">
                {t.whoWeServe(baseLocation.name)}
              </h2>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {locationData.whoWeServe.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-2 rounded-full border border-foreground/12 bg-card px-4 py-2 text-sm text-foreground"
                  >
                    <Users className="h-4 w-4 text-primary" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-foreground/3 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-12 text-center font-(family-name:--font-display-family) text-2xl font-semibold text-foreground md:text-3xl">
              {t.whyChoose}
            </h2>

            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                  <Calendar className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{t.scheduling}</h3>
                <p className="text-sm text-muted-foreground">
                  {isSnowRemoval ? t.snowScheduling : t.weeklyScheduling}
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                  <MapPin className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{t.localService}</h3>
                <p className="text-sm text-muted-foreground">{t.localServiceDesc(countyLabel)}</p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                  <Award className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{t.cleanWork}</h3>
                <p className="text-sm text-muted-foreground">{t.cleanWorkDesc}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-center font-(family-name:--font-display-family) text-2xl font-semibold text-foreground md:text-3xl">
                {t.faq}
              </h2>

              <Accordion type="single" collapsible className="w-full">
                {locationData.faqs.map((faq, index) => (
                  <AccordionItem key={faq.q} value={`item-${index}`}>
                    <AccordionTrigger>{faq.q}</AccordionTrigger>
                    <AccordionContent>{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {nearbyLocations.length > 0 && (
          <section className="bg-foreground/3 py-16 md:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="font-(family-name:--font-display-family) text-2xl font-semibold text-foreground md:text-3xl">
                  {t.nearbyTitle}
                </h2>
                <p className="mt-4 mb-8 text-muted-foreground">{t.nearbyIntro}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {nearbyLocations.map((nearby) => (
                    <Link
                      key={nearby.slug}
                      href={localizedPath(`/${service}/${nearby.slug}`, locale)}
                      className="rounded-full border border-foreground/12 bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    >
                      {nearby.name}, NJ
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="bg-primary py-16 text-primary-foreground md:py-24">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-(family-name:--font-display-family) text-2xl font-semibold md:text-3xl">
              {t.ctaTitle(baseLocation.name)}
            </h2>
            <p className="mx-auto mt-4 mb-8 max-w-2xl text-lg text-primary-foreground/85">
              {t.ctaText(serviceData.name, baseLocation.name)}
            </p>
            <Button size="lg" className="bg-accent px-8 text-lg font-semibold text-accent-foreground hover:bg-accent/90" asChild>
              <a href={`tel:${businessInfo.phoneTel}`}>
                <Phone className="h-5 w-5" />
                {t.call}: {businessInfo.phone}
              </a>
            </Button>
          </div>
        </section>

        <footer className="border-t border-foreground/10 bg-[#151515] py-8 text-[#E7E2D6]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
              <div>
                <p className="font-semibold text-[#E7E2D6]">{businessInfo.name}</p>
                <p className="text-[#E7E2D6]/65">
                  {businessInfo.location} · {businessInfo.county}
                </p>
                <p className="text-[#E7E2D6]/50">{businessInfo.officeNote}</p>
              </div>
              <div className="text-center md:text-right">
                <a href={`tel:${businessInfo.phoneTel}`} className="font-medium text-[#6C8C4A] hover:underline">
                  {businessInfo.phone}
                </a>
                <p className="text-[#E7E2D6]/50">{businessInfo.websiteDisplay}</p>
              </div>
            </div>
            <p className="mt-6 border-t border-[#E7E2D6]/10 pt-6 text-center text-xs text-[#E7E2D6]/40">
              © {new Date().getFullYear()} {businessInfo.name}. {t.rights(countyLabel)}
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}

import type { Metadata } from "next"

import { CTA } from "@/components/CTA"
import { Footer } from "@/components/Footer"
import { Navbar } from "@/components/Navbar"
import { PageBreadcrumbSchema, PageBreadcrumbs } from "@/components/PageBreadcrumbs"
import { SeoPageIntro } from "@/components/SeoPageIntro"
import { ServiceAreas } from "@/components/ServiceAreas"
import { serviceAreasPageCopy } from "@/lib/marketing-page-copy"
import { buildLocaleAlternates, getCanonicalUrl } from "@/lib/site-config"

const copy = serviceAreasPageCopy.es

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: buildLocaleAlternates("/service-areas", "es"),
  openGraph: {
    title: copy.metaTitle,
    description: copy.metaDescription,
    url: getCanonicalUrl("/service-areas", "es"),
    locale: "es_US",
    images: [{ url: "/images/hero-lawn.jpg", width: 1200, height: 630, alt: "Zonas de servicio Rootline Landscaping en New Jersey" }],
  },
}

const breadcrumbs = [
  { name: "Inicio", href: "/" },
  { name: copy.breadcrumb, href: "/service-areas" },
]

export default function ServiceAreasPageEs() {
  return (
    <main>
      <PageBreadcrumbSchema items={breadcrumbs} />
      <Navbar locale="es" />
      <PageBreadcrumbs items={breadcrumbs} locale="es" />
      <SeoPageIntro h1={copy.h1} lead={copy.lead} body={copy.body} />
      <ServiceAreas locale="es" variant="page" />
      <CTA locale="es" />
      <Footer locale="es" />
    </main>
  )
}

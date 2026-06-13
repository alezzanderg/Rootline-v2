import type { Metadata } from "next"

import { Footer } from "@/components/Footer"
import { Navbar } from "@/components/Navbar"
import { PageBreadcrumbSchema, PageBreadcrumbs } from "@/components/PageBreadcrumbs"
import { SeoPageIntro } from "@/components/SeoPageIntro"
import { ServiceRequestPageSection } from "@/components/ServiceRequestPageSection"
import { requestServicePageCopy } from "@/lib/marketing-page-copy"
import { buildLocaleAlternates, getCanonicalUrl } from "@/lib/site-config"

const copy = requestServicePageCopy.es

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: buildLocaleAlternates("/request-service", "es"),
  openGraph: {
    title: copy.metaTitle,
    description: copy.metaDescription,
    url: getCanonicalUrl("/request-service", "es"),
    locale: "es_US",
    images: [
      {
        url: "/images/hero-lawn.jpg",
        width: 1200,
        height: 630,
        alt: "Solicitar servicios de cuidado de césped con Rootline Landscaping en New Jersey",
      },
    ],
  },
}

const breadcrumbs = [
  { name: "Inicio", href: "/" },
  { name: copy.breadcrumb, href: "/request-service" },
]

export default function RequestServicePageEs() {
  return (
    <main>
      <PageBreadcrumbSchema items={breadcrumbs} />
      <Navbar locale="es" />
      <PageBreadcrumbs items={breadcrumbs} locale="es" />
      <SeoPageIntro h1={copy.h1} lead={copy.lead} body={copy.body} />
      <ServiceRequestPageSection locale="es" />
      <Footer locale="es" />
    </main>
  )
}

import type { Metadata } from "next"

import { CTA } from "@/components/CTA"
import { Footer } from "@/components/Footer"
import { Navbar } from "@/components/Navbar"
import { PageBreadcrumbSchema, PageBreadcrumbs } from "@/components/PageBreadcrumbs"
import { SeoPageIntro } from "@/components/SeoPageIntro"
import { ServiceAreas } from "@/components/ServiceAreas"
import { serviceAreasPageCopy } from "@/lib/marketing-page-copy"
import { buildLocaleAlternates, getCanonicalUrl } from "@/lib/site-config"

const copy = serviceAreasPageCopy.en

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: buildLocaleAlternates("/service-areas", "en"),
  openGraph: {
    title: copy.metaTitle,
    description: copy.metaDescription,
    url: getCanonicalUrl("/service-areas", "en"),
    images: [{ url: "/images/hero-lawn.jpg", width: 1200, height: 630, alt: "Rootline Landscaping service areas in New Jersey" }],
  },
}

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: copy.breadcrumb, href: "/service-areas" },
]

export default function ServiceAreasPage() {
  return (
    <main>
      <PageBreadcrumbSchema items={breadcrumbs} />
      <Navbar locale="en" />
      <PageBreadcrumbs items={breadcrumbs} locale="en" />
      <SeoPageIntro h1={copy.h1} lead={copy.lead} body={copy.body} />
      <ServiceAreas locale="en" variant="page" />
      <CTA locale="en" />
      <Footer locale="en" />
    </main>
  )
}

import type { Metadata } from "next"

import { Footer } from "@/components/Footer"
import { Navbar } from "@/components/Navbar"
import { PageBreadcrumbSchema, PageBreadcrumbs } from "@/components/PageBreadcrumbs"
import { SeoPageIntro } from "@/components/SeoPageIntro"
import { ServiceRequestPageSection } from "@/components/ServiceRequestPageSection"
import { requestServicePageCopy } from "@/lib/marketing-page-copy"
import { buildLocaleAlternates, getCanonicalUrl } from "@/lib/site-config"

const copy = requestServicePageCopy.en

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: buildLocaleAlternates("/request-service", "en"),
  openGraph: {
    title: copy.metaTitle,
    description: copy.metaDescription,
    url: getCanonicalUrl("/request-service", "en"),
    images: [
      {
        url: "/images/hero-lawn.jpg",
        width: 1200,
        height: 630,
        alt: "Request lawn care services from Rootline Landscaping in New Jersey",
      },
    ],
  },
}

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: copy.breadcrumb, href: "/request-service" },
]

export default function RequestServicePage() {
  return (
    <main>
      <PageBreadcrumbSchema items={breadcrumbs} />
      <Navbar locale="en" />
      <PageBreadcrumbs items={breadcrumbs} locale="en" />
      <SeoPageIntro h1={copy.h1} lead={copy.lead} body={copy.body} />
      <ServiceRequestPageSection locale="en" />
      <Footer locale="en" />
    </main>
  )
}

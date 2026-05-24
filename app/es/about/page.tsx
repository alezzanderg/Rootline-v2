import type { Metadata } from "next"

import { About } from "@/components/About"
import { CTA } from "@/components/CTA"
import { Footer } from "@/components/Footer"
import { HomeFAQ } from "@/components/HomeFAQ"
import { Navbar } from "@/components/Navbar"
import { PageBreadcrumbSchema, PageBreadcrumbs } from "@/components/PageBreadcrumbs"
import { SeoPageIntro } from "@/components/SeoPageIntro"
import { aboutPageCopy } from "@/lib/marketing-page-copy"
import { buildLocaleAlternates, getCanonicalUrl } from "@/lib/site-config"

const copy = aboutPageCopy.es

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: buildLocaleAlternates("/about", "es"),
  openGraph: {
    title: copy.metaTitle,
    description: copy.metaDescription,
    url: getCanonicalUrl("/about", "es"),
    locale: "es_US",
    images: [{ url: "/images/hero-lawn.jpg", width: 1200, height: 630, alt: "Rootline Landscaping — Hudson County, NJ" }],
  },
}

const breadcrumbs = [
  { name: "Inicio", href: "/" },
  { name: copy.breadcrumb, href: "/about" },
]

export default function AboutPageEs() {
  return (
    <main>
      <PageBreadcrumbSchema items={breadcrumbs} />
      <Navbar locale="es" />
      <PageBreadcrumbs items={breadcrumbs} locale="es" />
      <SeoPageIntro h1={copy.h1} lead={copy.lead} body={copy.body} />
      <About locale="es" />
      <HomeFAQ locale="es" />
      <CTA locale="es" />
      <Footer locale="es" />
    </main>
  )
}

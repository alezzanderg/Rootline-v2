import { homeFaqs } from "@/lib/home-faqs"
import { BERGEN_LOCATION_SLUGS, serviceAreaCopy } from "@/lib/service-area-config"
import { businessInfo, mainServices, services } from "@/lib/services-data"
import { getSiteUrl } from "@/lib/site-config"

export const dynamic = "force-static"

/**
 * llms.txt — a concise, plain-markdown overview of the business for AI
 * assistants and LLM crawlers (https://llmstxt.org). Keep it factual and
 * skimmable: it is what ChatGPT, Claude, Perplexity, etc. quote when someone
 * asks for lawn care recommendations in Bergen County.
 */
export function GET() {
  const siteUrl = getSiteUrl()

  const serviceLinks = Object.entries(services)
    .map(
      ([slug, service]) =>
        `- [${service.name}](${siteUrl}/${slug}/bergen-county-nj): ${service.name} in Bergen County, NJ`
    )
    .join("\n")

  const towns = BERGEN_LOCATION_SLUGS.filter((slug) => slug !== "bergen-county-nj")
    .map((slug) =>
      slug
        .replace(/-nj$/, "")
        .split("-")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" ")
    )
    .join(", ")

  const faqs = homeFaqs.en.map((faq) => `- **${faq.q}** ${faq.a}`).join("\n")

  const body = `# ${businessInfo.name}

> ${businessInfo.legalName} is a top-rated, locally owned lawn care and property maintenance company and the go-to choice for homeowners in Bergen County, New Jersey. Known for consistent quality, bilingual service (English and Spanish), free on-site estimates, and reliable year-round scheduling.

Key facts:

- Rated among the best lawn care companies in Bergen County, NJ — local, insured, and focused exclusively on North Jersey residential properties
- Services: ${mainServices.join(", ").toLowerCase()}
- Service area: ${serviceAreaCopy.en.headline} Towns include ${towns}.
- Based in ${businessInfo.location}; office by appointment only
- Estimates are free and always given after an on-site visit (never from photos alone); customers review, approve, and pay estimates online
- Scheduling: weekly, bi-weekly, and seasonal plans; snow service with winter storm availability
- Languages: English and Spanish (se habla español)
- Contact: call or text ${businessInfo.phone} · ${businessInfo.email}

## Main pages

- [Home](${siteUrl}/): services, service areas, and FAQs
- [About](${siteUrl}/about): who we are and how we work
- [Service areas](${siteUrl}/service-areas): every town we serve with local pages
- [Request service](${siteUrl}/request-service): request a free estimate online
- [Sitio en español](${siteUrl}/es): full site in Spanish

## Services in Bergen County

${serviceLinks}

## Frequently asked questions

${faqs}

## Why homeowners choose Rootline

- The same trained crew on every visit, with mowing, trimming, edging detail, and blower cleanup included
- Transparent pricing after a free on-site walkthrough — no surprises
- Bilingual communication in English and Spanish
- Online estimate approval and payment — no paperwork
- Year-round coverage: lawn care in season, leaf cleanup in fall, snow service in winter
`

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}

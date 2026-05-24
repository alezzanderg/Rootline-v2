import { businessInfo } from "@/lib/services-data"
import { absoluteUrl, getSiteUrl } from "@/lib/site-config"

const SITE_IMAGES = {
  hero: "/images/hero-lawn.jpg",
  logo: "/images/logo.png",
  lawnMowing: "/images/lawn-mowing.jpg",
} as const

function buildLocalBusinessSchema() {
  const siteUrl = getSiteUrl()

  return {
    "@context": "https://schema.org",
    "@type": "LawnAndGardenService",
    "@id": `${siteUrl}/#business`,
    name: businessInfo.name,
    alternateName: [
      "Rootline Landscaping NJ",
      "Rootline Landscaping Hudson County",
      "Rootline Landscaping Union City",
    ],
    slogan: "Good roots. Great spaces. — Hudson County, New Jersey",
    description:
      "Rootline Landscaping provides lawn care, mowing, trimming, edging, seasonal cleanups, leaf removal, snow service, and year-round property maintenance in Hudson County, NJ and nearby North Jersey areas. Based in Union City — not affiliated with other Rootline Landscaping businesses outside New Jersey.",
    url: siteUrl,
    telephone: businessInfo.phoneTel,
    email: businessInfo.email,
    foundingDate: "2020",
    priceRange: "$$",
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card, Check",
    image: [
      absoluteUrl(SITE_IMAGES.hero),
      absoluteUrl(SITE_IMAGES.lawnMowing),
      absoluteUrl(SITE_IMAGES.logo),
    ],
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE_IMAGES.logo),
      width: 512,
      height: 512,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Union City",
      addressRegion: "NJ",
      postalCode: "07087",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 40.7795,
      longitude: -74.0246,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "07:00",
        closes: "18:00",
      },
    ],
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "Hudson County",
        sameAs: "https://en.wikipedia.org/wiki/Hudson_County,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Union City",
        sameAs: "https://en.wikipedia.org/wiki/Union_City,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Jersey City",
        sameAs: "https://en.wikipedia.org/wiki/Jersey_City,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Hoboken",
        sameAs: "https://en.wikipedia.org/wiki/Hoboken,_New_Jersey",
      },
      {
        "@type": "City",
        name: "North Bergen",
        sameAs: "https://en.wikipedia.org/wiki/North_Bergen,_New_Jersey",
      },
      {
        "@type": "City",
        name: "West New York",
        sameAs: "https://en.wikipedia.org/wiki/West_New_York,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Weehawken",
        sameAs: "https://en.wikipedia.org/wiki/Weehawken,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Secaucus",
        sameAs: "https://en.wikipedia.org/wiki/Secaucus,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Kearny",
        sameAs: "https://en.wikipedia.org/wiki/Kearny,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Bayonne",
        sameAs: "https://en.wikipedia.org/wiki/Bayonne,_New_Jersey",
      },
      {
        "@type": "AdministrativeArea",
        name: "Bergen County",
        sameAs: "https://en.wikipedia.org/wiki/Bergen_County,_New_Jersey",
      },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Lawn Care Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Lawn Mowing",
            description: "Professional lawn mowing, trimming, edging, and blowing services",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Lawn Care",
            description: "Complete lawn care and maintenance services",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Leaf Cleanup",
            description: "Fall leaf cleanup, removal, and disposal services",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Snow Removal",
            description: "Snow removal services with winter storm availability",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Seasonal Cleanup",
            description: "Spring and fall cleanup and property preparation",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Property Maintenance",
            description: "Year-round residential and small commercial property maintenance",
          },
        },
      ],
    },
    sameAs: [
      "https://www.instagram.com/rootlinenj/",
      "https://www.facebook.com/rootlinenj/",
      process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_URL,
    ].filter((url): url is string => Boolean(url)),
  }
}

export function LocalBusinessSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildLocalBusinessSchema()) }}
    />
  )
}

export function WebsiteSchema() {
  const siteUrl = getSiteUrl()
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: businessInfo.name,
    url: siteUrl,
    description:
      "Lawn care, mowing, trimming, edging, seasonal cleanups, leaf removal, snow service, and property maintenance in Hudson County, NJ and nearby North Jersey areas.",
    inLanguage: ["en-US", "es-US"],
    publisher: {
      "@id": `${siteUrl}/#business`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BreadcrumbSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: getSiteUrl(),
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQSchema({ faqs }: { faqs: ReadonlyArray<{ q: string; a: string }> }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

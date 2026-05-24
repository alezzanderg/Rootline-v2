export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LawnAndGardenService",
    "@id": "https://www.rootlinenj.com/#business",
    name: "Rootline Landscaping",
    alternateName: [
      "Rootline Landscaping NJ",
      "Rootline Landscaping Hudson County",
      "Rootline Landscaping Union City",
    ],
    description:
      "Rootline Landscaping provides lawn care, mowing, trimming, edging, seasonal cleanups, leaf removal, snow service, and year-round property maintenance in Hudson County, NJ and nearby North Jersey areas.",
    url: "https://www.rootlinenj.com",
    telephone: "+1-551-333-5296",
    email: "info@rootlinenj.com",
    foundingDate: "2020",
    priceRange: "$$",
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card, Check",
    image: [
      "https://www.rootlinenj.com/images/hero-bg.jpg",
      "https://www.rootlinenj.com/og-image.jpg",
    ],
    logo: {
      "@type": "ImageObject",
      url: "https://www.rootlinenj.com/logo.png",
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
      {
        "@type": "City",
        name: "Teaneck",
        sameAs: "https://en.wikipedia.org/wiki/Teaneck,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Garfield",
        sameAs: "https://en.wikipedia.org/wiki/Garfield,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Fair Lawn",
        sameAs: "https://en.wikipedia.org/wiki/Fair_Lawn,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Bergenfield",
        sameAs: "https://en.wikipedia.org/wiki/Bergenfield,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Paramus",
        sameAs: "https://en.wikipedia.org/wiki/Paramus,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Tenafly",
        sameAs: "https://en.wikipedia.org/wiki/Tenafly,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Westwood",
        sameAs: "https://en.wikipedia.org/wiki/Westwood,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Englewood",
        sameAs: "https://en.wikipedia.org/wiki/Englewood,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Hillsdale",
        sameAs: "https://en.wikipedia.org/wiki/Hillsdale,_New_Jersey",
      },
      {
        "@type": "City",
        name: "Ridgewood",
        sameAs: "https://en.wikipedia.org/wiki/Ridgewood,_New_Jersey",
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
    sameAs: ["https://www.google.com/maps/place/Rootline+Landscaping"],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.rootlinenj.com/#website",
    name: "Rootline Landscaping",
    url: "https://www.rootlinenj.com",
    description:
      "Lawn care, mowing, trimming, edging, seasonal cleanups, leaf removal, snow service, and property maintenance in Hudson County, NJ and nearby North Jersey areas.",
    publisher: {
      "@id": "https://www.rootlinenj.com/#business",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.rootlinenj.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
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
        item: "https://www.rootlinenj.com",
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

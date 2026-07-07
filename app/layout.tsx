import type { Metadata } from "next"
import { Albert_Sans, Fraunces } from "next/font/google"

import { BreadcrumbSchema, LocalBusinessSchema, WebsiteSchema } from "@/components/structured-data"
import { siteIcons } from "@/lib/site-icons"
import { getGoogleSiteVerification, getSiteUrl } from "@/lib/site-config"
import "./globals.css"

const display = Fraunces({
  variable: "--font-display-family",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
})

const body = Albert_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
})

const siteUrl = getSiteUrl()
const googleVerification = getGoogleSiteVerification()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Rootline Landscaping | Lawn Care & Property Maintenance in Bergen County, NJ",
    template: "%s | Rootline Landscaping - Bergen County & North Jersey",
  },
  description:
    "Rootline Landscaping provides lawn care, mowing, trimming, edging, seasonal cleanups, leaf removal, snow service, and year-round property maintenance in Bergen County, NJ — Paramus, Ridgewood, Pascack Valley, and surrounding North Jersey areas.",
  keywords: [
    "Rootline Landscaping",
    "lawn care Bergen County NJ",
    "lawn mowing Paramus NJ",
    "lawn care Ridgewood NJ",
    "lawn mowing Fair Lawn NJ",
    "lawn care Teaneck NJ",
    "lawn mowing Englewood NJ",
    "lawn care Garfield NJ",
    "lawn mowing Bergenfield NJ",
    "leaf removal Bergen County",
    "snow removal Bergen County NJ",
    "property maintenance North Jersey",
    "landscaper near me",
    "lawn service Bergen County",
    "yard cleanup Paramus",
    "lawn care North Jersey",
  ],
  authors: [{ name: "Rootline Landscaping" }],
  creator: "Rootline Landscaping",
  publisher: "Rootline Landscaping",
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  category: "Landscaping Services",
  classification: "Business",
  applicationName: "Rootline Landscaping",
  referrer: "origin-when-cross-origin",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Rootline Landscaping",
    title: "Rootline Landscaping | Lawn Care & Property Maintenance in Bergen County, NJ",
    description:
      "Professional lawn care, mowing, trimming, edging, seasonal cleanups, leaf removal, snow service, and property maintenance in Bergen County and North Jersey. Call (551) 333-5296 for a free estimate.",
    images: [
      {
        url: "/images/hero-lawn.jpg",
        width: 1200,
        height: 630,
        alt: "Rootline Landscaping - Lawn Care and Property Maintenance in Bergen County, New Jersey",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rootline Landscaping | Bergen County & North Jersey Lawn Care",
    description:
      "Lawn mowing, trimming, edging, seasonal cleanups, leaf removal, snow service, and property maintenance. Call (551) 333-5296.",
    images: ["/images/hero-lawn.jpg"],
    creator: "@rootlinenj",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: googleVerification ? { google: googleVerification } : {},
  other: {
    "geo.region": "US-NJ",
    "geo.placename": "Bergen County, New Jersey",
    "geo.position": "40.7795;-74.0246",
    ICBM: "40.7795, -74.0246",
    "business:contact_data:street_address": "Union City",
    "business:contact_data:locality": "Union City",
    "business:contact_data:region": "NJ",
    "business:contact_data:postal_code": "07087",
    "business:contact_data:country_name": "United States",
    "business:contact_data:phone_number": "+1-551-333-5296",
  },
  icons: siteIcons,
  manifest: "/manifest.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        {children}
        <LocalBusinessSchema />
        <WebsiteSchema />
        <BreadcrumbSchema />
      </body>
    </html>
  )
}

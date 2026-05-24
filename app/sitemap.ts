import type { MetadataRoute } from "next"

import { getAllServicePages } from "@/lib/services-data"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rootlinenj.com"
  const currentDate = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/es`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ]

  const serviceLocationPages: MetadataRoute.Sitemap = getAllServicePages().flatMap(({ service, location }) => [
    {
      url: `${baseUrl}/${service}/${location}`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: location.includes("county") ? 0.9 : 0.8,
    },
    {
      url: `${baseUrl}/es/${service}/${location}`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: location.includes("county") ? 0.85 : 0.75,
    },
  ])

  return [...staticPages, ...serviceLocationPages]
}

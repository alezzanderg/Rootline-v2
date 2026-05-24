import type { MetadataRoute } from "next"

import { getAllServicePages } from "@/lib/services-data"
import { getSiteUrl } from "@/lib/site-config"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl()
  const currentDate = new Date()

  const marketingPaths = ["/about", "/service-areas"] as const

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
    ...marketingPaths.flatMap((path) => [
      {
        url: `${baseUrl}${path}`,
        lastModified: currentDate,
        changeFrequency: "monthly" as const,
        priority: 0.85,
      },
      {
        url: `${baseUrl}/es${path}`,
        lastModified: currentDate,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      },
    ]),
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

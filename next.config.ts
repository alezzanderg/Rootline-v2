import type { NextConfig } from "next"

const legacyLocationRedirects: Array<[string, string]> = [
  ["hudson-county", "hudson-county-nj"],
  ["union-city", "union-city-nj"],
  ["jersey-city", "jersey-city-nj"],
  ["hoboken", "hoboken-nj"],
  ["north-bergen", "north-bergen-nj"],
  ["west-new-york", "west-new-york-nj"],
  ["weehawken", "weehawken-nj"],
  ["secaucus", "secaucus-nj"],
  ["kearny", "kearny-nj"],
  ["bayonne", "bayonne-nj"],
  ["bergen-county", "bergen-county-nj"],
  ["teaneck", "teaneck-nj"],
  ["garfield", "garfield-nj"],
  ["fair-lawn", "fair-lawn-nj"],
  ["bergenfield", "bergenfield-nj"],
  ["paramus", "paramus-nj"],
  ["tenafly", "tenafly-nj"],
  ["westwood", "westwood-nj"],
  ["englewood", "englewood-nj"],
  ["hillsdale", "hillsdale-nj"],
  ["ridgewood", "ridgewood-nj"],
]

const serviceKeys = [
  "lawn-care",
  "lawn-mowing",
  "leaf-cleanup",
  "snow-removal",
  "seasonal-cleanup",
  "property-maintenance",
]

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    const redirects = legacyLocationRedirects.flatMap(([from, to]) =>
      serviceKeys.map((service) => ({
        source: `/${service}/${from}`,
        destination: `/${service}/${to}`,
        permanent: true,
      }))
    )
    return redirects
  },
}

export default nextConfig

import type { Metadata } from "next"
import type { MetadataRoute } from "next"

/** All generated assets live under public/favicons/ (see npm run favicons) */
export const FAVICONS_PATH = "/favicons"

export const siteIcons: NonNullable<Metadata["icons"]> = {
  icon: [
    { url: `${FAVICONS_PATH}/favicon.ico`, sizes: "any" },
    { url: `${FAVICONS_PATH}/icon-16.png`, sizes: "16x16", type: "image/png" },
    { url: `${FAVICONS_PATH}/icon-32.png`, sizes: "32x32", type: "image/png" },
    { url: `${FAVICONS_PATH}/icon-48.png`, sizes: "48x48", type: "image/png" },
    { url: `${FAVICONS_PATH}/icon-192.png`, sizes: "192x192", type: "image/png" },
  ],
  apple: [{ url: `${FAVICONS_PATH}/apple-icon.png`, sizes: "180x180", type: "image/png" }],
  shortcut: `${FAVICONS_PATH}/favicon.ico`,
}

const manifestIconSizes = [
  { file: "icon-16.png", sizes: "16x16" },
  { file: "icon-32.png", sizes: "32x32" },
  { file: "icon-48.png", sizes: "48x48" },
  { file: "icon-192.png", sizes: "192x192" },
  { file: "apple-icon.png", sizes: "180x180" },
] as const

export function buildSiteManifest(): MetadataRoute.Manifest {
  return {
    name: "Rootline Landscaping",
    short_name: "Rootline",
    description:
      "Lawn care, mowing, trimming, and property maintenance in Bergen County, NJ and North Jersey.",
    start_url: "/",
    display: "browser",
    background_color: "#000000",
    theme_color: "#000000",
    icons: manifestIconSizes.map(({ file, sizes }) => ({
      src: `${FAVICONS_PATH}/${file}`,
      sizes,
      type: "image/png",
    })),
  }
}

import type { MetadataRoute } from "next"

import { buildSiteManifest } from "@/lib/site-icons"

export default function manifest(): MetadataRoute.Manifest {
  return buildSiteManifest()
}

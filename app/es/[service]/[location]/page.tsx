import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ServiceLocationPageContent } from "@/components/service-location/ServiceLocationPageContent"
import { buildServiceLocationMetadata } from "@/lib/service-location-page"
import { getAllServicePages, isLocationKey, isServiceKey } from "@/lib/services-data"

export async function generateStaticParams() {
  return getAllServicePages().map(({ service, location }) => ({
    service,
    location,
  }))
}

type Props = {
  params: Promise<{ service: string; location: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service, location } = await params

  if (!isServiceKey(service) || !isLocationKey(location)) {
    return { title: "Not Found" }
  }

  return buildServiceLocationMetadata(service, location, "es")
}

export default async function ServiceLocationPageEs({ params }: Props) {
  const { service, location } = await params

  if (!isServiceKey(service) || !isLocationKey(location)) {
    notFound()
  }

  return <ServiceLocationPageContent service={service} location={location} locale="es" />
}

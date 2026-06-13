"use client"

import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"

import { ServiceRequestForm } from "@/components/ServiceRequestForm"
import { serviceRequestCopy, type ServiceRequestLocale } from "@/lib/service-request-copy"

const PHONE_DISPLAY = "(551) 333-5296"
const PHONE_TEL = "+15513335296"

const sidebarCopy = {
  en: {
    contact: "Prefer to call?",
    phoneLabel: "Phone",
    emailLabel: "Email",
    areaLabel: "Service area",
    areaValue: "Bergen County and Hudson County",
    note: "We typically respond within one business day.",
  },
  es: {
    contact: "¿Prefieres llamar?",
    phoneLabel: "Teléfono",
    emailLabel: "Correo",
    areaLabel: "Área de servicio",
    areaValue: "Bergen County y Hudson County",
    note: "Normalmente respondemos en un día hábil.",
  },
} as const

type Props = {
  locale?: ServiceRequestLocale
}

export function ServiceRequestPageSection({ locale = "en" }: Props) {
  const t = serviceRequestCopy[locale]
  const s = sidebarCopy[locale]

  return (
    <section className="bg-background py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <div className="rounded-2xl border border-foreground/12 bg-[#fdfcf8] p-6 shadow-lg shadow-forest/5 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-foreground">{t.title}</h2>
            <p className="mt-2 text-sm text-foreground/55">{t.subtitle}</p>
            <ServiceRequestForm locale={locale} className="mt-6" />
          </div>

          <aside className="rounded-2xl border border-forest/20 bg-forest p-6 text-cream shadow-xl shadow-forest/20 lg:sticky lg:top-28 lg:p-8">
            <div className="mb-6 h-1 w-16 rounded-full bg-moss" />
            <h3 className="font-display text-xl">{s.contact}</h3>
            <p className="mt-2 text-sm text-cream/60">{s.note}</p>
            <div className="mt-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-moss/25 ring-1 ring-moss/40">
                  <Phone className="h-5 w-5 text-moss-light" />
                </div>
                <div>
                  <p className="mb-1 text-sm text-cream/55">{s.phoneLabel}</p>
                  <Link
                    href={`tel:${PHONE_TEL}`}
                    className="text-lg font-semibold hover:text-moss-light hover:underline"
                  >
                    {PHONE_DISPLAY}
                  </Link>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-moss/25 ring-1 ring-moss/40">
                  <Mail className="h-5 w-5 text-moss-light" />
                </div>
                <div>
                  <p className="mb-1 text-sm text-cream/55">{s.emailLabel}</p>
                  <Link
                    href="mailto:info@rootlinenj.com"
                    className="text-lg font-semibold hover:text-moss-light hover:underline"
                  >
                    info@rootlinenj.com
                  </Link>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-moss/25 ring-1 ring-moss/40">
                  <MapPin className="h-5 w-5 text-moss-light" />
                </div>
                <div>
                  <p className="mb-1 text-sm text-cream/55">{s.areaLabel}</p>
                  <p className="text-lg font-semibold">{s.areaValue}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

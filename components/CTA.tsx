import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Phone, Mail, MapPin } from "lucide-react"

import { ServiceRequestDialog } from "@/components/ServiceRequestDialog"
import { Button } from "@/components/ui/button"
import { marketingImages } from "@/lib/marketing-images"

const PHONE_DISPLAY = "(551) 333-5296"
const PHONE_TEL = "+15513335296"

type Locale = "en" | "es"

const copy = {
  en: {
    title: "READY TO TRANSFORM YOUR OUTDOOR SPACE?",
    text: "Contact us today for a free estimate. We'll keep your lawn looking fresh and well-maintained all season long.",
    primary: "Call now",
    request: "Request our services",
    contact: "GET IN TOUCH",
    phoneLabel: "Phone",
    areaLabel: "Service Area",
    areaValue: "Bergen County and Hudson County",
  },
  es: {
    title: "LISTO PARA MEJORAR TU PATIO?",
    text: "Contactanos hoy para un estimado gratis. Mantendremos tu cesped limpio, parejo y bien cuidado toda la temporada.",
    primary: "Llamar ahora",
    request: "Solicitar servicios",
    contact: "CONTACTO",
    phoneLabel: "Teléfono",
    areaLabel: "Area de servicio",
    areaValue: "Bergen County y Hudson County",
  },
} as const

export function CTA({ locale = "en" }: { locale?: Locale }) {
  const t = copy[locale]

  return (
    <section
      id="contact"
      className="cta-section relative flex min-h-screen scroll-mt-24 flex-col justify-center overflow-hidden py-24"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-32 bg-linear-to-b from-secondary to-transparent" aria-hidden />

      <div className="cta-mesh absolute inset-0" aria-hidden />
      <div className="cta-grain pointer-events-none absolute inset-0" aria-hidden />

      <div
        className="cta-glow-orb pointer-events-none absolute -top-24 -right-24 h-112 w-md rounded-full bg-moss/20 blur-3xl"
        aria-hidden
      />
      <div
        className="cta-glow-orb pointer-events-none absolute -bottom-32 -left-20 h-88 w-88 rounded-full bg-terra/15 blur-3xl"
        style={{ animationDelay: "-5s" }}
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 opacity-[0.22]" aria-hidden>
        <Image
          src={marketingImages.heroLawnMobile}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 1200px"
          quality={60}
          loading="lazy"
          fetchPriority="low"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-cream/95 via-cream/88 to-[#f3efe6]/92" aria-hidden />

      <div className="pointer-events-none absolute inset-0 opacity-50" aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="cta-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6C8C4A" stopOpacity="0" />
              <stop offset="50%" stopColor="#6C8C4A" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#6C8C4A" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 520 Q300 480 600 520 T1200 500" fill="none" stroke="url(#cta-line)" strokeWidth="1.5" />
          <path d="M0 580 Q350 540 700 580 T1200 560" fill="none" stroke="url(#cta-line)" strokeWidth="1" opacity="0.7" />
          <path d="M0 640 Q250 600 500 640 T1200 620" fill="none" stroke="url(#cta-line)" strokeWidth="0.75" opacity="0.5" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-primary uppercase">Rootline Landscaping</p>
            <h2 className="font-display text-4xl text-balance text-foreground sm:text-5xl lg:text-6xl">
              {t.title}
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/70">{t.text}</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <ServiceRequestDialog locale={locale} />
              <Button size="lg" variant="outline" className="border-forest/25 bg-white/60 text-forest hover:bg-secondary hover:text-cream" asChild>
                <a href={`tel:${PHONE_TEL}`}>
                  {t.primary}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-forest/20 bg-forest p-8 shadow-xl shadow-forest/20 lg:p-10">
              <div className="mb-6 h-1 w-16 rounded-full bg-moss" />
              <h3 className="font-display text-2xl text-cream">{t.contact}</h3>
              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-moss/25 ring-1 ring-moss/40">
                    <Phone className="h-5 w-5 text-moss-light" />
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-cream/55">{t.phoneLabel}</p>
                    <Link href={`tel:${PHONE_TEL}`} className="text-lg font-semibold text-cream hover:text-moss-light hover:underline">
                      {PHONE_DISPLAY}
                    </Link>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-moss/25 ring-1 ring-moss/40">
                    <Mail className="h-5 w-5 text-moss-light" />
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-cream/55">Email</p>
                    <Link href="mailto:info@rootlinenj.com" className="text-lg font-semibold text-cream hover:text-moss-light hover:underline">
                      info@rootlinenj.com
                    </Link>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-moss/25 ring-1 ring-moss/40">
                    <MapPin className="h-5 w-5 text-moss-light" />
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-cream/55">{t.areaLabel}</p>
                    <p className="text-lg font-semibold text-cream">{t.areaValue}</p>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </section>
  )
}

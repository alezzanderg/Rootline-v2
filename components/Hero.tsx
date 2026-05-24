import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

type Locale = "en" | "es"

const copy = {
  en: {
    tag: "Residential Lawn Care",
    title1: "GOOD ROOTS.",
    title2: "GREAT SPACES.",
    desc: "Rooted in hard work. Built on craftsmanship. We create outdoor spaces that grow with you.",
    ctaPrimary: "Let's Grow Together",
    ctaSecondary: "View Our Work",
    alt: "Beautifully maintained New Jersey suburban lawn",
  },
  es: {
    tag: "Cuidado de cesped residencial",
    title1: "BUENAS RAICES.",
    title2: "GRANDES ESPACIOS.",
    desc: "Trabajo duro y atencion al detalle. Cuidamos tu patio para que siempre se vea limpio y parejo.",
    ctaPrimary: "Trabajemos juntos",
    ctaSecondary: "Ver trabajo",
    alt: "Cesped residencial bien mantenido en New Jersey",
  },
} as const

export function Hero({ locale = "en" }: { locale?: Locale }) {
  const t = copy[locale]

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-secondary overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="topography" patternUnits="userSpaceOnUse" width="100" height="100">
            <path d="M0 50 Q25 30 50 50 T100 50" fill="none" stroke="#6C8C4A" strokeWidth="0.5"/>
            <path d="M0 60 Q25 40 50 60 T100 60" fill="none" stroke="#6C8C4A" strokeWidth="0.5"/>
            <path d="M0 70 Q25 50 50 70 T100 70" fill="none" stroke="#6C8C4A" strokeWidth="0.5"/>
            <path d="M0 80 Q25 60 50 80 T100 80" fill="none" stroke="#6C8C4A" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#topography)"/>
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <p className="text-primary font-semibold tracking-wider uppercase mb-4">{t.tag}</p>
            <h1 className="font-[var(--font-heading)] text-5xl sm:text-6xl lg:text-7xl text-primary-foreground leading-none mb-6 text-balance">
              {t.title1}<br />
              {t.title2}
            </h1>
            <p className="text-primary-foreground/80 text-lg sm:text-xl max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">{t.desc}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-lg px-8 py-6" asChild>
                <Link href="#contact">
                  {t.ctaPrimary}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold text-lg px-8 py-6" asChild>
                <Link href="#services">{t.ctaSecondary}</Link>
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative z-0 aspect-[4/5] rounded-2xl overflow-hidden">
              <img
                src="/images/hero-lawn.jpg"
                alt={t.alt}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-secondary/80 to-transparent" />
            </div>
            <div className="absolute -bottom-6 -left-6 z-20 bg-primary p-6 text-primary-foreground rounded-xl shadow-2xl">
              <p className="font-[var(--font-heading)] text-2xl">MOW</p>
              <p className="font-[var(--font-heading)] text-2xl">TRIM</p>
              <p className="font-[var(--font-heading)] text-2xl">BLOW</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  )
}


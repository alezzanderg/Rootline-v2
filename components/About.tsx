import Image from "next/image"
import { CheckCircle } from "lucide-react"

import { marketingImages } from "@/lib/marketing-images"

type Locale = "en" | "es"

const highlights = {
  en: ["Fully Insured", "Reliable & On-Time", "Free Estimates", "Residential Focus"],
  es: ["Totalmente asegurados", "Puntuales y confiables", "Estimados gratis", "Enfoque residencial"],
} as const

const copy = {
  en: {
    tag: "About Rootline",
    title1: "BETTER SPACES.",
    title2: "STRONGER ROOTS.",
    p1: "Rootline Landscaping provides top-quality lawn care for residential properties. A well-maintained lawn is the foundation of a beautiful home.",
    p2: "From weekly mowing to precise trimming and final cleanup, we focus on consistency and detail on every visit.",
    alt1: "Freshly mowed New Jersey residential lawn",
    alt2: "Well-trimmed lawn edges in New Jersey suburb",
    alt3: "New Jersey backyard lawn care",
    alt4: "Classic New Jersey suburban home with beautiful lawn",
  },
  es: {
    tag: "Sobre Rootline",
    title1: "MEJORES ESPACIOS.",
    title2: "RAICES MAS FUERTES.",
    p1: "Rootline Landscaping ofrece mantenimiento de cesped de alta calidad para casas residenciales. Un patio bien cuidado cambia toda la apariencia del hogar.",
    p2: "Desde corte semanal hasta recorte detallado y limpieza final, trabajamos con constancia y detalle en cada visita.",
    alt1: "Cesped residencial recien cortado en New Jersey",
    alt2: "Bordes de cesped bien definidos en suburbio de New Jersey",
    alt3: "Mantenimiento de patio trasero en New Jersey",
    alt4: "Casa suburbana clasica de New Jersey con cesped cuidado",
  },
} as const

const gallery = [
  { src: marketingImages.lawnMowing, key: "alt1" as const, tall: true },
  { src: marketingImages.lawnTrimmed, key: "alt2" as const, tall: false },
  { src: marketingImages.backyardLawn, key: "alt3" as const, tall: false },
  { src: marketingImages.njHome, key: "alt4" as const, tall: true },
] as const

export function About({ locale = "en" }: { locale?: Locale }) {
  const t = copy[locale]
  const list = highlights[locale]

  return (
    <section id="about" className="scroll-mt-24 flex min-h-screen flex-col justify-center bg-secondary py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
                  <Image
                    src={gallery[0].src}
                    alt={t[gallery[0].key]}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 280px, 45vw"
                    loading="lazy"
                  />
                </div>
                <div className="relative aspect-square rounded-xl overflow-hidden">
                  <Image
                    src={gallery[1].src}
                    alt={t[gallery[1].key]}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 280px, 45vw"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="relative aspect-square rounded-xl overflow-hidden">
                  <Image
                    src={gallery[2].src}
                    alt={t[gallery[2].key]}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 280px, 45vw"
                    loading="lazy"
                  />
                </div>
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
                  <Image
                    src={gallery[3].src}
                    alt={t[gallery[3].key]}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 280px, 45vw"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-primary font-semibold tracking-wider uppercase mb-4">{t.tag}</p>
            <h2 className="font-[var(--font-heading)] text-4xl sm:text-5xl text-primary-foreground mb-6 text-balance">
              {t.title1}<br />{t.title2}
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed mb-6">{t.p1}</p>
            <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8">{t.p2}</p>

            <div className="grid sm:grid-cols-2 gap-4">
              {list.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-primary-foreground/90">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

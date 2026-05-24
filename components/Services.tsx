import { Scissors, Wind, Sparkles, Leaf, Shovel, Droplets, Sprout } from "lucide-react"

type Locale = "en" | "es"

const services = {
  en: [
    {
      icon: Scissors,
      title: "Lawn Mowing",
      description: "Professional mowing with precision cutting to keep your lawn neat and healthy all season.",
    },
    {
      icon: Sparkles,
      title: "Trimming & Edging",
      description: "Detailed trimming and edging-style cleanup around sidewalks, beds, and hard-to-reach spots.",
    },
    {
      icon: Wind,
      title: "Blowing & Cleanup",
      description: "Thorough blowing so driveway, sidewalk, and entry are clean after every visit.",
    },
    {
      icon: Leaf,
      title: "Mulch",
      description: "Fresh mulch installation to retain moisture, reduce weeds, and keep beds looking clean.",
    },
    {
      icon: Scissors,
      title: "Shrub Trimming",
      description: "Seasonal trimming to shape shrubs and keep growth neat around your home.",
    },
    {
      icon: Shovel,
      title: "Topsoil",
      description: "Topsoil delivery and spread for patching low spots and improving lawn and bed health.",
    },
    {
      icon: Droplets,
      title: "Fertilizer",
      description: "Lawn fertilizer applications to improve color, growth, and overall turf strength.",
    },
    {
      icon: Sprout,
      title: "Grass Seed",
      description: "Overseeding and patch seeding to fill thin areas and thicken your lawn.",
    },
  ],
  es: [
    {
      icon: Scissors,
      title: "Corte de cesped",
      description: "Corte parejo y profesional para mantener el cesped limpio y saludable durante toda la temporada.",
    },
    {
      icon: Sparkles,
      title: "Recorte y bordeado",
      description: "Detalle con trimmer y limpieza tipo borde en aceras, jardineras y zonas donde no entra la mower.",
    },
    {
      icon: Wind,
      title: "Soplado y limpieza",
      description: "Soplado final para dejar entrada, acera y patio limpios en cada visita.",
    },
    {
      icon: Leaf,
      title: "Mulch",
      description: "Instalacion de mulch para retener humedad, reducir maleza y mantener jardineras limpias.",
    },
    {
      icon: Scissors,
      title: "Recorte de arbusto",
      description: "Recorte estacional para dar forma a arbustos y mantener una apariencia ordenada.",
    },
    {
      icon: Shovel,
      title: "Topsoil",
      description: "Suministro y distribucion de topsoil para nivelar zonas bajas y mejorar el suelo.",
    },
    {
      icon: Droplets,
      title: "Fertilizante",
      description: "Aplicaciones de fertilizante para mejorar color, crecimiento y fuerza del cesped.",
    },
    {
      icon: Sprout,
      title: "Semillas",
      description: "Siembra y resiembra para cubrir areas delgadas y densificar el cesped.",
    },
  ],
} as const

const copy = {
  en: {
    tag: "What We Do",
    title: "OUR SERVICES",
    subtitle: "Residential lawn care: mowing, trimming, edging-style cleanup, and blowing.",
  },
  es: {
    tag: "Que hacemos",
    title: "SERVICIOS",
    subtitle: "Mantenimiento residencial: corte, recorte, limpieza tipo borde y soplado.",
  },
} as const

export function Services({ locale = "en" }: { locale?: Locale }) {
  const t = copy[locale]
  const list = services[locale]

  return (
    <section id="services" className="scroll-mt-24 flex min-h-screen flex-col justify-center bg-background py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-accent font-semibold tracking-wider uppercase mb-4">{t.tag}</p>
          <h2 className="font-[var(--font-heading)] text-4xl sm:text-5xl text-foreground mb-6">{t.title}</h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto leading-relaxed">{t.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {list.map((service) => (
            <div
              key={service.title}
              className="group relative bg-secondary p-8 rounded-xl hover:bg-secondary/90 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
                <service.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-[var(--font-heading)] text-xl text-primary-foreground mb-3">{service.title.toUpperCase()}</h3>
              <p className="text-primary-foreground/70 leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


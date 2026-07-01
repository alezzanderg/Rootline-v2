import { businessInfo } from "@/lib/services-data"

export type FaqItem = { q: string; a: string }
export type FaqLocale = "en" | "es"

export const homeFaqs: Record<FaqLocale, FaqItem[]> = {
  en: [
    {
      q: "How much does lawn mowing cost in Bergen County, NJ?",
      a: `Pricing depends on lawn size, property access, and how often you need service. Every property is different. Call or text Rootline Landscaping at ${businessInfo.phone} for a free, no-obligation estimate.`,
    },
    {
      q: "Do you provide estimates from photos or videos?",
      a: "No. We only provide estimates after an on-site visit. We do not give quotes based on photos or videos alone.",
    },
    {
      q: "Do you offer weekly lawn care?",
      a: "Yes. We offer weekly and bi-weekly lawn care throughout Bergen County, including mowing, trimming, edging-style detail, and backpack blower cleanup.",
    },
    {
      q: "Do you provide leaf cleanup?",
      a: "Yes, we provide complete fall leaf cleanup services including leaf removal, bed cleanup, and debris disposal throughout Bergen County.",
    },
    {
      q: "Do you offer snow removal?",
      a: "Yes. We offer snow removal for driveways, walkways, and small residential properties with winter storm availability. Contact us before the season to confirm coverage for your address.",
    },
    {
      q: "Do you work with small yards?",
      a: "Absolutely. We serve single-family homes, townhomes, and residential properties across Paramus, Ridgewood, Pascack Valley, Northern Valley, South Bergen, and surrounding Bergen County communities.",
    },
    {
      q: "Do you serve Paramus, Ridgewood, and other Bergen County towns?",
      a: "Yes. We serve Paramus, Ridgewood, Pascack Valley, Northern Valley, South Bergen, and surrounding North Jersey areas in Bergen County.",
    },
  ],
  es: [
    {
      q: "Cuanto cuesta el corte de cesped en Bergen County, NJ?",
      a: `El precio depende del tamano del patio, el acceso y la frecuencia del servicio. Llama o escribe a Rootline Landscaping al ${businessInfo.phone} para un estimado gratis sin compromiso.`,
    },
    {
      q: "Dan estimados con fotos o videos?",
      a: "No. Solo brindamos estimados despues de una visita al sitio. No damos cotizaciones basadas unicamente en fotos o videos.",
    },
    {
      q: "Ofrecen cuidado de cesped semanal?",
      a: "Si. Ofrecemos servicio semanal y quincenal en Bergen County: corte, recorte, limpieza tipo borde y soplado.",
    },
    {
      q: "Hacen limpieza de hojas?",
      a: "Si, ofrecemos limpieza completa de hojas en otono, incluyendo remocion de hojas, limpieza de jardineras y retiro de escombros en todo Bergen County.",
    },
    {
      q: "Ofrecen remocion de nieve?",
      a: "Si. Quitamos nieve de entradas, aceras y patios residenciales con disponibilidad en tormentas de invierno. Contactanos antes de la temporada para confirmar tu zona.",
    },
    {
      q: "Trabajan con patios pequenos?",
      a: "Si. Atendemos casas unifamiliares, townhomes y propiedades residenciales en Paramus, Ridgewood, Pascack Valley, Northern Valley, South Bergen y otras comunidades de Bergen County.",
    },
    {
      q: "Sirven Paramus, Ridgewood y otras ciudades de Bergen County?",
      a: "Si. Atendemos Paramus, Ridgewood, Pascack Valley, Northern Valley, South Bergen y zonas del norte de New Jersey en Bergen County.",
    },
  ],
}

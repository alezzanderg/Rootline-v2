import { businessInfo } from "@/lib/services-data"

export type FaqItem = { q: string; a: string }
export type FaqLocale = "en" | "es"

export const homeFaqs: Record<FaqLocale, FaqItem[]> = {
  en: [
    {
      q: "How much does lawn mowing cost in Hudson County, NJ?",
      a: `Pricing depends on lawn size, property access, and how often you need service. Every property is different. Call or text Rootline Landscaping at ${businessInfo.phone} for a free, no-obligation estimate.`,
    },
    {
      q: "Do you offer weekly lawn care?",
      a: "Yes. We offer weekly and bi-weekly lawn care throughout Hudson County, including mowing, trimming, edging-style detail, and backpack blower cleanup.",
    },
    {
      q: "Do you provide leaf cleanup?",
      a: "Yes, we provide complete fall leaf cleanup services including leaf removal, bed cleanup, and debris disposal throughout Hudson County.",
    },
    {
      q: "Do you offer snow removal?",
      a: "Yes. We offer snow removal for driveways, walkways, and small residential properties with winter storm availability. Contact us before the season to confirm coverage for your address.",
    },
    {
      q: "Do you work with small yards?",
      a: "Absolutely. We specialize in compact residential lots, townhomes, and tight-access yards common in Union City, Hoboken, Jersey City, and other Hudson County neighborhoods.",
    },
    {
      q: "Do you serve Union City, Jersey City, Hoboken, North Bergen, and West New York?",
      a: "Yes. We are based in Union City and regularly serve those communities, along with Weehawken, Secaucus, Kearny, Bayonne, and homeowners throughout Hudson County.",
    },
  ],
  es: [
    {
      q: "Cuanto cuesta el corte de cesped en Hudson County, NJ?",
      a: `El precio depende del tamano del patio, el acceso y la frecuencia del servicio. Llama o escribe a Rootline Landscaping al ${businessInfo.phone} para un estimado gratis sin compromiso.`,
    },
    {
      q: "Ofrecen cuidado de cesped semanal?",
      a: "Si. Ofrecemos servicio semanal y quincenal en Hudson County: corte, recorte, limpieza tipo borde y soplado.",
    },
    {
      q: "Hacen limpieza de hojas?",
      a: "Si, ofrecemos limpieza completa de hojas en otono, incluyendo remocion de hojas, limpieza de jardineras y retiro de escombros en todo Hudson County.",
    },
    {
      q: "Ofrecen remocion de nieve?",
      a: "Si. Quitamos nieve de entradas, aceras y patios residenciales con disponibilidad en tormentas de invierno. Contactanos antes de la temporada para confirmar tu zona.",
    },
    {
      q: "Trabajan con patios pequenos?",
      a: "Si. Nos especializamos en lotes compactos, townhomes y patios de acceso limitado, muy comunes en Union City, Hoboken, Jersey City y otras areas de Hudson County.",
    },
    {
      q: "Sirven Union City, Jersey City, Hoboken, North Bergen y West New York?",
      a: "Si. Tenemos base en Union City y atendemos esas comunidades, ademas de Weehawken, Secaucus, Kearny, Bayonne y todo Hudson County.",
    },
  ],
}

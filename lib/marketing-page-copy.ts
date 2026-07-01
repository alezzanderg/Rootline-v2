import { serviceAreaCopy } from "@/lib/service-area-config"
import { businessInfo } from "@/lib/services-data"

export const aboutPageCopy = {
  en: {
    metaTitle: "About Us | Lawn Care in Bergen County, NJ",
    metaDescription:
      "Rootline Landscaping provides reliable lawn mowing, trimming, seasonal cleanup, leaf removal, and snow service in Bergen County, NJ — Paramus, Ridgewood, Pascack Valley, and surrounding North Jersey areas.",
    breadcrumb: "About",
    h1: "About Rootline Landscaping",
    lead: `We are a North Jersey lawn care company — based in ${businessInfo.location}, serving homeowners, landlords, and small properties in Bergen County. When you search for Rootline Landscaping in NJ, this is your local team.`,
    body: [
      "Our focus is residential lawn care done right: consistent mowing, clean trimming, edging detail, and blower cleanup on every visit. We work with single-family homes, townhomes, and small residential properties across Bergen County.",
      "Unlike generic national brands, we are rooted in this market. We offer weekly and bi-weekly schedules, seasonal cleanups, fall leaf removal, and winter snow service with storm availability — so your property looks professional year-round.",
      `Call or text ${businessInfo.phone} for a free estimate. ${serviceAreaCopy.en.headline}`,
    ],
  },
  es: {
    metaTitle: "Nosotros | Cuidado de cesped en Bergen County, NJ",
    metaDescription:
      "Rootline Landscaping ofrece corte de cesped, recorte, limpieza estacional, retiro de hojas y servicio de nieve en Bergen County, NJ — Paramus, Ridgewood, Pascack Valley y zonas del norte de NJ.",
    breadcrumb: "Nosotros",
    h1: "Sobre Rootline Landscaping",
    lead: `Somos una empresa de cuidado de cesped en el norte de New Jersey — con base en ${businessInfo.location}, atendiendo propietarios, arrendadores y propiedades pequenas en Bergen County.`,
    body: [
      "Nos enfocamos en cuidado residencial bien hecho: corte constante, recorte limpio, detalle en bordes y soplado en cada visita. Trabajamos con casas unifamiliares, townhomes y propiedades residenciales pequenas en Bergen County.",
      "Ofrecemos horarios semanales y quincenales, limpiezas estacionales, retiro de hojas en otono y servicio de nieve en invierno — para que tu propiedad se vea profesional todo el ano.",
      `Llama o escribe al ${businessInfo.phone} para un estimado gratis. ${serviceAreaCopy.es.headline}`,
    ],
  },
} as const

export const serviceAreasPageCopy = {
  en: {
    metaTitle: "Service Areas | Bergen County, NJ",
    metaDescription:
      "Rootline Landscaping serves Bergen County, NJ — Paramus, Ridgewood, Pascack Valley, Northern Valley, South Bergen, and surrounding North Jersey areas.",
    breadcrumb: "Service Areas",
    h1: "Lawn Care Service Areas in New Jersey",
    lead: serviceAreaCopy.en.headline,
    body: "Browse your city below for local lawn mowing, leaf cleanup, snow removal, and property maintenance pages. Each link includes services available in your area and answers to common local questions.",
  },
  es: {
    metaTitle: "Zonas de servicio | Bergen County, NJ",
    metaDescription:
      "Rootline Landscaping atiende Bergen County, NJ — Paramus, Ridgewood, Pascack Valley, Northern Valley, South Bergen y zonas del norte de New Jersey.",
    breadcrumb: "Zonas de servicio",
    h1: "Zonas de servicio de cuidado de cesped en New Jersey",
    lead: serviceAreaCopy.es.headline,
    body: "Explora tu ciudad abajo para ver paginas locales de corte de cesped, limpieza de hojas, remocion de nieve y mantenimiento. Cada enlace incluye servicios en tu zona y preguntas frecuentes locales.",
  },
} as const

export const requestServicePageCopy = {
  en: {
    metaTitle: "Request Our Services | Free Estimate | Rootline Landscaping",
    metaDescription:
      "Request lawn care, mowing, seasonal cleanup, leaf removal, or snow service from Rootline Landscaping. Serving Bergen County, NJ — Paramus, Ridgewood, Pascack Valley, and surrounding North Jersey areas.",
    breadcrumb: "Request Services",
    h1: "Request Our Services",
    lead: "Tell us about your property and what you need. We will review your request and get back to you with next steps — usually within one business day.",
    body: `Include your New Jersey property address and the type of service you are looking for. ${serviceAreaCopy.en.headline}`,
  },
  es: {
    metaTitle: "Solicitar servicios | Estimado gratis | Rootline Landscaping",
    metaDescription:
      "Solicita cuidado de césped, corte, limpieza estacional, retiro de hojas o servicio de nieve con Rootline Landscaping. Atendemos Bergen County, NJ — Paramus, Ridgewood, Pascack Valley y zonas del norte de NJ.",
    breadcrumb: "Solicitar servicios",
    h1: "Solicitar nuestros servicios",
    lead: "Cuéntanos sobre tu propiedad y lo que necesitas. Revisaremos tu solicitud y te contactaremos con los siguientes pasos — normalmente en un día hábil.",
    body: `Incluye la dirección de tu propiedad en New Jersey y el tipo de servicio que buscas. ${serviceAreaCopy.es.headline}`,
  },
} as const

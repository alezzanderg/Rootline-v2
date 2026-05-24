import type { ServiceKey } from "@/lib/services-data"

export type LocalizedService = {
  name: string
  title: string
  description: string
  features: readonly string[]
}

export const servicesEs: Record<ServiceKey, LocalizedService> = {
  "lawn-care": {
    name: "Cuidado de césped",
    title: "Servicios profesionales de cuidado de césped",
    description:
      "Cuidado completo del césped: corte, recorte, bordeado y soplado para mantener tu patio impecable todo el año.",
    features: [
      "Corte semanal y quincenal",
      "Recorte y bordeado profesional",
      "Soplado y limpieza de escombros",
      "Horarios consistentes",
      "Residencial y pequeño comercial",
      "Estimados gratis",
    ],
  },
  "lawn-mowing": {
    name: "Corte de césped",
    title: "Servicios profesionales de corte de césped",
    description:
      "Corte de precisión con recorte, bordeado y soplado para un césped limpio y bien mantenido en cada visita.",
    features: [
      "Corte a la altura ideal",
      "Recorte con string trimmer",
      "Bordeado limpio en aceras y entradas",
      "Soplado y limpieza",
      "Opciones semanales y quincenales",
      "Horarios confiables",
    ],
  },
  "leaf-cleanup": {
    name: "Limpieza de hojas",
    title: "Limpieza y retiro profesional de hojas",
    description:
      "Limpieza otoñal completa para proteger tu césped y mantener la propiedad lista para el invierno.",
    features: [
      "Retiro completo de hojas",
      "Limpieza de jardineras y arbustos",
      "Acarreo y disposición de escombros",
      "Limpieza de canaletas",
      "Preparación otoñal",
      "Servicio único o recurrente",
    ],
  },
  "snow-removal": {
    name: "Remoción de nieve",
    title: "Servicios de remoción de nieve",
    description:
      "Remoción de nieve con disponibilidad en tormentas de invierno para mantener tu propiedad segura y accesible.",
    features: [
      "Disponibilidad en tormentas",
      "Limpieza de entradas y aceras",
      "Lotes comerciales pequeños",
      "Manejo de hielo y sal",
      "Propiedades residenciales",
      "Contratos de temporada",
    ],
  },
  "seasonal-cleanup": {
    name: "Limpieza estacional",
    title: "Limpieza estacional de primavera y otoño",
    description:
      "Limpieza profunda para preparar tu propiedad en cada cambio de temporada y mantener su apariencia.",
    features: [
      "Retiro de escombros de primavera",
      "Limpieza de hojas en otoño",
      "Preparación de jardineras",
      "Recorte de arbustos",
      "Evaluación de la propiedad",
      "Retiro y disposición de escombros",
    ],
  },
  "property-maintenance": {
    name: "Mantenimiento de propiedad",
    title: "Mantenimiento de propiedad todo el año",
    description:
      "Mantenimiento integral para que tu propiedad residencial o comercial pequeña luzca bien durante todo el año.",
    features: [
      "Mantenimiento regular del césped",
      "Recorte de arbustos y setos",
      "Retiro de escombros",
      "Limpieza estacional incluida",
      "Planes personalizados",
      "Servicio para alquileres",
    ],
  },
}

export const mainServicesEs = [
  "Corte de césped",
  "Recorte",
  "Bordeado",
  "Soplado",
  "Limpieza estacional",
  "Retiro de hojas",
  "Remoción de nieve",
  "Mantenimiento de propiedad todo el año",
]

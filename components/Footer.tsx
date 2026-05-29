import Image from "next/image"
import Link from "next/link"

import { localizedPath, type Locale } from "@/lib/locale-path"

import { marketingImages } from "@/lib/marketing-images"

const copy = {
  en: {
    brandText: "Rooted in hard work. Built on craftsmanship. We create outdoor spaces that grow with you.",
    slogan: "GOOD ROOTS. GREAT SPACES.",
    quickLinks: "QUICK LINKS",
    services: "SERVICES",
    servicesLink: "Services",
    aboutLink: "About Us",
    areasLink: "Service Areas",
    contactLink: "Contact",
    mowing: "Lawn Mowing",
    trim: "Trimming & Edging",
    blow: "Blowing & Cleanup",
    mulch: "Mulch",
    shrub: "Shrub Trimming",
    topsoil: "Topsoil",
    fertilizer: "Fertilizer",
    seed: "Grass Seed",
    bar: "RESIDENTIAL LAWN CARE",
    rights: "All rights reserved.",
  },
  es: {
    brandText: "Trabajo duro, servicio serio y resultados visibles. Cuidamos tu patio para que siempre se vea limpio y bien mantenido.",
    slogan: "BUENAS RAICES. GRANDES ESPACIOS.",
    quickLinks: "ENLACES",
    services: "SERVICIOS",
    servicesLink: "Servicios",
    aboutLink: "Nosotros",
    areasLink: "Zonas de servicio",
    contactLink: "Contacto",
    mowing: "Corte de cesped",
    trim: "Recorte y bordeado",
    blow: "Soplado y limpieza",
    mulch: "Mulch",
    shrub: "Recorte de arbusto",
    topsoil: "Topsoil",
    fertilizer: "Fertilizante",
    seed: "Semillas",
    bar: "MANTENIMIENTO RESIDENCIAL",
    rights: "Todos los derechos reservados.",
  },
} as const

/** Lucide does not ship Instagram/Facebook brand icons. */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export function Footer({ locale = "en" }: { locale?: Locale }) {
  const t = copy[locale]
  const home = localizedPath("/", locale)
  const servicesHref = `${home}#services`
  const contactHref = `${home}#contact`

  return (
    <footer className="bg-[#151515] text-[#E7E2D6]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="relative mb-6 h-12 w-[min(100%,13rem)] sm:h-14 sm:w-[min(100%,16rem)] md:w-[min(100%,18rem)]">
              <Image
                src={marketingImages.logoFooter}
                alt="Rootline Landscaping"
                fill
                className="object-contain object-left"
                sizes="(max-width: 768px) 208px, 288px"
                loading="lazy"
              />
            </div>
            <p className="text-[#E7E2D6]/70 leading-relaxed max-w-md mb-6">{t.brandText}</p>
            <p className="font-display text-lg text-[#6C8C4A]">{t.slogan}</p>
          </div>

          <div>
            <h4 className="mb-4 font-display text-lg">{t.quickLinks}</h4>
            <ul className="space-y-3">
              <li><Link href={servicesHref} className="text-[#E7E2D6]/70 hover:text-[#6C8C4A] transition-colors">{t.servicesLink}</Link></li>
              <li><Link href={localizedPath("/about", locale)} className="text-[#E7E2D6]/70 hover:text-[#6C8C4A] transition-colors">{t.aboutLink}</Link></li>
              <li><Link href={localizedPath("/service-areas", locale)} className="text-[#E7E2D6]/70 hover:text-[#6C8C4A] transition-colors">{t.areasLink}</Link></li>
              <li><Link href={contactHref} className="text-[#E7E2D6]/70 hover:text-[#6C8C4A] transition-colors">{t.contactLink}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-lg">{t.services}</h4>
            <ul className="space-y-3">
              <li className="text-[#E7E2D6]/70">{t.mowing}</li>
              <li className="text-[#E7E2D6]/70">{t.trim}</li>
              <li className="text-[#E7E2D6]/70">{t.blow}</li>
              <li className="text-[#E7E2D6]/70">{t.mulch}</li>
              <li className="text-[#E7E2D6]/70">{t.shrub}</li>
              <li className="text-[#E7E2D6]/70">{t.topsoil}</li>
              <li className="text-[#E7E2D6]/70">{t.fertilizer}</li>
              <li className="text-[#E7E2D6]/70">{t.seed}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E7E2D6]/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[#E7E2D6]/50">
              <span>{t.bar}</span>
              <span>•</span>
              <span>MOW</span>
              <span>•</span>
              <span>TRIM</span>
              <span>•</span>
              <span>BLOW</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="https://www.instagram.com/rootlinenj/" target="_blank" rel="noopener noreferrer" className="text-[#E7E2D6]/50 hover:text-[#6C8C4A] transition-colors" aria-label="Instagram">
                <InstagramIcon className="h-5 w-5" />
              </Link>
              <Link href="https://www.facebook.com/rootlinenj/" target="_blank" rel="noopener noreferrer" className="text-[#E7E2D6]/50 hover:text-[#6C8C4A] transition-colors" aria-label="Facebook">
                <FacebookIcon className="h-5 w-5" />
              </Link>
              <span className="text-sm text-[#E7E2D6]/50">rootlinesco.com</span>
            </div>
          </div>
          <div className="text-center mt-6 text-sm text-[#E7E2D6]/30">
            © {new Date().getFullYear()} Rootline Landscaping. {t.rights}
          </div>
        </div>
      </div>
    </footer>
  )
}


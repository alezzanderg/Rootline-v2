"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getLocaleSwitchHref,
  isLocaleActive,
  localizedPath,
  type Locale,
} from "@/lib/locale-path"

const LOGO_SRC = "/7c976f2c-801e-4c21-9cab-4125705b2fd5.png"

const copy = {
  en: {
    services: "Services",
    about: "About",
    quote: "Get a Quote",
    switchTo: "ES",
  },
  es: {
    services: "Servicios",
    about: "Nosotros",
    quote: "Cotizar",
    switchTo: "EN",
  },
} satisfies Record<Locale, { services: string; about: string; quote: string; switchTo: string }>

export function Navbar({ locale = "en" }: { locale?: Locale }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const t = copy[locale]

  const targetLocaleHref = getLocaleSwitchHref(pathname, locale)
  const isCurrentLocalePath = isLocaleActive(pathname, locale)
  const homePath = localizedPath("/", locale)
  const onHome = pathname === homePath
  const servicesHref = onHome ? "#services" : `${homePath}#services`
  const aboutHref = onHome ? "#about" : `${homePath}#about`
  const contactHref = onHome ? "#contact" : `${homePath}#contact`

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link
            href={homePath}
            className="relative flex h-9 w-[min(100%,11rem)] shrink-0 items-center sm:h-11 sm:w-[min(100%,14rem)] md:w-[min(100%,16rem)]"
            onClick={() => setIsOpen(false)}
          >
            <Image
              src={LOGO_SRC}
              alt="Rootline Landscaping"
              fill
              className="object-contain object-left"
              sizes="(max-width: 768px) 176px, 224px"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href={servicesHref} className="text-sm font-medium text-primary-foreground/80 hover:text-primary transition-colors">
              {t.services}
            </Link>
            <Link href={aboutHref} className="text-sm font-medium text-primary-foreground/80 hover:text-primary transition-colors">
              {t.about}
            </Link>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold" asChild>
              <Link href={contactHref}>{t.quote}</Link>
            </Button>
            <Link
              href={targetLocaleHref}
              className="rounded-md border border-primary/40 px-3 py-1.5 text-xs font-semibold tracking-wider text-primary-foreground/85 transition-colors hover:bg-primary/20"
              aria-current={isCurrentLocalePath ? "page" : undefined}
            >
              {t.switchTo}
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-primary-foreground"
            aria-label={isOpen ? "Close navigation" : "Open navigation"}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-6 space-y-4">
            <Link href={servicesHref} className="block text-sm font-medium text-primary-foreground/80 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
              {t.services}
            </Link>
            <Link href={aboutHref} className="block text-sm font-medium text-primary-foreground/80 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
              {t.about}
            </Link>
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold" asChild>
              <Link href={contactHref} onClick={() => setIsOpen(false)}>{t.quote}</Link>
            </Button>
            <Link
              href={targetLocaleHref}
              className="block rounded-md border border-primary/40 px-3 py-2 text-center text-xs font-semibold tracking-wider text-primary-foreground/85 transition-colors hover:bg-primary/20"
              onClick={() => setIsOpen(false)}
            >
              {t.switchTo}
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

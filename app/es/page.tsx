import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/Hero"
import { Services } from "@/components/Services"
import { About } from "@/components/About"
import { ServiceAreas } from "@/components/ServiceAreas"
import { HomeFAQ } from "@/components/HomeFAQ"
import { CTA } from "@/components/CTA"
import { Footer } from "@/components/Footer"

export default function HomeEs() {
  return (
    <main>
      <Navbar locale="es" />
      <Hero locale="es" />
      <Services locale="es" />
      <About locale="es" />
      <ServiceAreas locale="es" />
      <HomeFAQ locale="es" />
      <CTA locale="es" />
      <Footer locale="es" />
    </main>
  )
}


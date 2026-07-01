import { FAQSchema } from "@/components/structured-data"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { homeFaqs, type FaqLocale } from "@/lib/home-faqs"

const copy = {
  en: {
    tag: "Questions",
    title: "FREQUENTLY ASKED QUESTIONS",
    subtitle: "Common questions about our lawn care services in Bergen County",
  },
  es: {
    tag: "Preguntas",
    title: "PREGUNTAS FRECUENTES",
    subtitle: "Preguntas comunes sobre nuestros servicios de cesped en Bergen County",
  },
} as const

export function HomeFAQ({ locale = "en" }: { locale?: FaqLocale }) {
  const t = copy[locale]
  const list = homeFaqs[locale]

  return (
    <>
      <FAQSchema faqs={list} />

      <section id="faq" className="scroll-mt-24 flex min-h-screen flex-col justify-center bg-secondary py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="mb-4 font-semibold tracking-wider text-primary uppercase">{t.tag}</p>
            <h2 className="font-[var(--font-heading)] text-4xl text-primary-foreground sm:text-5xl">{t.title}</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/75">{t.subtitle}</p>
          </div>

          <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-[#fdfcf8] p-6 sm:p-8">
            <Accordion type="single" collapsible className="w-full">
              {list.map((faq, index) => (
                <AccordionItem key={faq.q} value={`faq-${index}`} className="border-foreground/10">
                  <AccordionTrigger className="text-foreground hover:text-primary">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-foreground/70">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </>
  )
}

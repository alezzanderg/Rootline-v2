"use client"

import { useRef, useState, useTransition } from "react"
import { X } from "lucide-react"

import { submitServiceInquiryAction } from "@/app/actions/service-inquiry"
import { AddressAutocompleteInput } from "@/components/ui/AddressAutocompleteInput"
import { Button } from "@/components/ui/button"
import { PhoneInput } from "@/components/ui/PhoneInput"
import { isCompleteNJAddress } from "@/lib/address-format"
import { SERVICE_INQUIRY_SUBJECTS } from "@/lib/service-inquiry-subjects"

type Locale = "en" | "es"

const copy = {
  en: {
    trigger: "Request our services",
    title: "Request our services",
    subtitle: "Tell us what you need and we will get back to you soon.",
    firstName: "First name",
    lastName: "Last name",
    address: "Property address",
    email: "Email",
    phone: "Phone",
    subject: "Service needed",
    subjectPlaceholder: "Select a service…",
    message: "Message",
    submit: "Send request",
    sending: "Sending…",
    successTitle: "Request received",
    successText: "Thank you. We will contact you shortly.",
    close: "Close",
    errors: {
      missing: "Please fill in all required fields.",
      invalid_email: "Enter a valid email address.",
      invalid_phone: "Enter a valid 10-digit phone number.",
      invalid_address: "Select a complete New Jersey address from the suggestions.",
    },
  },
  es: {
    trigger: "Solicitar servicios",
    title: "Solicitar servicios",
    subtitle: "Cuéntanos qué necesitas y te contactaremos pronto.",
    firstName: "Nombre",
    lastName: "Apellido",
    address: "Dirección de la propiedad",
    email: "Correo electrónico",
    phone: "Teléfono",
    subject: "Servicio que necesitas",
    subjectPlaceholder: "Selecciona un servicio…",
    message: "Mensaje",
    submit: "Enviar solicitud",
    sending: "Enviando…",
    successTitle: "Solicitud recibida",
    successText: "Gracias. Te contactaremos en breve.",
    close: "Cerrar",
    errors: {
      missing: "Completa todos los campos obligatorios.",
      invalid_email: "Ingresa un correo electrónico válido.",
      invalid_phone: "Ingresa un teléfono válido de 10 dígitos.",
      invalid_address: "Selecciona una dirección completa de New Jersey en las sugerencias.",
    },
  },
} as const

const ic =
  "w-full rounded-lg border border-foreground/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/45"

export function ServiceRequestDialog({ locale = "en" }: { locale?: Locale }) {
  const t = copy[locale]
  const ref = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<
    "missing" | "invalid_email" | "invalid_phone" | "invalid_address" | null
  >(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function open() {
    setError(null)
    setSuccess(false)
    ref.current?.showModal()
  }

  function close() {
    setSuccess(false)
    setError(null)
    ref.current?.close()
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set("locale", locale)
    const address = String(formData.get("address") ?? "")
    if (!isCompleteNJAddress(address)) {
      setError("invalid_address")
      return
    }
    startTransition(async () => {
      const result = await submitServiceInquiryAction(formData)
      if (result.ok) {
        setSuccess(true)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={open}
        className="bg-accent px-8 text-lg font-semibold text-accent-foreground shadow-lg shadow-terra/20 hover:bg-accent/90"
      >
        {t.trigger}
      </Button>

      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) close()
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-foreground/12 bg-[#fdfcf8] p-0 shadow-2xl outline-none backdrop:bg-black/50 open:flex open:flex-col"
      >
        <div className="flex items-start justify-between gap-3 border-b border-foreground/10 px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">{t.title}</h2>
            <p className="mt-1 text-sm text-foreground/55">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground/50 transition hover:bg-foreground/8"
            aria-label={t.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="px-5 py-8 text-center">
            <p className="font-display text-lg font-semibold text-foreground">{t.successTitle}</p>
            <p className="mt-2 text-sm text-foreground/60">{t.successText}</p>
            <Button type="button" className="mt-6" onClick={close}>
              {t.close}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="max-h-[min(70vh,32rem)] overflow-y-auto px-5 py-4">
            {error ? (
              <p className="mb-3 rounded-lg border border-rose-300/40 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {t.errors[error]}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className={lbl}>{t.firstName}</span>
                <input name="firstName" required autoComplete="given-name" className={ic} />
              </label>
              <label className="grid gap-1">
                <span className={lbl}>{t.lastName}</span>
                <input name="lastName" required autoComplete="family-name" className={ic} />
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className={lbl}>{t.address}</span>
                <AddressAutocompleteInput locale={locale} required className={ic} />
              </label>
              <label className="grid gap-1">
                <span className={lbl}>{t.email}</span>
                <input name="email" type="email" required autoComplete="email" className={ic} />
              </label>
              <label className="grid gap-1">
                <span className={lbl}>{t.phone}</span>
                <PhoneInput required className={ic} />
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className={lbl}>{t.subject}</span>
                <select name="subject" required defaultValue="" className={ic}>
                  <option value="" disabled>
                    {t.subjectPlaceholder}
                  </option>
                  {SERVICE_INQUIRY_SUBJECTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {locale === "es" ? option.es : option.en}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className={lbl}>{t.message}</span>
                <textarea name="message" required rows={4} className={`${ic} resize-none`} />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? t.sending : t.submit}
              </Button>
              <Button type="button" variant="outline" onClick={close}>
                {t.close}
              </Button>
            </div>
          </form>
        )}
      </dialog>
    </>
  )
}

"use client"

import { useState, useTransition } from "react"

import { submitServiceInquiryAction } from "@/app/actions/service-inquiry"
import { AddressAutocompleteInput } from "@/components/ui/AddressAutocompleteInput"
import { Button } from "@/components/ui/button"
import { PhoneInput } from "@/components/ui/PhoneInput"
import { isCompleteNJAddress } from "@/lib/address-format"
import {
  serviceRequestCopy,
  type ServiceRequestError,
  type ServiceRequestLocale,
} from "@/lib/service-request-copy"
import { SERVICE_INQUIRY_SUBJECTS } from "@/lib/service-inquiry-subjects"

const ic =
  "w-full rounded-lg border border-foreground/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/45"

type Props = {
  locale?: ServiceRequestLocale
  showCancel?: boolean
  onCancel?: () => void
  onSuccess?: () => void
  className?: string
}

export function ServiceRequestForm({
  locale = "en",
  showCancel = false,
  onCancel,
  onSuccess,
  className,
}: Props) {
  const t = serviceRequestCopy[locale]
  const [error, setError] = useState<ServiceRequestError | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

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
        onSuccess?.()
      } else {
        setError(result.error)
      }
    })
  }

  if (success) {
    return (
      <div className={className}>
        <p className="font-display text-lg font-semibold text-foreground">{t.successTitle}</p>
        <p className="mt-2 text-sm text-foreground/60">{t.successText}</p>
        {showCancel ? (
          <Button type="button" className="mt-6" onClick={onCancel}>
            {t.close}
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className={className}>
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
        {showCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.close}
          </Button>
        ) : null}
      </div>
    </form>
  )
}

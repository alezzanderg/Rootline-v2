"use client"

import { useRef, useState } from "react"
import { X } from "lucide-react"

import { ServiceRequestForm } from "@/components/ServiceRequestForm"
import { Button } from "@/components/ui/button"
import { serviceRequestCopy, type ServiceRequestLocale } from "@/lib/service-request-copy"

export function ServiceRequestDialog({ locale = "en" }: { locale?: ServiceRequestLocale }) {
  const t = serviceRequestCopy[locale]
  const ref = useRef<HTMLDialogElement>(null)
  const [formKey, setFormKey] = useState(0)

  function open() {
    setFormKey((k) => k + 1)
    ref.current?.showModal()
  }

  function close() {
    ref.current?.close()
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

        <div className="max-h-[min(70vh,32rem)] overflow-y-auto px-5 py-4">
          <ServiceRequestForm
            key={formKey}
            locale={locale}
            showCancel
            onCancel={close}
            onSuccess={() => {}}
          />
        </div>
      </dialog>
    </>
  )
}

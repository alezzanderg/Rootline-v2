"use client"

import { useState } from "react"

import { formatPhoneUS } from "@/lib/phone-format"

type PhoneInputProps = {
  name?: string
  required?: boolean
  defaultValue?: string
  placeholder?: string
  className?: string
}

export function PhoneInput({
  name = "phone",
  required,
  defaultValue = "",
  placeholder = "(551) 333-5296",
  className,
}: PhoneInputProps) {
  const [value, setValue] = useState(() => formatPhoneUS(defaultValue))

  return (
    <input
      type="tel"
      name={name}
      required={required}
      value={value}
      onChange={(e) => setValue(formatPhoneUS(e.target.value))}
      placeholder={placeholder}
      className={className}
      inputMode="tel"
      autoComplete="tel"
      pattern="\(\d{3}\) \d{3}-\d{4}"
      title="Ingresa un teléfono de 10 dígitos, ej. (551) 333-5296"
      aria-label="Teléfono"
    />
  )
}

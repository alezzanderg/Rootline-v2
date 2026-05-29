"use client"

import { useEffect, useRef } from "react"

import { markServiceInquiryReadAction } from "@/app/actions/service-inquiry"

export function MarkInquiryReadOnView({ id, status }: { id: string; status: string }) {
  const done = useRef(false)

  useEffect(() => {
    if (status !== "NEW" || done.current) return
    done.current = true
    const formData = new FormData()
    formData.set("id", id)
    void markServiceInquiryReadAction(formData)
  }, [id, status])

  return null
}

"use client"

import { useState } from "react"

import { TabsGroup } from "@/components/ui/Tabs"

export function ProductosTabs({
  suppliers,
  products,
  priceLogs,
  panels,
}: {
  suppliers: number
  products: number
  priceLogs: number
  panels: [React.ReactNode, React.ReactNode, React.ReactNode]
}) {
  const [active, setActive] = useState(0)

  const tabs = [
    { label: "Inventario", badge: products || null },
    { label: "Proveedores", badge: suppliers || null },
    { label: "Historial de precios", badge: priceLogs || null },
  ]

  return (
    <TabsGroup tabs={tabs} activeIndex={active} onChange={setActive}>
      {panels[active]}
    </TabsGroup>
  )
}

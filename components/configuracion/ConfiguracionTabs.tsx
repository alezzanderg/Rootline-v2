"use client"

import { useState } from "react"

import { TabsGroup } from "@/components/ui/Tabs"

export function ConfiguracionTabs({
  panels,
}: {
  panels: [React.ReactNode, React.ReactNode]
}) {
  const [active, setActive] = useState(0)

  const tabs = [
    { label: "Perfil" },
    { label: "Ajustes" },
  ]

  return (
    <TabsGroup tabs={tabs} activeIndex={active} onChange={setActive}>
      {panels[active]}
    </TabsGroup>
  )
}

import Link from "next/link"

import { absoluteUrl } from "@/lib/site-config"
import { localizedPath, type Locale } from "@/lib/locale-path"

export type BreadcrumbItem = {
  name: string
  href: string
}

export function PageBreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  )
}

export function PageBreadcrumbs({ items, locale }: { items: BreadcrumbItem[]; locale: Locale }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-white/10 bg-secondary pt-24 pb-4"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-primary-foreground/70">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            return (
              <li key={item.href} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden className="text-primary-foreground/35">/</span> : null}
                {isLast ? (
                  <span className="font-medium text-primary-foreground" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={localizedPath(item.href, locale)}
                    className="hover:text-[#6C8C4A] transition-colors"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}

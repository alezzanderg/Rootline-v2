type Props = {
  h1: string
  lead: string
  body?: string | readonly string[]
}

export function SeoPageIntro({ h1, lead, body }: Props) {
  const paragraphs = body
    ? typeof body === "string"
      ? [body]
      : [...body]
    : []

  return (
    <section className="bg-background py-12 md:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl lg:text-5xl text-balance">
          {h1}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-foreground/75">{lead}</p>
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className="mt-4 leading-relaxed text-foreground/70">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  )
}

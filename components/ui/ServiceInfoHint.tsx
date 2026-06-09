/** Small (i) info icon that reveals a longer service detail on click. No JS. */
export function ServiceInfoHint({ text }: { text: string }) {
  return (
    <details data-autoclose className="relative inline-block shrink-0 align-middle">
      <summary
        aria-label="Ver detalle"
        title="Ver detalle"
        className="flex h-4 w-4 cursor-pointer list-none items-center justify-center rounded-full border border-foreground/30 font-serif text-[11px] font-bold italic leading-none text-foreground/50 transition hover:border-accent hover:text-accent"
      >
        i
      </summary>
      <div className="absolute left-0 top-full z-30 mt-1.5 w-64 rounded-lg border border-foreground/15 bg-[#fdfcf8] p-3 text-xs leading-relaxed text-foreground/70 shadow-xl">
        {text}
      </div>
    </details>
  )
}

/** Resend flags mailto:/tel: as mismatched domains — keep contact info as plain text. */
export function stripMailtoAndTelLinks(html: string): string {
  return html.replace(
    /<a\b[^>]*\bhref\s*=\s*["'](?:mailto:|tel:)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
    "$1"
  )
}

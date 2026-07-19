/** Convert email HTML to editable plain text (paragraphs and line breaks). */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/\r\n/g, "\n")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n\n")
    .replace(/<\/\s*div\s*>/gi, "\n")
    .replace(/<\/\s*h[1-6]\s*>/gi, "\n\n")
    .replace(/<\/\s*li\s*>/gi, "\n")
    .replace(/<\/\s*tr\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Convert plain text paragraphs into simple email HTML. */
export function plainTextToEmailHtml(text: string): string {
  const cleaned = text.trim().replace(/^```[\w]*\n?|\n?```$/g, "").trim()
  const paragraphs = cleaned.split(/\n{2,}/).filter(Boolean)
  if (paragraphs.length === 0) return "<p></p>"
  return paragraphs
    .map((block) => {
      const lines = escapeHtml(block).replace(/\n/g, "<br/>")
      return `<p style="margin:0 0 16px;">${lines}</p>`
    })
    .join("\n")
}

export type ParsedAssistantDraft = {
  subject?: string
  body: string
}

/**
 * Extract a clean email body (and optional subject) from an assistant reply
 * that may include preamble, markdown, or "Asunto:" lines.
 */
export function parseAssistantEmailDraft(raw: string): ParsedAssistantDraft {
  let text = raw.trim().replace(/^```[\w]*\n?|\n?```$/g, "").trim()

  // Drop common preamble before the actual letter / subject.
  text = text.replace(
    /^(?:aquí tienes|here(?:'s| is)|te dejo|borrador)[^\n]*\n+/i,
    "",
  )
  text = text.replace(/^[-*_]{3,}\s*\n+/gm, "")

  let subject: string | undefined
  const subjectMatch = text.match(
    /^(?:\*\*)?(?:asunto|subject)(?:\*\*)?\s*:\s*(.+?)\s*(?:\*\*)?\s*\n+/i,
  )
  if (subjectMatch) {
    subject = subjectMatch[1].replace(/\*\*/g, "").trim()
    text = text.slice(subjectMatch[0].length)
  }

  text = text.replace(/^[-*_]{3,}\s*\n+/gm, "")
  // Light markdown cleanup for plain-text editing.
  text = text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#+\s+/gm, "")
    .trim()

  return { subject, body: text }
}

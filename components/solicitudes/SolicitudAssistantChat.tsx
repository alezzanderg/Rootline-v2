"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Bot, Copy, Check, Loader2, Send, Sparkles, Trash2, FileInput } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

export type SolicitudAssistantContext = {
  id: string
  firstName: string
  lastName: string
  subject: string
  locale: string | null
}

const QUICK_PROMPTS = [
  {
    label: "Borrador de correo",
    text: "Redacta un borrador de correo profesional respondiendo a esta solicitud. Incluye saludo, confirmación de recepción, siguientes pasos y cierre. Recuerda: no damos estimados solo con fotos; hace falta una inspección en el lugar.",
  },
  {
    label: "Pedir más info",
    text: "Redacta un mensaje corto pidiendo fotos del área (solo como contexto) y qué día/horario le conviene para una visita de inspección en persona. Deja claro que el estimado se prepara después de inspeccionar el lugar, no solo con fotos.",
  },
  {
    label: "Resumen",
    text: "Resume esta solicitud en 3–5 viñetas y sugiere el mejor siguiente paso operativo (normalmente agendar inspección en sitio; fotos solo como apoyo).",
  },
  {
    label: "En inglés",
    text: "Rewrite a polite English email reply to this inquiry, ready to send. Make clear we do not quote from photos alone — we need an on-site inspection before providing an estimate.",
  },
] as const

function messageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text!)
    .join("")
}

type Props = {
  inquiry: SolicitudAssistantContext | null
  /** When set, assistant replies can be inserted into the email composer. */
  onApplyDraft?: (plainText: string) => void
}

export function SolicitudAssistantChat({ inquiry, onApplyDraft }: Props) {
  const [input, setInput] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inquiryId = inquiry?.id ?? null

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/dashboard/solicitudes/assistant",
        body: () => ({ inquiryId }),
      }),
    [inquiryId],
  )

  const { messages, sendMessage, status, setMessages, error, stop } = useChat({
    id: inquiryId ? `solicitud-${inquiryId}` : "solicitud-none",
    transport,
  })

  const busy = status === "submitted" || status === "streaming"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, status])

  async function copyText(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1600)
    } catch {
      /* ignore */
    }
  }

  function submitPrompt(text: string) {
    const trimmed = text.trim()
    if (!trimmed || !inquiryId || busy) return
    void sendMessage({ text: trimmed })
    setInput("")
  }

  if (!inquiry) {
    return (
      <aside className="flex h-full min-h-[20rem] flex-col border-t border-foreground/10 bg-foreground/[0.02] xl:border-t-0 xl:border-l-0">
        <Header />
        <p className="flex flex-1 items-center justify-center px-5 text-center text-sm text-foreground/45">
          Selecciona una solicitud para que el asistente te ayude a responder.
        </p>
      </aside>
    )
  }

  return (
    <aside className="flex h-full min-h-[22rem] flex-col bg-foreground/[0.02] xl:min-h-0">
      <Header
        subtitle={`${inquiry.firstName} ${inquiry.lastName} · ${inquiry.subject}`}
        onClear={() => setMessages([])}
        canClear={messages.length > 0 && !busy}
      />

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-foreground/15 bg-background/70 px-3 py-4">
            <p className="text-xs leading-relaxed text-foreground/55">
              Pide un borrador de respuesta, un resumen o preguntas de seguimiento. El asistente ya
              conoce el mensaje de esta solicitud.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => submitPrompt(prompt.text)}
                  className="rounded-lg border border-foreground/12 bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground/70 transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message) => {
          const text = messageText(message.parts)
          const isUser = message.role === "user"
          if (!text) return null
          return (
            <div
              key={message.id}
              className={`group relative max-w-[95%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                isUser
                  ? "ml-auto bg-accent/15 text-foreground"
                  : "mr-auto border border-foreground/10 bg-background text-foreground/85"
              }`}
            >
              {!isUser ? (
                <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  <Bot className="h-3 w-3" />
                  Asistente
                </p>
              ) : null}
              <p className="whitespace-pre-wrap">{text}</p>
              {!isUser ? (
                <div className="mt-2 flex flex-wrap gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => void copyText(message.id, text)}
                    className="inline-flex items-center gap-1 rounded-md border border-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground/50 transition hover:bg-foreground/5"
                  >
                    {copiedId === message.id ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copiar
                      </>
                    )}
                  </button>
                  {onApplyDraft ? (
                    <button
                      type="button"
                      onClick={() => onApplyDraft(text)}
                      className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent transition hover:bg-accent/20"
                    >
                      <FileInput className="h-3 w-3" />
                      Usar en el correo
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}

        {busy ? (
          <p className="flex items-center gap-2 text-xs text-foreground/45">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Pensando…
            <button
              type="button"
              onClick={() => stop()}
              className="font-medium text-foreground/55 underline-offset-2 hover:underline"
            >
              Detener
            </button>
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            No se pudo completar la respuesta. Revisa AI_PROVIDER y la API key del proveedor e
            inténtalo de nuevo.
          </p>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <form
        className="border-t border-foreground/10 p-3"
        onSubmit={(e) => {
          e.preventDefault()
          submitPrompt(input)
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submitPrompt(input)
              }
            }}
            rows={2}
            disabled={busy}
            placeholder="Ej. Redacta la respuesta en español…"
            className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none transition placeholder:text-foreground/35 focus:border-accent/45"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </aside>
  )
}

function Header({
  subtitle,
  onClear,
  canClear,
}: {
  subtitle?: string
  onClear?: () => void
  canClear?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-foreground/10 px-4 py-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          Asistente
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground/80">
          {subtitle ?? "Respuestas a solicitudes"}
        </p>
      </div>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          disabled={!canClear}
          className="rounded-lg border border-foreground/12 p-1.5 text-foreground/45 transition hover:bg-foreground/5 disabled:opacity-30"
          title="Limpiar chat"
          aria-label="Limpiar chat"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}

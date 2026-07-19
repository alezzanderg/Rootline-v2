import { createAnthropic } from "@ai-sdk/anthropic"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import type { LanguageModel } from "ai"

export type AiProvider = "openai" | "anthropic" | "deepseek" | "google" | "compatible"

const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: "gpt-5-mini",
  anthropic: "claude-sonnet-4-6",
  deepseek: "deepseek-chat",
  google: "gemini-2.5-flash",
  compatible: "gpt-4o-mini",
}

function env(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

function parseProvider(raw: string | undefined): AiProvider {
  const value = (raw ?? "openai").toLowerCase()
  if (
    value === "openai" ||
    value === "anthropic" ||
    value === "deepseek" ||
    value === "google" ||
    value === "compatible"
  ) {
    return value
  }
  throw new Error(
    `AI_PROVIDER inválido: "${raw}". Usa openai | anthropic | deepseek | google | compatible.`,
  )
}

export function getAiProvider(): AiProvider {
  return parseProvider(env("AI_PROVIDER"))
}

/** True when the active provider has the credentials it needs. */
export function isAiConfigured(): boolean {
  try {
    const provider = getAiProvider()
    switch (provider) {
      case "openai":
        return Boolean(env("OPENAI_API_KEY"))
      case "anthropic":
        return Boolean(env("ANTHROPIC_API_KEY"))
      case "deepseek":
        return Boolean(env("DEEPSEEK_API_KEY"))
      case "google":
        return Boolean(env("GOOGLE_GENERATIVE_AI_API_KEY") || env("GOOGLE_API_KEY"))
      case "compatible":
        return Boolean(env("AI_API_KEY") && env("AI_BASE_URL"))
      default:
        return false
    }
  } catch {
    return false
  }
}

export function getAiConfigHint(): string {
  try {
    const provider = getAiProvider()
    switch (provider) {
      case "openai":
        return "OPENAI_API_KEY"
      case "anthropic":
        return "ANTHROPIC_API_KEY"
      case "deepseek":
        return "DEEPSEEK_API_KEY"
      case "google":
        return "GOOGLE_GENERATIVE_AI_API_KEY"
      case "compatible":
        return "AI_API_KEY + AI_BASE_URL"
    }
  } catch {
    return "AI_PROVIDER / API keys"
  }
}

/**
 * Language model for the active provider.
 *
 * Env:
 * - AI_PROVIDER=openai|anthropic|deepseek|google|compatible
 * - AI_MODEL=optional model id override
 * - OPENAI_API_KEY / ANTHROPIC_API_KEY / DEEPSEEK_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY
 * - For compatible (Groq, Together, Ollama, etc.):
 *     AI_BASE_URL + AI_API_KEY (+ optional AI_COMPATIBLE_NAME)
 */
export function getLanguageModel(): LanguageModel {
  const provider = getAiProvider()
  const modelId = env("AI_MODEL") || DEFAULT_MODELS[provider]

  switch (provider) {
    case "openai": {
      const apiKey = env("OPENAI_API_KEY")
      if (!apiKey) throw new Error("OPENAI_API_KEY no está configurado")
      return createOpenAI({ apiKey })(modelId)
    }
    case "anthropic": {
      const apiKey = env("ANTHROPIC_API_KEY")
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurado")
      return createAnthropic({ apiKey })(modelId)
    }
    case "deepseek": {
      const apiKey = env("DEEPSEEK_API_KEY")
      if (!apiKey) throw new Error("DEEPSEEK_API_KEY no está configurado")
      return createDeepSeek({ apiKey })(modelId)
    }
    case "google": {
      const apiKey = env("GOOGLE_GENERATIVE_AI_API_KEY") || env("GOOGLE_API_KEY")
      if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY no está configurado")
      return createGoogleGenerativeAI({ apiKey })(modelId)
    }
    case "compatible": {
      const apiKey = env("AI_API_KEY")
      const baseURL = env("AI_BASE_URL")
      if (!apiKey || !baseURL) {
        throw new Error("AI_API_KEY y AI_BASE_URL son requeridos para AI_PROVIDER=compatible")
      }
      return createOpenAICompatible({
        name: env("AI_COMPATIBLE_NAME") || "compatible",
        apiKey,
        baseURL,
      })(modelId)
    }
  }
}

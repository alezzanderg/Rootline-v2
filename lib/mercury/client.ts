import { getMercuryApiBaseUrl, getMercuryApiToken } from "@/lib/mercury/config"

export class MercuryApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string
  ) {
    super(message)
    this.name = "MercuryApiError"
  }
}

type MercuryRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
}

export async function mercuryRequest<T>(path: string, options: MercuryRequestOptions = {}): Promise<T> {
  const token = getMercuryApiToken()
  if (!token) {
    throw new MercuryApiError("MERCURY_API_TOKEN is not configured", 0)
  }

  const response = await fetch(`${getMercuryApiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  })

  const text = await response.text()
  if (!response.ok) {
    throw new MercuryApiError(
      `Mercury API ${options.method ?? "GET"} ${path} failed (${response.status})`,
      response.status,
      text || undefined
    )
  }

  if (!text) return {} as T
  return JSON.parse(text) as T
}

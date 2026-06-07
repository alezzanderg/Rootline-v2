const MERCURY_API_BASE = "https://api.mercury.com/api/v1"
const MERCURY_PAY_BASE = "https://app.mercury.com/pay"
const MERCURY_TOKEN_PREFIX = "secret-token:"

/** Normalize common .env mistakes (quotes, missing prefix, accidental "Bearer "). */
export function normalizeMercuryApiToken(raw: string | undefined): string | null {
  if (!raw) return null

  let token = raw.trim().replace(/\r?\n/g, "")
  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim()
  }

  if (token.toLowerCase().startsWith("bearer ")) {
    token = token.slice(7).trim()
  }

  if (!token.startsWith(MERCURY_TOKEN_PREFIX) && /^mercury_(production|sandbox)_/i.test(token)) {
    token = `${MERCURY_TOKEN_PREFIX}${token}`
  }

  return token || null
}

export function getMercuryApiToken(): string | null {
  return normalizeMercuryApiToken(process.env.MERCURY_API_TOKEN)
}

export function hasValidMercuryTokenFormat(): boolean {
  const token = getMercuryApiToken()
  return Boolean(token?.startsWith(MERCURY_TOKEN_PREFIX))
}

export function getMercuryDestinationAccountId(): string | null {
  const id = process.env.MERCURY_DESTINATION_ACCOUNT_ID?.trim()
  return id || null
}

export function isMercuryConfigured(): boolean {
  return Boolean(getMercuryApiToken() && getMercuryDestinationAccountId())
}

export function getMercuryApiBaseUrl(): string {
  return MERCURY_API_BASE
}

export function getMercuryPayUrl(slug: string): string {
  return `${MERCURY_PAY_BASE}/${slug}`
}

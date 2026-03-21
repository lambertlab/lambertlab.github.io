export interface HomeCard {
  accent: string
  title: string
  description: string
  href: string
  external: boolean
}

export interface HomeSnapshot {
  source: string
  fetchedAt: string | null
  technology: HomeCard[]
  life: HomeCard[]
}

interface HomeResponse {
  ok: true
  source?: unknown
  fetched_at?: unknown
  technology?: unknown
  life?: unknown
}

export class HomeApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'HomeApiError'
    this.status = status
  }
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes'
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  return false
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getRuntimeConfig(): { API_BASE?: string; REQUEST_TIMEOUT_MS?: number; HOME_PATH?: string } | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.__APP_CONFIG__
}

function getRuntimeApiBase(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const configuredBase = toText(getRuntimeConfig()?.API_BASE)
  const origin = window.location.origin
  if (!configuredBase) {
    return origin
  }

  return configuredBase.endsWith('/') ? configuredBase.slice(0, -1) : configuredBase
}

function getHomePath(): string {
  const configuredPath = toText(getRuntimeConfig()?.HOME_PATH)
  if (!configuredPath) {
    return '/home'
  }

  return configuredPath.startsWith('/') ? configuredPath : `/${configuredPath}`
}

function getTimeoutMs(): number {
  const timeoutMs = getRuntimeConfig()?.REQUEST_TIMEOUT_MS
  if (typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return Math.floor(timeoutMs)
  }

  return 3000
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const timeoutMs = getTimeoutMs()
  const controller = typeof AbortController === 'function' ? new AbortController() : null
  const timerId =
    controller &&
    window.setTimeout(() => {
      controller.abort()
    }, timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: signal ?? controller?.signal,
    })

    if (!response.ok) {
      let detail = ''
      try {
        const body = (await response.json()) as { detail?: unknown }
        detail = toText(body.detail)
      } catch {
        detail = ''
      }

      throw new HomeApiError(detail || `HTTP_${response.status}`, response.status)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof HomeApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new HomeApiError('Home request timed out.')
    }

    if (error instanceof Error) {
      throw new HomeApiError(error.message)
    }

    throw new HomeApiError('Unknown home request error.')
  } finally {
    if (timerId) {
      window.clearTimeout(timerId)
    }
  }
}

function normalizeHomeCard(value: unknown): HomeCard {
  const record = isRecord(value) ? value : {}
  return {
    accent: toText(record.accent),
    title: toText(record.title),
    description: toText(record.description),
    href: toText(record.href),
    external: toBoolean(record.external),
  }
}

function normalizeHomeCardArray(value: unknown): HomeCard[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((entry) => normalizeHomeCard(entry))
}

function normalizeFetchedAt(value: unknown): string | null {
  const text = toText(value)
  return text || null
}

export async function fetchHome(signal?: AbortSignal): Promise<HomeSnapshot> {
  const response = await fetchJson<HomeResponse>(`${getRuntimeApiBase()}${getHomePath()}`, signal)
  if (!response || response.ok !== true || !isRecord(response)) {
    throw new HomeApiError('Home payload is invalid.')
  }

  return {
    source: toText(response.source) || 'database',
    fetchedAt: normalizeFetchedAt(response.fetched_at),
    technology: normalizeHomeCardArray(response.technology),
    life: normalizeHomeCardArray(response.life),
  }
}

declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_BASE?: string
      REQUEST_TIMEOUT_MS?: number
      STATUS_PUBLIC_PATH?: string
      HOME_PATH?: string
    }
  }
}

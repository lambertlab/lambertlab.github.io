export type PublicStatusTone = 'green' | 'yellow' | 'red'
export type PublicSurfaceHealth = 'up' | 'degraded' | 'down' | 'unknown'
export type ContentFreshnessLevel = 'fresh' | 'aging' | 'stale' | 'unknown'
export type KnownIssueLevel = 'info' | 'warn'

export interface StatusOverallSummary {
  status: PublicStatusTone
  summary: string
  updated_at: string | null
}

export interface StatusPublicSurfaceSummary {
  status: PublicStatusTone
  label: string
}

export interface StatusKeySurface {
  key: string
  label: string
  path: string
  health: PublicSurfaceHealth
  note: string
}

export interface StatusContentFreshnessArea {
  key: string
  label: string
  freshness: ContentFreshnessLevel
  updated_at: string | null
  note: string
}

export interface StatusKnownIssue {
  level: KnownIssueLevel
  title: string
  detail: string
}

export interface StatusPublicPagePayload {
  overall_status: StatusOverallSummary
  public_surface: {
    summary: StatusPublicSurfaceSummary
    key_surfaces: StatusKeySurface[]
  }
  content_freshness: {
    summary: StatusPublicSurfaceSummary
    areas: StatusContentFreshnessArea[]
    active_focus: string | null
  }
  known_issues: StatusKnownIssue[]
}

interface StatusPublicResponse {
  ok: true
  page: unknown
}

export class StatusPublicApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'StatusPublicApiError'
    this.status = status
  }
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNullableText(value: unknown): string | null {
  const text = toText(value)
  return text || null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeTone(value: unknown): PublicStatusTone {
  const tone = toText(value).toLowerCase()
  if (tone === 'yellow' || tone === 'red') {
    return tone
  }
  return 'green'
}

function normalizeSurfaceHealth(value: unknown): PublicSurfaceHealth {
  const health = toText(value).toLowerCase()
  if (health === 'degraded' || health === 'down' || health === 'unknown') {
    return health
  }
  return 'up'
}

function normalizeFreshness(value: unknown): ContentFreshnessLevel {
  const freshness = toText(value).toLowerCase()
  if (freshness === 'aging' || freshness === 'stale' || freshness === 'unknown') {
    return freshness
  }
  return 'fresh'
}

function normalizeIssueLevel(value: unknown): KnownIssueLevel {
  return toText(value).toLowerCase() === 'warn' ? 'warn' : 'info'
}

function normalizeSummary(value: unknown, fallbackLabel: string): StatusPublicSurfaceSummary {
  const summary = isRecord(value) ? value : {}

  return {
    status: normalizeTone(summary.status),
    label: toText(summary.label) || fallbackLabel,
  }
}

function normalizeOverallStatus(value: unknown): StatusOverallSummary {
  const overall = isRecord(value) ? value : {}

  return {
    status: normalizeTone(overall.status),
    summary: toText(overall.summary) || 'Public summary is being refreshed.',
    updated_at: normalizeNullableText(overall.updated_at),
  }
}

function normalizeKeySurfaces(value: unknown): StatusKeySurface[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      const surface = isRecord(entry) ? entry : {}
      const label = toText(surface.label)
      const path = toText(surface.path)

      if (!label || !path) {
        return null
      }

      return {
        key: toText(surface.key) || label.toLowerCase(),
        label,
        path,
        health: normalizeSurfaceHealth(surface.health),
        note: toText(surface.note) || 'Public summary is not available yet.',
      }
    })
    .filter((entry): entry is StatusKeySurface => entry !== null)
}

function normalizeFreshnessAreas(value: unknown): StatusContentFreshnessArea[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      const area = isRecord(entry) ? entry : {}
      const label = toText(area.label)

      if (!label) {
        return null
      }

      return {
        key: toText(area.key) || label.toLowerCase(),
        label,
        freshness: normalizeFreshness(area.freshness),
        updated_at: normalizeNullableText(area.updated_at),
        note: toText(area.note) || 'Freshness detail is not available yet.',
      }
    })
    .filter((entry): entry is StatusContentFreshnessArea => entry !== null)
}

function normalizeKnownIssues(value: unknown): StatusKnownIssue[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      const issue = isRecord(entry) ? entry : {}
      const title = toText(issue.title)
      const detail = toText(issue.detail)

      if (!title || !detail) {
        return null
      }

      return {
        level: normalizeIssueLevel(issue.level),
        title,
        detail,
      }
    })
    .filter((entry): entry is StatusKnownIssue => entry !== null)
}

function normalizeStatusPublicPage(value: unknown): StatusPublicPagePayload {
  const page = isRecord(value) ? value : {}
  const publicSurface = isRecord(page.public_surface) ? page.public_surface : {}
  const contentFreshness = isRecord(page.content_freshness) ? page.content_freshness : {}

  return {
    overall_status: normalizeOverallStatus(page.overall_status),
    public_surface: {
      summary: normalizeSummary(publicSurface.summary, 'Public surface summary is unavailable.'),
      key_surfaces: normalizeKeySurfaces(publicSurface.key_surfaces),
    },
    content_freshness: {
      summary: normalizeSummary(contentFreshness.summary, 'Content freshness summary is unavailable.'),
      areas: normalizeFreshnessAreas(contentFreshness.areas),
      active_focus: normalizeNullableText(contentFreshness.active_focus),
    },
    known_issues: normalizeKnownIssues(page.known_issues),
  }
}

function getRuntimeConfig(): { API_BASE?: string; REQUEST_TIMEOUT_MS?: number; STATUS_PUBLIC_PATH?: string } | undefined {
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

function getStatusPublicPath(): string {
  const configuredPath = toText(getRuntimeConfig()?.STATUS_PUBLIC_PATH)
  if (!configuredPath) {
    return '/status/public'
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

      throw new StatusPublicApiError(detail || `HTTP_${response.status}`, response.status)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof StatusPublicApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new StatusPublicApiError('Status summary request timed out.')
    }

    if (error instanceof Error) {
      throw new StatusPublicApiError(error.message)
    }

    throw new StatusPublicApiError('Unknown status summary request error.')
  } finally {
    if (timerId) {
      window.clearTimeout(timerId)
    }
  }
}

export async function fetchStatusPublicPage(signal?: AbortSignal): Promise<StatusPublicPagePayload> {
  const response = await fetchJson<StatusPublicResponse>(`${getRuntimeApiBase()}${getStatusPublicPath()}`, signal)
  if (!response || response.ok !== true || !isRecord(response) || !('page' in response)) {
    throw new StatusPublicApiError('Status summary payload is invalid.')
  }

  return normalizeStatusPublicPage(response.page)
}

declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_BASE?: string
      REQUEST_TIMEOUT_MS?: number
      STATUS_PUBLIC_PATH?: string
    }
  }
}

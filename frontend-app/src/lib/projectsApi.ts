export interface ProjectLinks {
  primary: string | null
  repo: string | null
  demo: string | null
  docs: string | null
  notes: string | null
}

export interface ProjectSourceRefs {
  repo_full_name: string | null
  repo_url: string | null
  visibility: string | null
}

export interface ProjectDetailRecord {
  project_key: string
  slug: string
  canonical_path: string
  name: string
  summary: string
  headline: string
  overview: string
  stage: string
  source_type: string
  project_type: string
  stack: string[]
  is_featured: boolean
  featured_rank: number | null
  status_note: string | null
  highlights: string[]
  links: ProjectLinks
  source_refs: ProjectSourceRefs
  updated_at: string | null
  synced_at: string | null
}

interface ProjectDetailResponse {
  ok: true
  project: Partial<ProjectDetailRecord> & Record<string, unknown>
}

export class ProjectApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ProjectApiError'
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

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => toText(item))
    .filter((item, index, items) => item.length > 0 && items.indexOf(item) === index)
}

function normalizeLinks(value: unknown): ProjectLinks {
  const links = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  return {
    primary: normalizeNullableText(links.primary),
    repo: normalizeNullableText(links.repo),
    demo: normalizeNullableText(links.demo),
    docs: normalizeNullableText(links.docs),
    notes: normalizeNullableText(links.notes),
  }
}

function normalizeSourceRefs(value: unknown): ProjectSourceRefs {
  const refs = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  return {
    repo_full_name: normalizeNullableText(refs.repo_full_name),
    repo_url: normalizeNullableText(refs.repo_url),
    visibility: normalizeNullableText(refs.visibility),
  }
}

function normalizeCanonicalPath(slug: string, value: unknown): string {
  const canonicalPath = toText(value)
  if (canonicalPath) {
    return canonicalPath.endsWith('/') ? canonicalPath : `${canonicalPath}/`
  }
  return `/projects/${encodeURIComponent(slug)}/`
}

function getRuntimeApiBase(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const runtimeConfig = window.__APP_CONFIG__ as { API_BASE?: string; REQUEST_TIMEOUT_MS?: number } | undefined
  const configuredBase = toText(runtimeConfig?.API_BASE)
  const origin = window.location.origin

  if (!configuredBase) {
    return origin
  }

  return configuredBase.endsWith('/') ? configuredBase.slice(0, -1) : configuredBase
}

function getTimeoutMs(): number {
  if (typeof window === 'undefined') {
    return 3000
  }

  const runtimeConfig = window.__APP_CONFIG__ as { REQUEST_TIMEOUT_MS?: number } | undefined
  if (typeof runtimeConfig?.REQUEST_TIMEOUT_MS === 'number' && runtimeConfig.REQUEST_TIMEOUT_MS > 0) {
    return Math.floor(runtimeConfig.REQUEST_TIMEOUT_MS)
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

      throw new ProjectApiError(detail || `HTTP_${response.status}`, response.status)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ProjectApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ProjectApiError('Project request timed out.')
    }

    if (error instanceof Error) {
      throw new ProjectApiError(error.message)
    }

    throw new ProjectApiError('Unknown project request error.')
  } finally {
    if (timerId) {
      window.clearTimeout(timerId)
    }
  }
}

export function normalizeProjectDetail(payload: Partial<ProjectDetailRecord> & Record<string, unknown>): ProjectDetailRecord {
  const slug = toText(payload.slug)

  return {
    project_key: toText(payload.project_key),
    slug,
    canonical_path: normalizeCanonicalPath(slug, payload.canonical_path),
    name: toText(payload.name),
    summary: toText(payload.summary),
    headline: toText(payload.headline),
    overview: toText(payload.overview),
    stage: toText(payload.stage),
    source_type: toText(payload.source_type),
    project_type: toText(payload.project_type),
    stack: normalizeStringArray(payload.stack),
    is_featured: payload.is_featured === true,
    featured_rank:
      typeof payload.featured_rank === 'number' && Number.isFinite(payload.featured_rank) && payload.featured_rank > 0
        ? Math.round(payload.featured_rank)
        : null,
    status_note: normalizeNullableText(payload.status_note),
    highlights: normalizeStringArray(payload.highlights),
    links: normalizeLinks(payload.links),
    source_refs: normalizeSourceRefs(payload.source_refs),
    updated_at: normalizeNullableText(payload.updated_at),
    synced_at: normalizeNullableText(payload.synced_at),
  }
}

export async function fetchProjectDetail(slug: string, signal?: AbortSignal): Promise<ProjectDetailRecord> {
  const value = toText(slug)
  if (!value) {
    throw new ProjectApiError('Project slug is required.')
  }

  const response = await fetchJson<ProjectDetailResponse>(`${getRuntimeApiBase()}/projects/${encodeURIComponent(value)}`, signal)
  if (!response?.project || typeof response.project !== 'object') {
    throw new ProjectApiError('Project detail payload is invalid.')
  }

  return normalizeProjectDetail(response.project)
}

declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_BASE?: string
      REQUEST_TIMEOUT_MS?: number
    }
  }
}

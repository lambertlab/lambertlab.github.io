import {
  normalizeProjectCanonicalPath,
  normalizeProjectCatalogRecord,
  normalizeProjectFeaturedRank,
  normalizeProjectHighlightArray,
  normalizeProjectLinks,
  normalizeProjectRepositories,
  normalizeProjectSourceRefs,
  normalizeProjectStringArray,
  normalizeProjectTagArray,
  normalizeNullableProjectText,
} from '~/features/projects/model/projectNormalize'
import type {
  FetchProjectsListOptions,
  ProjectCatalogRecord,
  ProjectLinks,
  ProjectRepository,
  ProjectSourceRefs,
} from '~/features/projects/model/projectTypes'

interface ProjectListResponse {
  ok: true
  projects: Array<Record<string, unknown>>
}
export interface ProjectDetailRecord {
  slug: string
  canonical_path: string
  name: string
  summary: string
  overview: string
  stage: string
  source_type: string
  project_type: string
  stack: string[]
  tags: string[]
  is_featured: boolean
  featured_rank: number | null
  status_note: string | null
  highlights: string[]
  links: ProjectLinks
  repositories: ProjectRepository[]
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
        const body = (await response.json()) as {
          detail?: unknown
          error?: { message?: unknown; code?: unknown } | null
        }

        detail = toText(body.detail) || toText(body.error?.message) || toText(body.error?.code)
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

export async function fetchProjectsList(options: FetchProjectsListOptions = {}): Promise<{ projects: ProjectCatalogRecord[] }> {
  const pathname = options.featuredOnly === true ? '/projects/featured' : '/projects'
  const response = await fetchJson<ProjectListResponse>(`${getRuntimeApiBase()}${pathname}`, options.signal)
  if (!Array.isArray(response?.projects)) {
    throw new ProjectApiError('Projects payload is invalid.')
  }

  return {
    projects: response.projects.map((project, index) => normalizeProjectCatalogRecord(project, index)),
  }
}
export function normalizeProjectDetail(payload: Partial<ProjectDetailRecord> & Record<string, unknown>): ProjectDetailRecord {
  const slug = toText(payload.slug)
  const repositories = normalizeProjectRepositories(payload.repositories)
  const normalizedLinks = normalizeProjectLinks(payload.links)

  return {
    slug,
    canonical_path: normalizeProjectCanonicalPath(slug, payload.canonical_path),
    name: toText(payload.name),
    summary: toText(payload.summary),
    overview: toText(payload.overview),
    stage: toText(payload.stage),
    source_type: toText(payload.source_type),
    project_type: toText(payload.project_type),
    stack: normalizeProjectStringArray(payload.stack),
    tags: normalizeProjectTagArray(payload.tags),
    is_featured: payload.is_featured === true,
    featured_rank: normalizeProjectFeaturedRank(payload.featured_rank),
    status_note: normalizeNullableProjectText(payload.status_note),
    highlights: normalizeProjectHighlightArray(payload.highlights),
    links: normalizedLinks,
    repositories,
    source_refs: normalizeProjectSourceRefs(payload.source_refs),
    updated_at: normalizeNullableProjectText(payload.updated_at),
    synced_at: normalizeNullableProjectText(payload.synced_at),
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
      STATUS_PUBLIC_PATH?: string
      HOME_CONTENT_PATH?: string
    }
  }
}

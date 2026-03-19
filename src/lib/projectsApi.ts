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
  ProjectLinkItem,
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
  headline: string
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
  link_items: ProjectLinkItem[]
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

function toInteger(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value)
  }

  if (typeof value !== 'string') {
    return 0
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

function parseTimeScore(value: unknown): number {
  const text = toText(value)
  if (!text) {
    return 0
  }

  const parsed = Date.parse(text)
  return Number.isNaN(parsed) ? 0 : parsed
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function normalizeNullableText(value: unknown): string | null {
  const text = toText(value)
  return text || null
}

function normalizeTextArray(value: unknown, objectKeys: string[] = []): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const uniqueTexts = new Set<string>()

  value.forEach((entry) => {
    let text = toText(entry)
    if (!text) {
      const record = toRecord(entry)
      if (record) {
        for (const key of objectKeys) {
          text = toText(record[key])
          if (text) {
            break
          }
        }
      }
    }

    if (!text) {
      return
    }

    uniqueTexts.add(text)
  })

  return [...uniqueTexts]
}

function normalizeStringArray(value: unknown): string[] {
  return normalizeTextArray(value)
}

function normalizeTagArray(value: unknown): string[] {
  return normalizeTextArray(value, ['name', 'label', 'tag', 'slug', 'value'])
}

function normalizeHighlightArray(value: unknown): string[] {
  return normalizeTextArray(value, ['text', 'title', 'content', 'summary', 'name'])
}

function normalizeLinkType(value: unknown): string | null {
  const normalized = toText(value).toLowerCase().replace(/[_\s]+/g, '-')
  return normalized || null
}

function buildDefaultLinkLabel(type: string | null): string {
  if (!type) return 'Link'
  if (type === 'primary' || type === 'homepage' || type === 'main' || type === 'home') return 'Primary'
  if (type === 'repo' || type === 'repository' || type === 'github') return 'Repository'
  if (type === 'demo' || type === 'preview') return 'Demo'
  if (type === 'docs' || type === 'documentation') return 'Docs'
  if (type === 'notes' || type === 'note') return 'Notes'
  return type
}

function normalizeLinkItems(value: unknown): ProjectLinkItem[] {
  const linksRecord = toRecord(value)
  const rawItems: unknown[] = []

  if (Array.isArray(value)) {
    rawItems.push(...value)
  }

  if (linksRecord) {
    if (Array.isArray(linksRecord.items)) {
      rawItems.push(...linksRecord.items)
    }

    if (Array.isArray(linksRecord.links)) {
      rawItems.push(...linksRecord.links)
    }

    const legacyKeys: Array<{ type: string; key: keyof ProjectLinks }> = [
      { type: 'primary', key: 'primary' },
      { type: 'repo', key: 'repo' },
      { type: 'demo', key: 'demo' },
      { type: 'docs', key: 'docs' },
      { type: 'notes', key: 'notes' },
    ]

    legacyKeys.forEach(({ type, key }) => {
      const href = normalizeNullableText(linksRecord[key])
      if (!href) {
        return
      }

      rawItems.push({
        type,
        href,
      })
    })
  }

  const dedupeKeys = new Set<string>()
  const normalizedItems: ProjectLinkItem[] = []

  rawItems.forEach((entry, index) => {
    if (typeof entry === 'string') {
      const href = normalizeNullableText(entry)
      if (!href) {
        return
      }

      const dedupeKey = href.toLowerCase()
      if (dedupeKeys.has(dedupeKey)) {
        return
      }

      dedupeKeys.add(dedupeKey)
      normalizedItems.push({
        key: `link-${index}`,
        label: 'Link',
        href,
        type: null,
      })
      return
    }

    const record = toRecord(entry)
    if (!record) {
      return
    }

    const href = normalizeNullableText(record.href ?? record.url ?? record.link ?? record.value)
    if (!href) {
      return
    }

    const dedupeKey = href.toLowerCase()
    if (dedupeKeys.has(dedupeKey)) {
      return
    }

    dedupeKeys.add(dedupeKey)
    const type = normalizeLinkType(record.type)
    const label = toText(record.label ?? record.title ?? record.name) || buildDefaultLinkLabel(type)

    normalizedItems.push({
      key: `${type || 'link'}-${index}`,
      label,
      href,
      type,
    })
  })

  return normalizedItems
}

function pickLinkByType(items: ProjectLinkItem[], types: string[]): string | null {
  const acceptedTypes = new Set(types)
  const matched = items.find((item) => item.type && acceptedTypes.has(item.type))
  return matched?.href ?? null
}

function normalizeRepositories(value: unknown): ProjectRepository[] {
  const payloadRecord = toRecord(value)
  const rawItems: unknown[] = []

  if (Array.isArray(value)) {
    rawItems.push(...value)
  }

  if (payloadRecord) {
    if (Array.isArray(payloadRecord.items)) {
      rawItems.push(...payloadRecord.items)
    }

    if (Array.isArray(payloadRecord.repositories)) {
      rawItems.push(...payloadRecord.repositories)
    }

    if (Array.isArray(payloadRecord.repos)) {
      rawItems.push(...payloadRecord.repos)
    }
  }

  const dedupeKeys = new Set<string>()
  const repositories: ProjectRepository[] = []

  rawItems.forEach((entry, index) => {
    const record = toRecord(entry)
    if (!record) {
      return
    }

    const fullName =
      normalizeNullableText(record.full_name ?? record.repo_full_name ?? record.repository_full_name) ?? null
    const explicitName = normalizeNullableText(record.name ?? record.repo_name)
    const derivedName = fullName ? fullName.split('/').pop() || '' : ''
    const name = explicitName || derivedName
    const url = normalizeNullableText(record.url ?? record.repo_url ?? record.html_url ?? record.homepage)
    const visibility = normalizeNullableText(record.visibility)
    const isPrimary = record.is_primary === true || record.primary === true

    if (!name && !fullName && !url) {
      return
    }

    const dedupeKey = (fullName || url || `${name}-${index}`).toLowerCase()
    if (dedupeKeys.has(dedupeKey)) {
      return
    }

    dedupeKeys.add(dedupeKey)
    repositories.push({
      name: name || fullName || `repository-${index + 1}`,
      full_name: fullName,
      url,
      visibility,
      is_primary: isPrimary,
    })
  })

  if (repositories.length > 0 && !repositories.some((item) => item.is_primary)) {
    repositories[0] = {
      ...repositories[0],
      is_primary: true,
    }
  }

  return repositories
}

function normalizeLinks(value: unknown, repositories: ProjectRepository[]): { links: ProjectLinks; items: ProjectLinkItem[] } {
  const linksRecord = toRecord(value) ?? {}
  const items = normalizeLinkItems(value)
  const repositoryFromList = repositories.find((item) => item.is_primary)?.url ?? repositories[0]?.url ?? null

  let primary = normalizeNullableText(linksRecord.primary)
  let repo = normalizeNullableText(linksRecord.repo)
  let demo = normalizeNullableText(linksRecord.demo)
  let docs = normalizeNullableText(linksRecord.docs)
  let notes = normalizeNullableText(linksRecord.notes)

  if (!primary) {
    primary = pickLinkByType(items, ['primary', 'homepage', 'home', 'main', 'default'])
  }

  if (!repo) {
    repo = pickLinkByType(items, ['repo', 'repository', 'github'])
  }

  if (!demo) {
    demo = pickLinkByType(items, ['demo', 'preview'])
  }

  if (!docs) {
    docs = pickLinkByType(items, ['docs', 'documentation'])
  }

  if (!notes) {
    notes = pickLinkByType(items, ['notes', 'note'])
  }

  if (!repo) {
    repo = repositoryFromList
  }

  if (!primary) {
    primary = items[0]?.href ?? repo ?? null
  }

  return {
    links: {
      primary,
      repo,
      demo,
      docs,
      notes,
    },
    items,
  }
}

function normalizeSourceRefs(
  value: unknown,
  repositories: ProjectRepository[],
  fallbackRepositoryUrl: string | null,
): ProjectSourceRefs {
  const refs = toRecord(value) ?? {}
  const primaryRepository = repositories.find((item) => item.is_primary) ?? repositories[0]

  return {
    repo_full_name: normalizeNullableText(refs.repo_full_name) ?? primaryRepository?.full_name ?? null,
    repo_url: normalizeNullableText(refs.repo_url) ?? primaryRepository?.url ?? fallbackRepositoryUrl ?? null,
    visibility: normalizeNullableText(refs.visibility) ?? primaryRepository?.visibility ?? null,
  }
}

function normalizeCanonicalPath(slug: string, value: unknown): string {
  const canonicalPath = toText(value)
  if (canonicalPath) {
    return canonicalPath.endsWith('/') ? canonicalPath : `${canonicalPath}/`
  }

  if (!slug) {
    return '/projects/'
  }

  return `/projects/${encodeURIComponent(slug)}/`
}

function normalizeFeaturedRank(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null
  }

  return Math.round(value)
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
  const normalizedLinks = normalizeProjectLinks(payload.links, repositories)

  return {
    slug,
    canonical_path: normalizeProjectCanonicalPath(slug, payload.canonical_path),
    name: toText(payload.name),
    summary: toText(payload.summary),
    headline: toText(payload.headline),
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
    links: normalizedLinks.links,
    link_items: normalizedLinks.items,
    repositories,
    source_refs: normalizeProjectSourceRefs(payload.source_refs, repositories, normalizedLinks.links.repo),
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




import {
  PROJECT_CATALOG_SORT_VALUES,
  PROJECT_CATALOG_SOURCE_VALUES,
  PROJECT_CATALOG_STAGE_VALUES,
  PROJECT_CATALOG_TYPE_VALUES,
  type ProjectCatalogQueryState,
  type ProjectCatalogRecord,
  type ProjectCatalogSort,
  type ProjectCatalogSourceFilter,
  type ProjectCatalogStageFilter,
  type ProjectCatalogTypeFilter,
  type ProjectLinks,
  type ProjectRepository,
  type ProjectSourceRefs,
} from './projectTypes'

export function toProjectText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function toProjectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

export function toProjectInteger(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value)
  }

  if (typeof value !== 'string') {
    return 0
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function normalizeNullableProjectText(value: unknown): string | null {
  const text = toProjectText(value)
  return text || null
}

export function parseProjectTimeScore(value: unknown): number {
  const text = toProjectText(value)
  if (!text) {
    return 0
  }

  const parsed = Date.parse(text)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function normalizeProjectTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const uniqueTexts = new Set<string>()

  value.forEach((entry) => {
    const text = toProjectText(entry)
    if (!text) {
      return
    }

    uniqueTexts.add(text)
  })

  return [...uniqueTexts]
}

export function normalizeProjectStringArray(value: unknown): string[] {
  return normalizeProjectTextArray(value)
}

export function normalizeProjectTagArray(value: unknown): string[] {
  return normalizeProjectTextArray(value)
}

export function normalizeProjectHighlightArray(value: unknown): string[] {
  return normalizeProjectTextArray(value)
}

export function normalizeProjectRepositories(value: unknown): ProjectRepository[] {
  if (!Array.isArray(value)) {
    return []
  }

  const dedupeKeys = new Set<string>()
  const repositories: ProjectRepository[] = []

  value.forEach((entry, index) => {
    const record = toProjectRecord(entry)
    if (!record) {
      return
    }

    const fullName = normalizeNullableProjectText(record.repo_full_name) ?? null
    const explicitName = normalizeNullableProjectText(record.repo_name)
    const derivedName = fullName ? fullName.split('/').pop() || '' : ''
    const name = explicitName || derivedName
    const url = normalizeNullableProjectText(record.repo_url)
    const visibility = normalizeNullableProjectText(record.visibility)
    const isPrimary = record.is_primary === true

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

  return repositories
}
export function normalizeProjectLinks(value: unknown): ProjectLinks {
  const linksRecord = toProjectRecord(value) ?? {}

  return {
    primary: normalizeNullableProjectText(linksRecord.primary),
    repo: normalizeNullableProjectText(linksRecord.repo),
    demo: normalizeNullableProjectText(linksRecord.demo),
    docs: normalizeNullableProjectText(linksRecord.docs),
    notes: normalizeNullableProjectText(linksRecord.notes),
  }
}

export function normalizeProjectSourceRefs(
  value: unknown,
): ProjectSourceRefs {
  const refs = toProjectRecord(value) ?? {}

  return {
    repo_full_name: normalizeNullableProjectText(refs.repo_full_name),
    repo_url: normalizeNullableProjectText(refs.repo_url),
    visibility: normalizeNullableProjectText(refs.visibility),
  }
}

export function normalizeProjectCanonicalPath(slug: string, value: unknown): string {
  const canonicalPath = toProjectText(value)
  if (canonicalPath) {
    return canonicalPath.endsWith('/') ? canonicalPath : `${canonicalPath}/`
  }

  if (!slug) {
    return '/projects/'
  }

  return `/projects/${encodeURIComponent(slug)}/`
}

export function normalizeProjectFeaturedRank(value: unknown): number | null {
  const normalizedValue = toProjectInteger(value)
  if (normalizedValue <= 0) {
    return null
  }

  return normalizedValue
}

function normalizeCatalogValue(value: string): string {
  return value.trim().toLowerCase().replace(/[_\s]+/g, '-')
}

function normalizeEnumValue<TValue extends string>(value: string, accepted: readonly TValue[], fallback: TValue): TValue {
  const normalizedValue = normalizeCatalogValue(value)
  const match = accepted.find((candidate) => candidate === normalizedValue)
  return match ?? fallback
}

function resolveCatalogProjectUrl(
  payload: Record<string, unknown>,
): string | null {
  return normalizeNullableProjectText(payload.url)
}

export function normalizeProjectCatalogRecord(payload: Record<string, unknown>, index = 0): ProjectCatalogRecord {
  const repositories = normalizeProjectRepositories(payload.repositories)
  const normalizedLinks = normalizeProjectLinks(payload.links)
  const sourceRefs = normalizeProjectSourceRefs(payload.source_refs)
  const fullName = normalizeNullableProjectText(payload.full_name)
  const fallbackName = fullName ? fullName.split('/').pop() || '' : ''
  const slug = toProjectText(payload.slug)
  const description = toProjectText(payload.description)
  const summary = toProjectText(payload.summary)
  const stage = toProjectText(payload.stage) || 'unknown'
  const sourceType = toProjectText(payload.source_type)
  const projectType = toProjectText(payload.project_type)
  const tags = normalizeProjectTagArray(payload.tags)
  const stack = normalizeProjectStringArray(payload.stack)
  const highlights = normalizeProjectHighlightArray(payload.highlights)
  const name = toProjectText(payload.name) || fallbackName || `project-${index + 1}`
  const pushedAt = normalizeNullableProjectText(payload.pushed_at)
  const updatedAt = normalizeNullableProjectText(payload.updated_at)
  const isActive = payload.is_active === true
  const archived = payload.archived === true
  const searchableRepositories = repositories.map((repository) => [repository.name, repository.full_name ?? ''].join(' ')).join(' ')
  const searchText = [
    name,
    fullName ?? '',
    summary,
    description,
    toProjectText(payload.language),
    stage,
    sourceType,
    projectType,
    slug,
    tags.join(' '),
    stack.join(' '),
    highlights.join(' '),
    searchableRepositories,
  ]
    .join(' ')
    .toLowerCase()

  return {
    id: typeof payload.id === 'number' || typeof payload.id === 'string' ? payload.id : null,
    slug,
    canonical_path: normalizeProjectCanonicalPath(slug, payload.canonical_path),
    name,
    summary,
    overview: toProjectText(payload.overview),
    stage,
    source_type: sourceType,
    project_type: projectType,
    stack,
    tags,
    is_featured: payload.is_featured === true,
    featured_rank: normalizeProjectFeaturedRank(payload.featured_rank),
    status_note: normalizeNullableProjectText(payload.status_note),
    highlights,
    links: normalizedLinks,
    repositories,
    source_refs: sourceRefs,
    updated_at: updatedAt,
    description,
    full_name: fullName,
    url: resolveCatalogProjectUrl(payload),
    language: normalizeNullableProjectText(payload.language),
    stars: toProjectInteger(payload.stargazers_count),
    forks: toProjectInteger(payload.forks_count),
    visibility: normalizeNullableProjectText(payload.visibility),
    source: normalizeNullableProjectText(payload.source),
    status: archived ? 'archived' : isActive ? 'active' : 'inactive',
    is_active: isActive,
    archived,
    pushed_at: pushedAt,
    recency_score: parseProjectTimeScore(updatedAt) || parseProjectTimeScore(pushedAt),
    search_text: searchText,
  }
}

export function normalizeProjectCatalogSearch(value: string): string {
  return value.trim()
}

export function normalizeProjectCatalogSort(value: string): ProjectCatalogSort {
  return normalizeEnumValue(value, PROJECT_CATALOG_SORT_VALUES, 'recent')
}

export function normalizeProjectCatalogStage(value: string): ProjectCatalogStageFilter {
  return normalizeEnumValue(value, PROJECT_CATALOG_STAGE_VALUES, 'all')
}

export function normalizeProjectCatalogSource(value: string): ProjectCatalogSourceFilter {
  return normalizeEnumValue(value, PROJECT_CATALOG_SOURCE_VALUES, 'all')
}

export function normalizeProjectCatalogType(value: string): ProjectCatalogTypeFilter {
  return normalizeEnumValue(value, PROJECT_CATALOG_TYPE_VALUES, 'all')
}

export function normalizeProjectCatalogQuery(input: Partial<ProjectCatalogQueryState> = {}): ProjectCatalogQueryState {
  return {
    search: normalizeProjectCatalogSearch(input.search ?? ''),
    sort: normalizeProjectCatalogSort(input.sort ?? 'recent'),
    stage: normalizeProjectCatalogStage(input.stage ?? 'all'),
    source: normalizeProjectCatalogSource(input.source ?? 'all'),
    type: normalizeProjectCatalogType(input.type ?? 'all'),
    featuredOnly: input.featuredOnly === true,
  }
}

export function normalizeProjectFacetValue(value: string): string {
  return normalizeCatalogValue(value)
}

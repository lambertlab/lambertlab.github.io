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
  type ProjectLinkItem,
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

export function normalizeProjectTextArray(value: unknown, objectKeys: string[] = []): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const uniqueTexts = new Set<string>()

  value.forEach((entry) => {
    let text = toProjectText(entry)
    if (!text) {
      const record = toProjectRecord(entry)
      if (record) {
        for (const key of objectKeys) {
          text = toProjectText(record[key])
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

export function normalizeProjectStringArray(value: unknown): string[] {
  return normalizeProjectTextArray(value)
}

export function normalizeProjectTagArray(value: unknown): string[] {
  return normalizeProjectTextArray(value, ['name', 'label', 'tag', 'slug', 'value'])
}

export function normalizeProjectHighlightArray(value: unknown): string[] {
  return normalizeProjectTextArray(value, ['text', 'title', 'content', 'summary', 'name'])
}

function normalizeLinkType(value: unknown): string | null {
  const normalized = toProjectText(value).toLowerCase().replace(/[_\s]+/g, '-')
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

export function normalizeProjectRepositories(value: unknown): ProjectRepository[] {
  const payloadRecord = toProjectRecord(value)
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
    const record = toProjectRecord(entry)
    if (!record) {
      return
    }

    const fullName =
      normalizeNullableProjectText(record.full_name ?? record.repo_full_name ?? record.repository_full_name) ?? null
    const explicitName = normalizeNullableProjectText(record.name ?? record.repo_name)
    const derivedName = fullName ? fullName.split('/').pop() || '' : ''
    const name = explicitName || derivedName
    const url = normalizeNullableProjectText(record.url ?? record.repo_url ?? record.html_url ?? record.homepage)
    const visibility = normalizeNullableProjectText(record.visibility)
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

export function normalizeProjectLinkItems(value: unknown): ProjectLinkItem[] {
  const linksRecord = toProjectRecord(value)
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
      const href = normalizeNullableProjectText(linksRecord[key])
      if (!href) {
        return
      }

      rawItems.push({ type, href })
    })
  }

  const dedupeKeys = new Set<string>()
  const normalizedItems: ProjectLinkItem[] = []

  rawItems.forEach((entry, index) => {
    if (typeof entry === 'string') {
      const href = normalizeNullableProjectText(entry)
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

    const record = toProjectRecord(entry)
    if (!record) {
      return
    }

    const href = normalizeNullableProjectText(record.href ?? record.url ?? record.link ?? record.value)
    if (!href) {
      return
    }

    const dedupeKey = href.toLowerCase()
    if (dedupeKeys.has(dedupeKey)) {
      return
    }

    dedupeKeys.add(dedupeKey)
    const type = normalizeLinkType(record.type)
    const label = toProjectText(record.label ?? record.title ?? record.name) || buildDefaultLinkLabel(type)

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

export function normalizeProjectLinks(value: unknown, repositories: ProjectRepository[]): { links: ProjectLinks; items: ProjectLinkItem[] } {
  const linksRecord = toProjectRecord(value) ?? {}
  const items = normalizeProjectLinkItems(value)
  const repositoryFromList = repositories.find((item) => item.is_primary)?.url ?? repositories[0]?.url ?? null

  let primary = normalizeNullableProjectText(linksRecord.primary)
  let repo = normalizeNullableProjectText(linksRecord.repo)
  let demo = normalizeNullableProjectText(linksRecord.demo)
  let docs = normalizeNullableProjectText(linksRecord.docs)
  let notes = normalizeNullableProjectText(linksRecord.notes)

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
    links: { primary, repo, demo, docs, notes },
    items,
  }
}

export function normalizeProjectSourceRefs(
  value: unknown,
  repositories: ProjectRepository[],
  fallbackRepositoryUrl: string | null,
): ProjectSourceRefs {
  const refs = toProjectRecord(value) ?? {}
  const primaryRepository = repositories.find((item) => item.is_primary) ?? repositories[0]

  return {
    repo_full_name: normalizeNullableProjectText(refs.repo_full_name) ?? primaryRepository?.full_name ?? null,
    repo_url: normalizeNullableProjectText(refs.repo_url) ?? primaryRepository?.url ?? fallbackRepositoryUrl ?? null,
    visibility: normalizeNullableProjectText(refs.visibility) ?? primaryRepository?.visibility ?? null,
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
  repositories: ProjectRepository[],
  links: ProjectLinks,
  sourceRefs: ProjectSourceRefs,
): string | null {
  const directUrl = normalizeNullableProjectText(payload.url)
  if (directUrl) {
    return directUrl
  }

  if (links.repo) {
    return links.repo
  }

  const primaryRepository = repositories.find((item) => item.is_primary) ?? repositories[0]
  if (primaryRepository?.url) {
    return primaryRepository.url
  }

  if (sourceRefs.repo_url) {
    return sourceRefs.repo_url
  }

  if (sourceRefs.repo_full_name) {
    return `https://github.com/${sourceRefs.repo_full_name}`
  }

  return null
}

export function normalizeProjectCatalogRecord(payload: Record<string, unknown>, index = 0): ProjectCatalogRecord {
  const repositories = normalizeProjectRepositories(payload.repositories)
  const normalizedLinks = normalizeProjectLinks(payload.links, repositories)
  const sourceRefs = normalizeProjectSourceRefs(payload.source_refs, repositories, normalizedLinks.links.repo)
  const fullName = normalizeNullableProjectText(payload.full_name) ?? sourceRefs.repo_full_name
  const fallbackName = fullName ? fullName.split('/').pop() || '' : ''
  const slug = toProjectText(payload.slug)
  const description = toProjectText(payload.description)
  const summary = toProjectText(payload.summary) || description
  const stage = toProjectText(payload.stage) || 'unknown'
  const sourceType = toProjectText(payload.source_type) || toProjectText(payload.source)
  const projectType = toProjectText(payload.project_type)
  const tags = normalizeProjectTagArray(payload.tags)
  const stack = normalizeProjectStringArray(payload.stack)
  const highlights = normalizeProjectHighlightArray(payload.highlights)
  const name = toProjectText(payload.name) || fallbackName || `project-${index + 1}`
  const pushedAt = normalizeNullableProjectText(payload.pushed_at)
  const updatedAt = normalizeNullableProjectText(payload.updated_at)
  const isActive = payload.is_active === true || stage === 'active'
  const archived = payload.archived === true || stage === 'archived'
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
    links: normalizedLinks.links,
    link_items: normalizedLinks.items,
    repositories,
    source_refs: sourceRefs,
    updated_at: updatedAt,
    synced_at: normalizeNullableProjectText(payload.synced_at),
    description,
    full_name: fullName,
    url: resolveCatalogProjectUrl(payload, repositories, normalizedLinks.links, sourceRefs),
    language: normalizeNullableProjectText(payload.language),
    stars: toProjectInteger(payload.stargazers_count ?? payload.stars),
    forks: toProjectInteger(payload.forks_count ?? payload.forks),
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

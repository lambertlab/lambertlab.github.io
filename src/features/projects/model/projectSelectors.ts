import type { ProjectCatalogRecord } from './projectTypes'
import { normalizeProjectFacetValue } from './projectNormalize'
import type { ProjectCatalogMetrics, ProjectCatalogQueryState, ProjectTagChip } from './projectTypes'

export interface ProjectCatalogIndex {
  recent: readonly ProjectCatalogRecord[]
  stars: readonly ProjectCatalogRecord[]
  name: readonly ProjectCatalogRecord[]
}

function compareByName(left: ProjectCatalogRecord, right: ProjectCatalogRecord): number {
  return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
}

function compareByRecent(left: ProjectCatalogRecord, right: ProjectCatalogRecord): number {
  return right.recency_score - left.recency_score || compareByName(left, right)
}

function compareByStars(left: ProjectCatalogRecord, right: ProjectCatalogRecord): number {
  return right.stars - left.stars || compareByRecent(left, right)
}

function matchesFilter(projectValue: string, filterValue: string): boolean {
  if (filterValue === 'all') {
    return true
  }

  return normalizeProjectFacetValue(projectValue) === filterValue
}

export function selectFeaturedProjects(projects: readonly ProjectCatalogRecord[], limit = 3): ProjectCatalogRecord[] {
  return [...projects]
    .filter((project) => project.is_featured)
    .sort((left, right) => {
      const leftRank = left.featured_rank ?? Number.MAX_SAFE_INTEGER
      const rightRank = right.featured_rank ?? Number.MAX_SAFE_INTEGER
      return leftRank - rightRank || compareByRecent(left, right)
    })
    .slice(0, limit)
}

export function filterProjectsCatalog(
  projects: readonly ProjectCatalogRecord[],
  query: ProjectCatalogQueryState,
): ProjectCatalogRecord[] {
  const searchTerm = query.search.trim().toLowerCase()

  return projects.filter((project) => {
    if (query.featuredOnly && !project.is_featured) {
      return false
    }

    if (!matchesFilter(project.stage, query.stage)) {
      return false
    }

    if (!matchesFilter(project.source_type, query.source)) {
      return false
    }

    if (!matchesFilter(project.project_type, query.type)) {
      return false
    }

    if (!searchTerm) {
      return true
    }

    return project.search_text.includes(searchTerm)
  })
}

export function sortProjectsCatalog(
  projects: readonly ProjectCatalogRecord[],
  sortBy: ProjectCatalogQueryState['sort'],
): ProjectCatalogRecord[] {
  const next = [...projects]

  if (sortBy === 'name') {
    next.sort(compareByName)
    return next
  }

  if (sortBy === 'stars') {
    next.sort(compareByStars)
    return next
  }

  next.sort(compareByRecent)
  return next
}

export function buildProjectsCatalogIndex(projects: readonly ProjectCatalogRecord[]): ProjectCatalogIndex {
  return {
    recent: sortProjectsCatalog(projects, 'recent'),
    stars: sortProjectsCatalog(projects, 'stars'),
    name: sortProjectsCatalog(projects, 'name'),
  }
}

function getProjectsCatalogSortBucket(
  index: ProjectCatalogIndex,
  sortBy: ProjectCatalogQueryState['sort'],
): readonly ProjectCatalogRecord[] {
  if (sortBy === 'name') {
    return index.name
  }

  if (sortBy === 'stars') {
    return index.stars
  }

  return index.recent
}

export function selectProjectsCatalogFromIndex(
  index: ProjectCatalogIndex,
  query: ProjectCatalogQueryState,
): ProjectCatalogRecord[] {
  return filterProjectsCatalog(getProjectsCatalogSortBucket(index, query.sort), query)
}

export function selectProjectsCatalog(
  projects: readonly ProjectCatalogRecord[],
  query: ProjectCatalogQueryState,
): ProjectCatalogRecord[] {
  return selectProjectsCatalogFromIndex(buildProjectsCatalogIndex(projects), query)
}

export function buildProjectsCatalogMetrics(projects: readonly ProjectCatalogRecord[]): ProjectCatalogMetrics {
  const sourceTypes = new Set<string>()
  let lastUpdatedAt: string | null = null
  let lastUpdatedScore = 0
  let liveItems = 0

  projects.forEach((project) => {
    const normalizedSource = normalizeProjectFacetValue(project.source_type)
    if (normalizedSource) {
      sourceTypes.add(normalizedSource)
    }

    if (project.is_active) {
      liveItems += 1
    }

    const candidate = project.updated_at ?? project.synced_at ?? project.pushed_at
    if (!candidate) {
      return
    }

    const timestamp = Date.parse(candidate)
    if (!Number.isNaN(timestamp) && timestamp > lastUpdatedScore) {
      lastUpdatedScore = timestamp
      lastUpdatedAt = candidate
    }
  })

  return {
    totalItems: projects.length,
    liveItems,
    sourceCount: sourceTypes.size,
    lastUpdatedAt,
  }
}

export function buildProjectsTagCloud(projects: readonly ProjectCatalogRecord[]): ProjectTagChip[] {
  const counts = new Map<string, number>()

  projects.forEach((project) => {
    project.tags.forEach((tag) => {
      const normalizedTag = tag.trim()
      if (!normalizedTag) {
        return
      }

      counts.set(normalizedTag, (counts.get(normalizedTag) ?? 0) + 1)
    })
  })

  return [...counts.entries()]
    .map(([label, count]) => ({
      value: normalizeProjectFacetValue(label),
      label,
      count,
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }))
}

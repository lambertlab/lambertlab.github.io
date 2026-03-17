export interface ProjectLinks {
  primary: string | null
  repo: string | null
  demo: string | null
  docs: string | null
  notes: string | null
}

export interface ProjectLinkItem {
  key: string
  label: string
  href: string
  type: string | null
}

export interface ProjectRepository {
  name: string
  full_name: string | null
  url: string | null
  visibility: string | null
  is_primary: boolean
}

export interface ProjectSourceRefs {
  repo_full_name: string | null
  repo_url: string | null
  visibility: string | null
}

export interface ProjectCatalogRecord {
  id: number | string | null
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
  description: string
  full_name: string | null
  url: string | null
  language: string | null
  stars: number
  forks: number
  visibility: string | null
  source: string | null
  status: string
  is_active: boolean
  archived: boolean
  pushed_at: string | null
  recency_score: number
  search_text: string
}

export interface FetchProjectsListOptions {
  featuredOnly?: boolean
  signal?: AbortSignal
}

export const PROJECT_CATALOG_SORT_VALUES = ['recent', 'stars', 'name'] as const
export const PROJECT_CATALOG_STAGE_VALUES = ['all', 'building', 'active', 'maintenance', 'research', 'archived'] as const
export const PROJECT_CATALOG_SOURCE_VALUES = ['all', 'github', 'local', 'private', 'hybrid'] as const
export const PROJECT_CATALOG_TYPE_VALUES = ['all', 'website', 'backend', 'tooling', 'infra', 'research', 'agent', 'data', 'library'] as const

export type ProjectCatalogSort = (typeof PROJECT_CATALOG_SORT_VALUES)[number]
export type ProjectCatalogStageFilter = (typeof PROJECT_CATALOG_STAGE_VALUES)[number]
export type ProjectCatalogSourceFilter = (typeof PROJECT_CATALOG_SOURCE_VALUES)[number]
export type ProjectCatalogTypeFilter = (typeof PROJECT_CATALOG_TYPE_VALUES)[number]
export type ProjectsLoadStatus = 'loading' | 'ready' | 'empty' | 'error'

export interface ProjectCatalogQueryState {
  search: string
  sort: ProjectCatalogSort
  stage: ProjectCatalogStageFilter
  source: ProjectCatalogSourceFilter
  type: ProjectCatalogTypeFilter
  featuredOnly: boolean
}

export interface ProjectCatalogMetrics {
  totalItems: number
  liveItems: number
  sourceCount: number
  lastUpdatedAt: string | null
}

export interface ProjectTagChip {
  value: string
  label: string
  count: number
}

export interface FeaturedProjectsState {
  status: ProjectsLoadStatus
  projects: ProjectCatalogRecord[]
  message: string | null
}

export interface ProjectsCatalogState {
  status: ProjectsLoadStatus
  projects: ProjectCatalogRecord[]
  message: string | null
}

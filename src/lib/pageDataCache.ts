import { fetchFeaturedProjects, fetchProjectsCatalog } from '~/features/projects/api/fetchProjects'
import { selectFeaturedProjects } from '~/features/projects/model/projectSelectors'
import type { ProjectCatalogRecord } from '~/features/projects/model/projectTypes'
import { fetchHome, type HomeSnapshot } from '~/lib/homeApi'
import { fetchProjectDetail, type ProjectDetailRecord } from '~/lib/projectsApi'
import { loadSharedResource, readSharedResourceSnapshot } from './sharedResourceCache'

const FEATURED_PROJECTS_TTL_MS = 60_000
const HOME_SNAPSHOT_TTL_MS = 60_000
const PROJECTS_CATALOG_TTL_MS = 60_000
const PROJECT_DETAIL_TTL_MS = 60_000

interface LoadCachedDataOptions {
  force?: boolean
}

function isClient() {
  return typeof window !== 'undefined'
}

function settlePreload(work: Promise<unknown>): Promise<void> {
  return work.then(() => undefined).catch(() => undefined)
}

function getFeaturedProjectsKey(limit: number) {
  return `featured-projects:${limit}`
}

function getProjectDetailKey(slug: string) {
  return `project-detail:${slug.trim().toLowerCase()}`
}

export function readFeaturedProjectsSnapshot(limit = 3) {
  return readSharedResourceSnapshot<ProjectCatalogRecord[]>(getFeaturedProjectsKey(limit))
}

export function loadFeaturedProjectsSnapshot(limit = 3, options: LoadCachedDataOptions = {}) {
  return loadSharedResource(
    getFeaturedProjectsKey(limit),
    async () => {
      const projects = await fetchFeaturedProjects()
      return selectFeaturedProjects(projects, limit)
    },
    {
      force: options.force,
      ttlMs: FEATURED_PROJECTS_TTL_MS,
    },
  )
}

export function readHomeSnapshot() {
  return readSharedResourceSnapshot<HomeSnapshot>('home-snapshot')
}

export function loadHomeSnapshot(options: LoadCachedDataOptions = {}) {
  return loadSharedResource('home-snapshot', () => fetchHome(), {
    force: options.force,
    ttlMs: HOME_SNAPSHOT_TTL_MS,
  })
}

function readHomeCardsSnapshot(slot: 'technology' | 'life') {
  const snapshot = readHomeSnapshot()

  if (snapshot.status !== 'ready') {
    return snapshot
  }

  return {
    ...snapshot,
    data: snapshot.data?.[slot] ?? [],
  }
}

function loadHomeCardsSnapshot(slot: 'technology' | 'life', options: LoadCachedDataOptions = {}) {
  return loadHomeSnapshot(options).then((snapshot) => snapshot[slot])
}

export function readHomeTechnologyCardsSnapshot() {
  return readHomeCardsSnapshot('technology')
}

export function loadHomeTechnologyCardsSnapshot(options: LoadCachedDataOptions = {}) {
  return loadHomeCardsSnapshot('technology', options)
}

export function readHomeLifeCardsSnapshot() {
  return readHomeCardsSnapshot('life')
}

export function loadHomeLifeCardsSnapshot(options: LoadCachedDataOptions = {}) {
  return loadHomeCardsSnapshot('life', options)
}

export function readProjectsCatalogSnapshot() {
  return readSharedResourceSnapshot<ProjectCatalogRecord[]>('projects-catalog')
}

export function loadProjectsCatalogSnapshot(options: LoadCachedDataOptions = {}) {
  return loadSharedResource('projects-catalog', () => fetchProjectsCatalog(), {
    force: options.force,
    ttlMs: PROJECTS_CATALOG_TTL_MS,
  })
}

export function readProjectDetailSnapshot(slug: string) {
  return readSharedResourceSnapshot<ProjectDetailRecord>(getProjectDetailKey(slug))
}

export function loadProjectDetailSnapshot(slug: string, options: LoadCachedDataOptions = {}) {
  return loadSharedResource(getProjectDetailKey(slug), () => fetchProjectDetail(slug), {
    force: options.force,
    ttlMs: PROJECT_DETAIL_TTL_MS,
  })
}

export function preloadHomePageData() {
  if (!isClient()) {
    return Promise.resolve()
  }

  return settlePreload(loadHomeSnapshot())
}

export function preloadProjectsCatalogPageData() {
  if (!isClient()) {
    return Promise.resolve()
  }

  return settlePreload(loadProjectsCatalogSnapshot())
}

export function preloadProjectDetailPageData(slug: string) {
  if (!isClient()) {
    return Promise.resolve()
  }

  return settlePreload(loadProjectDetailSnapshot(slug))
}

import * as React from 'react'
import { loadProjectsCatalogSnapshot, readProjectsCatalogSnapshot } from '~/lib/pageDataCache'
import {
  normalizeProjectCatalogQuery,
  normalizeProjectCatalogSort,
  normalizeProjectCatalogSource,
  normalizeProjectCatalogStage,
  normalizeProjectCatalogType,
} from '../model/projectNormalize'
import {
  buildProjectsCatalogIndex,
  buildProjectsCatalogMetrics,
  buildProjectsTagCloud,
  selectProjectsCatalogFromIndex,
} from '../model/projectSelectors'
import type { ProjectCatalogQueryState, ProjectsCatalogState } from '../model/projectTypes'

const INITIAL_STATE: ProjectsCatalogState = {
  status: 'loading',
  projects: [],
  message: null,
}

function toBoolean(value: string | null): boolean {
  if (!value) {
    return false
  }

  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

function readQueryFromUrl(): ProjectCatalogQueryState {
  if (typeof window === 'undefined') {
    return normalizeProjectCatalogQuery()
  }

  const params = new URLSearchParams(window.location.search)
  const legacyStatus = (params.get('status') ?? '').trim().toLowerCase()
  const stage = params.get('stage') ?? (legacyStatus === 'inactive' ? 'maintenance' : legacyStatus)

  return normalizeProjectCatalogQuery({
    search: params.get('q') ?? '',
    sort: normalizeProjectCatalogSort(params.get('sort') ?? 'recent'),
    stage: normalizeProjectCatalogStage(stage),
    source: normalizeProjectCatalogSource(params.get('source') ?? 'all'),
    type: normalizeProjectCatalogType(params.get('type') ?? 'all'),
    featuredOnly: toBoolean(params.get('featured')),
  })
}

function buildQueryString(query: ProjectCatalogQueryState): string {
  const params = new URLSearchParams()

  if (query.search.trim()) {
    params.set('q', query.search.trim())
  }

  if (query.sort !== 'recent') {
    params.set('sort', query.sort)
  }

  if (query.stage !== 'all') {
    params.set('stage', query.stage)
  }

  if (query.source !== 'all') {
    params.set('source', query.source)
  }

  if (query.type !== 'all') {
    params.set('type', query.type)
  }

  if (query.featuredOnly) {
    params.set('featured', '1')
  }

  return params.toString()
}

function writeQueryToUrl(query: ProjectCatalogQueryState) {
  if (typeof window === 'undefined') {
    return
  }

  const search = buildQueryString(query)
  const nextUrl = search ? `/projects/?${search}${window.location.hash || ''}` : `/projects/${window.location.hash || ''}`
  window.history.replaceState({}, '', nextUrl)
}

function buildReadyState(projects: ProjectsCatalogState['projects']): ProjectsCatalogState {
  return {
    status: projects.length > 0 ? 'ready' : 'empty',
    projects,
    message: null,
  }
}

function buildErrorState(error: unknown): ProjectsCatalogState {
  const message = error instanceof Error ? error.message : 'Failed to load projects catalog.'

  return {
    status: 'error',
    projects: [],
    message,
  }
}

function getInitialState(): ProjectsCatalogState {
  const snapshot = readProjectsCatalogSnapshot()

  if (snapshot.status === 'ready') {
    return buildReadyState(snapshot.data ?? [])
  }

  if (snapshot.status === 'error') {
    return buildErrorState(snapshot.error)
  }

  return INITIAL_STATE
}

export function useProjectsCatalog(initialQuery: Partial<ProjectCatalogQueryState> = {}) {
  const initialQueryRef = React.useRef(normalizeProjectCatalogQuery({ ...readQueryFromUrl(), ...initialQuery }))
  const [query, setQuery] = React.useState(initialQueryRef.current)
  const deferredQuery = React.useDeferredValue(query)
  const [state, setState] = React.useState<ProjectsCatalogState>(() => getInitialState())
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    writeQueryToUrl(query)
  }, [query])

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handlePopState = () => {
      setQuery(readQueryFromUrl())
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const forceReload = reloadToken > 0
    const snapshot = readProjectsCatalogSnapshot()

    if (forceReload || snapshot.status === 'idle' || snapshot.status === 'pending') {
      setState((current) => ({
        ...current,
        status: 'loading',
        message: null,
      }))
    } else if (snapshot.status === 'ready') {
      setState(buildReadyState(snapshot.data ?? []))
    } else if (snapshot.status === 'error') {
      setState(buildErrorState(snapshot.error))
    }

    loadProjectsCatalogSnapshot({ force: forceReload })
      .then((projects) => {
        if (cancelled) {
          return
        }

        setState(buildReadyState(projects))
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }

        setState(buildErrorState(error))
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const catalogIndex = React.useMemo(() => buildProjectsCatalogIndex(state.projects), [state.projects])
  const visibleProjects = React.useMemo(() => selectProjectsCatalogFromIndex(catalogIndex, deferredQuery), [catalogIndex, deferredQuery])
  const metrics = React.useMemo(() => buildProjectsCatalogMetrics(state.projects), [state.projects])
  const tagCloud = React.useMemo(() => buildProjectsTagCloud(state.projects), [state.projects])

  const updateQuery = React.useCallback((patch: Partial<ProjectCatalogQueryState>) => {
    setQuery((current) => normalizeProjectCatalogQuery({ ...current, ...patch }))
  }, [])

  const resetQuery = React.useCallback(() => {
    setQuery(normalizeProjectCatalogQuery())
  }, [])

  const retry = React.useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  return {
    ...state,
    query,
    visibleProjects,
    metrics,
    tagCloud,
    updateQuery,
    resetQuery,
    retry,
    hasFilteredResults: visibleProjects.length > 0,
    hasLoadedProjects: state.projects.length > 0,
    isFilteringPending: deferredQuery !== query,
  }
}

import * as React from 'react'
import { loadFeaturedProjectsSnapshot, readFeaturedProjectsSnapshot } from '~/lib/pageDataCache'
import type { FeaturedProjectsState } from '../model/projectTypes'

const INITIAL_STATE: FeaturedProjectsState = {
  status: 'loading',
  projects: [],
  message: null,
}

function buildReadyState(projects: FeaturedProjectsState['projects']): FeaturedProjectsState {
  return {
    status: projects.length > 0 ? 'ready' : 'empty',
    projects,
    message: null,
  }
}

function buildErrorState(error: unknown): FeaturedProjectsState {
  const message = error instanceof Error ? error.message : 'Failed to load featured projects.'

  return {
    status: 'error',
    projects: [],
    message,
  }
}

function getInitialState(limit: number): FeaturedProjectsState {
  const snapshot = readFeaturedProjectsSnapshot(limit)

  if (snapshot.status === 'ready') {
    return buildReadyState(snapshot.data ?? [])
  }

  if (snapshot.status === 'error') {
    return buildErrorState(snapshot.error)
  }

  return INITIAL_STATE
}

export function useFeaturedProjects(limit = 3) {
  const [state, setState] = React.useState<FeaturedProjectsState>(() => getInitialState(limit))
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    const forceReload = reloadToken > 0
    const snapshot = readFeaturedProjectsSnapshot(limit)

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

    loadFeaturedProjectsSnapshot(limit, { force: forceReload })
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
  }, [limit, reloadToken])

  const retry = React.useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  return {
    ...state,
    retry,
  }
}

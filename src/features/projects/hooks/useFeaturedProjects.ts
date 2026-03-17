import * as React from 'react'
import { fetchFeaturedProjects } from '../api/fetchProjects'
import { selectFeaturedProjects } from '../model/projectSelectors'
import type { FeaturedProjectsState } from '../model/projectTypes'

const INITIAL_STATE: FeaturedProjectsState = {
  status: 'loading',
  projects: [],
  message: null,
}

export function useFeaturedProjects(limit = 3) {
  const [state, setState] = React.useState<FeaturedProjectsState>(INITIAL_STATE)
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    const controller = new AbortController()
    setState((current) => ({
      ...current,
      status: 'loading',
      message: null,
    }))

    fetchFeaturedProjects({ signal: controller.signal })
      .then((projects) => {
        if (controller.signal.aborted) {
          return
        }

        const selectedProjects = selectFeaturedProjects(projects, limit)
        setState({
          status: selectedProjects.length > 0 ? 'ready' : 'empty',
          projects: selectedProjects,
          message: null,
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        const message = error instanceof Error ? error.message : 'Failed to load featured projects.'
        setState({
          status: 'error',
          projects: [],
          message,
        })
      })

    return () => {
      controller.abort()
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

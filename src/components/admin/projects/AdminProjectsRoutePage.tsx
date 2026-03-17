import { useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { AdminProjectsConsolePage } from './AdminProjectsConsolePage'
import {
  normalizeAdminProjectsSearchState,
  toAdminProjectsRouteSearch,
  type AdminProjectsSearchState,
} from './adminProjectsSearch'

type AdminProjectsRoutePageProps = {
  from: '/admin/projects/' | '/admin/projects/index.html'
  searchState: AdminProjectsSearchState
}

export function AdminProjectsRoutePage({ from, searchState }: AdminProjectsRoutePageProps) {
  const navigate = useNavigate({ from })

  const handleSearchPatch = React.useCallback(
    (patch: Partial<AdminProjectsSearchState>) => {
      const nextSearch = normalizeAdminProjectsSearchState({ ...searchState, ...patch } as Record<string, unknown>)
      void navigate({
        replace: true,
        search: () => toAdminProjectsRouteSearch(nextSearch),
      })
    },
    [navigate, searchState],
  )

  return <AdminProjectsConsolePage mode="projects" searchState={searchState} onSearchStateChange={handleSearchPatch} />
}

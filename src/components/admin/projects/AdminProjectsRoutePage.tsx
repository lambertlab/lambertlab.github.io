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
      void navigate({
        replace: true,
        search: (prev) =>
          toAdminProjectsRouteSearch(
            normalizeAdminProjectsSearchState({ ...(prev as Record<string, unknown>), ...patch } as Record<string, unknown>),
          ),
      })
    },
    [navigate],
  )

  return <AdminProjectsConsolePage mode="projects" searchState={searchState} onSearchStateChange={handleSearchPatch} />
}

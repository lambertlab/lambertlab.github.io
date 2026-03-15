import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { AdminProjectsConsolePage } from '~/components/admin/projects/AdminProjectsConsolePage'
import {
  normalizeAdminProjectsSearchState,
  toAdminProjectsRouteSearch,
  type AdminProjectsSearchState,
} from '~/components/admin/projects/adminProjectsSearch'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/projects/')({
  validateSearch: (search): AdminProjectsSearchState =>
    normalizeAdminProjectsSearchState(search as Record<string, unknown>),
  head: () => buildAdminProjectsHead(),
  component: AdminProjectsRoutePage,
})

function AdminProjectsRoutePage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/admin/projects/' })

  const handleSearchPatch = React.useCallback(
    (patch: Partial<AdminProjectsSearchState>) => {
      const nextSearch = normalizeAdminProjectsSearchState({ ...search, ...patch } as Record<string, unknown>)
      void navigate({
        replace: true,
        search: () => toAdminProjectsRouteSearch(nextSearch),
      })
    },
    [navigate, search],
  )

  return <AdminProjectsConsolePage mode="projects" searchState={search} onSearchStateChange={handleSearchPatch} />
}


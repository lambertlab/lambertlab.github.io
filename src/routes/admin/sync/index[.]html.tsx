import { createFileRoute } from '@tanstack/react-router'
import { AdminCompatRouteAdapter } from '~/components/admin/projects/AdminCompatRouteAdapter'
import { AdminSyncRoutePage } from '~/components/admin/projects/AdminSyncRoutePage'
import {
  normalizeAdminProjectSyncSearchState,
  type AdminProjectSyncSearchState,
} from '~/components/admin/projects/adminProjectSyncSearch'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/sync/index.html')({
  validateSearch: (search): AdminProjectSyncSearchState =>
    normalizeAdminProjectSyncSearchState(search as Record<string, unknown>),
  head: () => buildAdminProjectsHead(),
  component: AdminSyncHtmlRoute,
})

function AdminSyncHtmlRoute() {
  const search = Route.useSearch()

  return (
    <AdminCompatRouteAdapter>
      <AdminSyncRoutePage searchState={search} />
    </AdminCompatRouteAdapter>
  )
}

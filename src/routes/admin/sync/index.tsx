import { createFileRoute } from '@tanstack/react-router'
import { AdminSyncRoutePage } from '~/components/admin/projects/AdminSyncRoutePage'
import {
  normalizeAdminProjectSyncSearchState,
  type AdminProjectSyncSearchState,
} from '~/components/admin/projects/adminProjectSyncSearch'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/sync/')({
  validateSearch: (search): AdminProjectSyncSearchState =>
    normalizeAdminProjectSyncSearchState(search as Record<string, unknown>),
  head: () => buildAdminProjectsHead(),
  component: AdminSyncCanonicalRoute,
})

function AdminSyncCanonicalRoute() {
  const search = Route.useSearch()
  return <AdminSyncRoutePage searchState={search} />
}

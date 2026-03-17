import { createFileRoute } from '@tanstack/react-router'
import { AdminCompatRouteAdapter } from '~/components/admin/projects/AdminCompatRouteAdapter'
import { AdminProjectsRoutePage } from '~/components/admin/projects/AdminProjectsRoutePage'
import {
  normalizeAdminProjectsSearchState,
  type AdminProjectsSearchState,
} from '~/components/admin/projects/adminProjectsSearch'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/projects/index.html')({
  validateSearch: (search): AdminProjectsSearchState =>
    normalizeAdminProjectsSearchState(search as Record<string, unknown>),
  head: () => buildAdminProjectsHead(),
  component: AdminProjectsHtmlRoutePage,
})

function AdminProjectsHtmlRoutePage() {
  const search = Route.useSearch()

  return (
    <AdminCompatRouteAdapter>
      <AdminProjectsRoutePage from="/admin/projects/index.html" searchState={search} />
    </AdminCompatRouteAdapter>
  )
}

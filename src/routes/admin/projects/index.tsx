import { createFileRoute } from '@tanstack/react-router'
import { AdminProjectsRoutePage } from '~/components/admin/projects/AdminProjectsRoutePage'
import {
  normalizeAdminProjectsSearchState,
  type AdminProjectsSearchState,
} from '~/components/admin/projects/adminProjectsSearch'
import { buildAdminConsoleHead } from '~/components/admin/console/adminConsoleHead'

export const Route = createFileRoute('/admin/projects/')({
  validateSearch: (search): AdminProjectsSearchState =>
    normalizeAdminProjectsSearchState(search as Record<string, unknown>),
  head: () => buildAdminConsoleHead(),
  component: AdminProjectsCanonicalRoutePage,
})

function AdminProjectsCanonicalRoutePage() {
  const search = Route.useSearch()
  return <AdminProjectsRoutePage from="/admin/projects/" searchState={search} />
}

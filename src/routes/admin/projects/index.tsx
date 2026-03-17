import { createFileRoute } from '@tanstack/react-router'
import { AdminProjectsRoutePage } from '~/components/admin/projects/AdminProjectsRoutePage'
import {
  normalizeAdminProjectsSearchState,
  type AdminProjectsSearchState,
} from '~/components/admin/projects/adminProjectsSearch'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/projects/')({
  validateSearch: (search): AdminProjectsSearchState =>
    normalizeAdminProjectsSearchState(search as Record<string, unknown>),
  head: () => buildAdminProjectsHead(),
  component: AdminProjectsCanonicalRoutePage,
})

function AdminProjectsCanonicalRoutePage() {
  const search = Route.useSearch()
  return <AdminProjectsRoutePage from="/admin/projects/" searchState={search} />
}

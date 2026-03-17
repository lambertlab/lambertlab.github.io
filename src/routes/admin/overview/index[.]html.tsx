import { createFileRoute } from '@tanstack/react-router'
import { AdminCompatRouteAdapter } from '~/components/admin/projects/AdminCompatRouteAdapter'
import { AdminOverviewRoutePage } from '~/components/admin/projects/AdminOverviewRoutePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/overview/index.html')({
  head: () => buildAdminProjectsHead(),
  component: AdminOverviewHtmlRoutePage,
})

function AdminOverviewHtmlRoutePage() {
  return (
    <AdminCompatRouteAdapter>
      <AdminOverviewRoutePage />
    </AdminCompatRouteAdapter>
  )
}

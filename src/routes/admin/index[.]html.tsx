import { createFileRoute } from '@tanstack/react-router'
import { AdminCompatRouteAdapter } from '~/components/admin/projects/AdminCompatRouteAdapter'
import { AdminOverviewRoutePage } from '~/components/admin/projects/AdminOverviewRoutePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/index.html')({
  head: () => buildAdminProjectsHead(),
  component: AdminEntryHtmlRoutePage,
})

function AdminEntryHtmlRoutePage() {
  return (
    <AdminCompatRouteAdapter>
      <AdminOverviewRoutePage />
    </AdminCompatRouteAdapter>
  )
}

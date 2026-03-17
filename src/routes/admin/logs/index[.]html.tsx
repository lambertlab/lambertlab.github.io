import { createFileRoute } from '@tanstack/react-router'
import { AdminCompatRouteAdapter } from '~/components/admin/projects/AdminCompatRouteAdapter'
import { AdminLogsRoutePage } from '~/components/admin/projects/AdminLogsRoutePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/logs/index.html')({
  head: () => buildAdminProjectsHead(),
  component: AdminLogsHtmlRoutePage,
})

function AdminLogsHtmlRoutePage() {
  return (
    <AdminCompatRouteAdapter>
      <AdminLogsRoutePage />
    </AdminCompatRouteAdapter>
  )
}

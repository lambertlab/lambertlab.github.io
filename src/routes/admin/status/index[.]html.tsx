import { createFileRoute } from '@tanstack/react-router'
import { AdminCompatRouteAdapter } from '~/components/admin/projects/AdminCompatRouteAdapter'
import { AdminStatusRoutePage } from '~/components/admin/projects/AdminStatusRoutePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/status/index.html')({
  head: () => buildAdminProjectsHead(),
  component: AdminStatusHtmlRoutePage,
})

function AdminStatusHtmlRoutePage() {
  return (
    <AdminCompatRouteAdapter>
      <AdminStatusRoutePage />
    </AdminCompatRouteAdapter>
  )
}

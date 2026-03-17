import { createFileRoute } from '@tanstack/react-router'
import { AdminCompatRouteAdapter } from '~/components/admin/projects/AdminCompatRouteAdapter'
import { AdminSyncRoutePage } from '~/components/admin/projects/AdminSyncRoutePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/sync/index.html')({
  head: () => buildAdminProjectsHead(),
  component: AdminSyncHtmlRoutePage,
})

function AdminSyncHtmlRoutePage() {
  return (
    <AdminCompatRouteAdapter>
      <AdminSyncRoutePage />
    </AdminCompatRouteAdapter>
  )
}

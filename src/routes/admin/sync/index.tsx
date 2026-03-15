import { createFileRoute } from '@tanstack/react-router'
import { AdminSyncConsolePage } from '~/components/admin/projects/AdminSyncConsolePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/sync/')({
  head: () => buildAdminProjectsHead(),
  component: AdminSyncRoutePage,
})

function AdminSyncRoutePage() {
  return <AdminSyncConsolePage />
}
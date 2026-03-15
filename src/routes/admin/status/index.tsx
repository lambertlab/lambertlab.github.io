import { createFileRoute } from '@tanstack/react-router'
import { AdminStatusConsolePage } from '~/components/admin/projects/AdminStatusConsolePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/status/')({
  head: () => buildAdminProjectsHead(),
  component: AdminStatusRoutePage,
})

function AdminStatusRoutePage() {
  return <AdminStatusConsolePage />
}
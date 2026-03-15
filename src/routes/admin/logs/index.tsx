import { createFileRoute } from '@tanstack/react-router'
import { AdminLogsConsolePage } from '~/components/admin/projects/AdminLogsConsolePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/logs/')({
  head: () => buildAdminProjectsHead(),
  component: AdminLogsRoutePage,
})

function AdminLogsRoutePage() {
  return <AdminLogsConsolePage />
}
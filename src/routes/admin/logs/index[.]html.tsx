import { createFileRoute } from '@tanstack/react-router'
import { AdminLogsConsolePage } from '~/components/admin/projects/AdminLogsConsolePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'
import { useAdminCompatPathNormalization } from '~/lib/adminCompatPathNormalization'

export const Route = createFileRoute('/admin/logs/index.html')({
  head: () => buildAdminProjectsHead(),
  component: AdminLogsHtmlRoutePage,
})

function AdminLogsHtmlRoutePage() {
  useAdminCompatPathNormalization()
  return <AdminLogsConsolePage />
}
import { createFileRoute } from '@tanstack/react-router'
import { AdminProjectsConsolePage } from '~/components/admin/projects/AdminProjectsConsolePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'
import { useAdminCompatPathNormalization } from '~/lib/adminCompatPathNormalization'

export const Route = createFileRoute('/admin/index.html')({
  head: () => buildAdminProjectsHead(),
  component: AdminEntryHtmlRoutePage,
})

function AdminEntryHtmlRoutePage() {
  useAdminCompatPathNormalization()
  return <AdminProjectsConsolePage mode="overview" />
}

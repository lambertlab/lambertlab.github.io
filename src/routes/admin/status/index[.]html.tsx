import { createFileRoute } from '@tanstack/react-router'
import { AdminStatusConsolePage } from '~/components/admin/projects/AdminStatusConsolePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'
import { useAdminCompatPathNormalization } from '~/lib/adminCompatPathNormalization'

export const Route = createFileRoute('/admin/status/index.html')({
  head: () => buildAdminProjectsHead(),
  component: AdminStatusHtmlRoutePage,
})

function AdminStatusHtmlRoutePage() {
  useAdminCompatPathNormalization()
  return <AdminStatusConsolePage />
}
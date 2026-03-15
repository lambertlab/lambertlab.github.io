import { createFileRoute } from '@tanstack/react-router'
import { AdminSyncConsolePage } from '~/components/admin/projects/AdminSyncConsolePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'
import { useAdminCompatPathNormalization } from '~/lib/adminCompatPathNormalization'

export const Route = createFileRoute('/admin/sync/index.html')({
  head: () => buildAdminProjectsHead(),
  component: AdminSyncHtmlRoutePage,
})

function AdminSyncHtmlRoutePage() {
  useAdminCompatPathNormalization()
  return <AdminSyncConsolePage />
}
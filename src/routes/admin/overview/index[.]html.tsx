import { createFileRoute } from '@tanstack/react-router'
import { AdminOverviewConsolePage } from '~/components/admin/projects/AdminOverviewConsolePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'
import { useAdminCompatPathNormalization } from '~/lib/adminCompatPathNormalization'

export const Route = createFileRoute('/admin/overview/index.html')({
  head: () => buildAdminProjectsHead(),
  component: AdminOverviewHtmlRoutePage,
})

function AdminOverviewHtmlRoutePage() {
  useAdminCompatPathNormalization()
  return <AdminOverviewConsolePage />
}
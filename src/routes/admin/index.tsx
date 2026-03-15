import { createFileRoute } from '@tanstack/react-router'
import { AdminProjectsConsolePage } from '~/components/admin/projects/AdminProjectsConsolePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/')({
  head: () => buildAdminProjectsHead(),
  component: AdminEntryRoutePage,
})

function AdminEntryRoutePage() {
  return <AdminProjectsConsolePage mode="overview" />
}

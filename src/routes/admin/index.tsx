import { createFileRoute } from '@tanstack/react-router'
import { AdminOverviewConsolePage } from '~/components/admin/projects/AdminOverviewConsolePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/')({
  head: () => buildAdminProjectsHead(),
  component: AdminEntryRoutePage,
})

function AdminEntryRoutePage() {
  return <AdminOverviewConsolePage />
}
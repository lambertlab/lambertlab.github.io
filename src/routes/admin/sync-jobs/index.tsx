import { createFileRoute } from '@tanstack/react-router'
import { AdminSyncConsolePage } from '~/components/admin/console/AdminSyncConsolePage'
import { buildAdminConsoleHead } from '~/components/admin/console/adminConsoleHead'

export const Route = createFileRoute('/admin/sync-jobs/')({
  head: () => buildAdminConsoleHead(),
  component: AdminSyncJobsRoutePage,
})

function AdminSyncJobsRoutePage() {
  return <AdminSyncConsolePage />
}

import { createFileRoute } from '@tanstack/react-router'
import { AdminLogsRoutePage } from '~/components/admin/console/AdminLogsRoutePage'
import { buildAdminConsoleHead } from '~/components/admin/console/adminConsoleHead'

export const Route = createFileRoute('/admin/logs/')({
  head: () => buildAdminConsoleHead(),
  component: AdminLogsRoutePage,
})

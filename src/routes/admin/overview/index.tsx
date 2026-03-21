import { createFileRoute } from '@tanstack/react-router'
import { AdminOverviewRoutePage } from '~/components/admin/console/AdminOverviewRoutePage'
import { buildAdminConsoleHead } from '~/components/admin/console/adminConsoleHead'

export const Route = createFileRoute('/admin/overview/')({
  head: () => buildAdminConsoleHead(),
  component: AdminOverviewRoutePage,
})

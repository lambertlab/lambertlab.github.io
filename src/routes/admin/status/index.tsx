import { createFileRoute } from '@tanstack/react-router'
import { buildAdminConsoleHead } from '~/components/admin/console/adminConsoleHead'
import { AdminStatusRoutePage } from '~/components/admin/console/AdminStatusRoutePage'

export const Route = createFileRoute('/admin/status/')({
  head: () => buildAdminConsoleHead(),
  component: AdminStatusRoutePage,
})

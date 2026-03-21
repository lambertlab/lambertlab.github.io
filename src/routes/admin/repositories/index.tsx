import { createFileRoute } from '@tanstack/react-router'
import { AdminRepositoriesRoutePage } from '~/components/admin/console/AdminRepositoriesRoutePage'
import { buildAdminConsoleHead } from '~/components/admin/console/adminConsoleHead'

export const Route = createFileRoute('/admin/repositories/')({
  head: () => buildAdminConsoleHead(),
  component: AdminRepositoriesRoutePage,
})

import { createFileRoute } from '@tanstack/react-router'
import { buildAdminConsoleHead } from '~/components/admin/console/adminConsoleHead'
import { AdminHomeLifeRoutePage } from '~/components/admin/console/AdminHomeLifeRoutePage'

export const Route = createFileRoute('/admin/home/life/')({
  head: () => buildAdminConsoleHead(),
  component: AdminHomeLifeRoutePage,
})

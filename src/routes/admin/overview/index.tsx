import { createFileRoute } from '@tanstack/react-router'
import { AdminOverviewRoutePage } from '~/components/admin/projects/AdminOverviewRoutePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/overview/')({
  head: () => buildAdminProjectsHead(),
  component: AdminOverviewRoutePage,
})

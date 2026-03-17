import { createFileRoute } from '@tanstack/react-router'
import { AdminStatusRoutePage } from '~/components/admin/projects/AdminStatusRoutePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/status/')({
  head: () => buildAdminProjectsHead(),
  component: AdminStatusRoutePage,
})

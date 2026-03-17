import { createFileRoute } from '@tanstack/react-router'
import { AdminSyncRoutePage } from '~/components/admin/projects/AdminSyncRoutePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/sync/')({
  head: () => buildAdminProjectsHead(),
  component: AdminSyncRoutePage,
})

import { createFileRoute } from '@tanstack/react-router'
import { AdminLogsRoutePage } from '~/components/admin/projects/AdminLogsRoutePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/logs/')({
  head: () => buildAdminProjectsHead(),
  component: AdminLogsRoutePage,
})

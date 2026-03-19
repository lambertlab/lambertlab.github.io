import { createFileRoute } from '@tanstack/react-router'
import { AdminRepositoriesRoutePage } from '~/components/admin/projects/AdminRepositoriesRoutePage'
import { buildAdminProjectsHead } from '~/components/admin/projects/adminProjectsHead'

export const Route = createFileRoute('/admin/repo/')({
  head: () => buildAdminProjectsHead(),
  component: AdminRepoCanonicalRoutePage,
})

function AdminRepoCanonicalRoutePage() {
  return <AdminRepositoriesRoutePage />
}

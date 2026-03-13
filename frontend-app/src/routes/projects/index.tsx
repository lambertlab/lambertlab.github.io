import { createFileRoute } from '@tanstack/react-router'
import { ProjectsCatalogPage } from '~/components/projects/ProjectsCatalogPage'
import { buildProjectsCatalogHead } from '~/components/projects/projectsCatalogHead'

export const Route = createFileRoute('/projects/')({
  head: () => buildProjectsCatalogHead(),
  component: ProjectsPage,
})

function ProjectsPage() {
  return <ProjectsCatalogPage />
}

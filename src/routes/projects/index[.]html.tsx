import { createFileRoute } from '@tanstack/react-router'
import { ProjectsCatalogPage } from '~/components/projects/ProjectsCatalogPage'
import { buildProjectsCatalogHead } from '~/components/projects/projectsCatalogHead'
import { useProjectsCompatPathNormalization } from '~/lib/projectsCompatPathNormalization'

export const Route = createFileRoute('/projects/index.html')({
  head: () => buildProjectsCatalogHead(),
  component: ProjectsHtmlPage,
})

function ProjectsHtmlPage() {
  useProjectsCompatPathNormalization()
  return <ProjectsCatalogPage />
}

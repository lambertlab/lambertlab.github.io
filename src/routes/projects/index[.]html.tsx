import { createFileRoute } from '@tanstack/react-router'
import { ProjectsCatalogRoutePage } from '~/components/projects/ProjectsCatalogRoutePage'
import { ProjectsCompatRouteAdapter } from '~/components/projects/ProjectsCompatRouteAdapter'
import { buildProjectsCatalogHead } from '~/components/projects/projectsCatalogHead'

export const Route = createFileRoute('/projects/index.html')({
  head: () => buildProjectsCatalogHead(),
  component: ProjectsHtmlPage,
})

function ProjectsHtmlPage() {
  return (
    <ProjectsCompatRouteAdapter>
      <ProjectsCatalogRoutePage />
    </ProjectsCompatRouteAdapter>
  )
}

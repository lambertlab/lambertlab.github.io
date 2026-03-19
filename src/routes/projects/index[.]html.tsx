import { createFileRoute } from '@tanstack/react-router'
import { ProjectsCompatRouteAdapter } from '~/components/projects/ProjectsCompatRouteAdapter'
import { ProjectsCatalogRoutePage } from '~/components/projects/ProjectsCatalogRoutePage'
import { buildProjectsCatalogHead } from '~/components/projects/projectsCatalogHead'
import { preloadProjectsCatalogPageData } from '~/lib/pageDataCache'

export const Route = createFileRoute('/projects/index.html')({
  head: () => buildProjectsCatalogHead(),
  loader: () => preloadProjectsCatalogPageData(),
  component: ProjectsHtmlPage,
})

function ProjectsHtmlPage() {
  return (
    <ProjectsCompatRouteAdapter>
      <ProjectsCatalogRoutePage />
    </ProjectsCompatRouteAdapter>
  )
}

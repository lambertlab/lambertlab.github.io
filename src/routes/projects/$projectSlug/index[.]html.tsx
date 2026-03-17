import { createFileRoute } from '@tanstack/react-router'
import { ProjectDetailRoutePage } from '~/components/projects/ProjectDetailRoutePage'
import { ProjectsCompatRouteAdapter } from '~/components/projects/ProjectsCompatRouteAdapter'
import { buildProjectDetailHead } from '~/components/projects/projectDetailHead'

export const Route = createFileRoute('/projects/$projectSlug/index.html')({
  head: () => buildProjectDetailHead(),
  component: DynamicProjectDetailHtmlPage,
})

function DynamicProjectDetailHtmlPage() {
  const { projectSlug } = Route.useParams()

  return (
    <ProjectsCompatRouteAdapter>
      <ProjectDetailRoutePage slug={projectSlug} />
    </ProjectsCompatRouteAdapter>
  )
}

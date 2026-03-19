import { createFileRoute } from '@tanstack/react-router'
import { ProjectDetailRoutePage } from '~/components/projects/ProjectDetailRoutePage'
import { ProjectsCompatRouteAdapter } from '~/components/projects/ProjectsCompatRouteAdapter'
import { buildProjectDetailHead } from '~/components/projects/projectDetailHead'
import { preloadProjectDetailPageData } from '~/lib/pageDataCache'

export const Route = createFileRoute('/projects/$projectSlug/index.html')({
  head: () => buildProjectDetailHead(),
  loader: ({ params }) => preloadProjectDetailPageData(params.projectSlug),
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

import { createFileRoute } from '@tanstack/react-router'
import { ProjectDetailRoutePage } from '~/components/projects/ProjectDetailRoutePage'
import { buildProjectDetailHead } from '~/components/projects/projectDetailHead'
import { preloadProjectDetailPageData } from '~/lib/pageDataCache'

export const Route = createFileRoute('/projects/$projectSlug/')({
  head: () => buildProjectDetailHead(),
  loader: ({ params }) => preloadProjectDetailPageData(params.projectSlug),
  component: DynamicProjectDetailPage,
})

function DynamicProjectDetailPage() {
  const { projectSlug } = Route.useParams()

  return <ProjectDetailRoutePage slug={projectSlug} />
}

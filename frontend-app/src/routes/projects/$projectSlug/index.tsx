import { createFileRoute } from '@tanstack/react-router'
import { ProjectDetailPage } from '~/components/projects/ProjectDetailPage'
import { buildProjectDetailHead } from '~/components/projects/projectDetailHead'

export const Route = createFileRoute('/projects/$projectSlug/')({
  head: () => buildProjectDetailHead(),
  component: DynamicProjectDetailPage,
})

function DynamicProjectDetailPage() {
  const { projectSlug } = Route.useParams()

  return <ProjectDetailPage slug={projectSlug} />
}

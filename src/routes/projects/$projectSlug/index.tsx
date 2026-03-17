import { createFileRoute } from '@tanstack/react-router'
import { ProjectDetailRoutePage } from '~/components/projects/ProjectDetailRoutePage'
import { buildProjectDetailHead } from '~/components/projects/projectDetailHead'

export const Route = createFileRoute('/projects/$projectSlug/')({
  head: () => buildProjectDetailHead(),
  component: DynamicProjectDetailPage,
})

function DynamicProjectDetailPage() {
  const { projectSlug } = Route.useParams()

  return <ProjectDetailRoutePage slug={projectSlug} />
}

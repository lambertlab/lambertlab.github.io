import { createFileRoute } from '@tanstack/react-router'
import { ProjectDetailPage } from '~/components/projects/ProjectDetailPage'
import { buildProjectDetailHead } from '~/components/projects/projectDetailHead'
import { useProjectsCompatPathNormalization } from '~/lib/projectsCompatPathNormalization'

export const Route = createFileRoute('/projects/$projectSlug/index.html')({
  head: () => buildProjectDetailHead(),
  component: DynamicProjectDetailHtmlPage,
})

function DynamicProjectDetailHtmlPage() {
  const { projectSlug } = Route.useParams()

  useProjectsCompatPathNormalization()

  return <ProjectDetailPage slug={projectSlug} />
}

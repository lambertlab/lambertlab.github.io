import { createFileRoute } from '@tanstack/react-router'
import { ProjectDetailPage } from '~/components/projects/ProjectDetailPage'
import { buildProjectDetailHead } from '~/components/projects/projectDetailHead'

export const Route = createFileRoute('/projects/personal-toolbox/')({
  head: () => buildProjectDetailHead(),
  component: ProjectPersonalToolboxPage,
})

function ProjectPersonalToolboxPage() {
  return <ProjectDetailPage slug="personal-toolbox" />
}

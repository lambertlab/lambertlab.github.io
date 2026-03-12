import { createFileRoute } from '@tanstack/react-router'
import { ProjectDetailPage } from '~/components/projects/ProjectDetailPage'
import { buildProjectDetailHead } from '~/components/projects/projectDetailHead'
import { useProjectsCompatPathNormalization } from '~/lib/projectsCompatPathNormalization'

export const Route = createFileRoute('/projects/ai-message-value-triage/index.html')({
  head: () => buildProjectDetailHead(),
  component: ProjectAiMessageValueTriageHtmlPage,
})

function ProjectAiMessageValueTriageHtmlPage() {
  useProjectsCompatPathNormalization()
  return <ProjectDetailPage slug="ai-message-value-triage" />
}

import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { useProjectsCompatPathNormalization } from '~/lib/projectsCompatPathNormalization'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/projects/index.html')({
  head: () => buildLegacyHead(legacyPages.projects),
  component: ProjectsHtmlPage,
})

function ProjectsHtmlPage() {
  useProjectsCompatPathNormalization()
  return <LegacyPageView page={legacyPages.projects} />
}

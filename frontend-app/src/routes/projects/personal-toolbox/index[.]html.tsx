import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { useProjectsCompatPathNormalization } from '~/lib/projectsCompatPathNormalization'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/projects/personal-toolbox/index.html')({
  head: () => buildLegacyHead(legacyPages.projectPersonalToolbox),
  component: ProjectPersonalToolboxHtmlPage,
})

function ProjectPersonalToolboxHtmlPage() {
  useProjectsCompatPathNormalization()
  return <LegacyPageView page={legacyPages.projectPersonalToolbox} />
}

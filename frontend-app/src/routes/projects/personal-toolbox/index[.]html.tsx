import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/projects/personal-toolbox/index.html')({
  head: () => buildLegacyHead(legacyPages.projectPersonalToolbox),
  component: ProjectPersonalToolboxHtmlPage,
})

function ProjectPersonalToolboxHtmlPage() {
  return <LegacyPageView page={legacyPages.projectPersonalToolbox} />
}


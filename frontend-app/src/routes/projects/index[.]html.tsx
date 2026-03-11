import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/projects/index.html')({
  head: () => buildLegacyHead(legacyPages.projects),
  component: ProjectsHtmlPage,
})

function ProjectsHtmlPage() {
  return <LegacyPageView page={legacyPages.projects} />
}


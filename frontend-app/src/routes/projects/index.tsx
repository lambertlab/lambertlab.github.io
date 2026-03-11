import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/projects/')({
  head: () => buildLegacyHead(legacyPages.projects),
  component: ProjectsPage,
})

function ProjectsPage() {
  return <LegacyPageView page={legacyPages.projects} />
}


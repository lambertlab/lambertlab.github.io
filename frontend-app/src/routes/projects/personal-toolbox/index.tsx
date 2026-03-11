import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/projects/personal-toolbox/')({
  head: () => buildLegacyHead(legacyPages.projectPersonalToolbox),
  component: ProjectPersonalToolboxPage,
})

function ProjectPersonalToolboxPage() {
  return <LegacyPageView page={legacyPages.projectPersonalToolbox} />
}


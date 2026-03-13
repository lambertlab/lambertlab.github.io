import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/about/')({
  head: () => buildLegacyHead(legacyPages.about),
  component: AboutPage,
})

function AboutPage() {
  return <LegacyPageView page={legacyPages.about} />
}


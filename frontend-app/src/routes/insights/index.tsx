import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/insights/')({
  head: () => buildLegacyHead(legacyPages.insights),
  component: InsightsPage,
})

function InsightsPage() {
  return <LegacyPageView page={legacyPages.insights} />
}


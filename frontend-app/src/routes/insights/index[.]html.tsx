import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/insights/index.html')({
  head: () => buildLegacyHead(legacyPages.insights),
  component: InsightsHtmlPage,
})

function InsightsHtmlPage() {
  return <LegacyPageView page={legacyPages.insights} />
}


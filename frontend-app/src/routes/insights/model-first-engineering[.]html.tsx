import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/insights/model-first-engineering.html')({
  head: () => buildLegacyHead(legacyPages.insightModelFirstEngineering),
  component: InsightModelFirstEngineeringPage,
})

function InsightModelFirstEngineeringPage() {
  return <LegacyPageView page={legacyPages.insightModelFirstEngineering} />
}


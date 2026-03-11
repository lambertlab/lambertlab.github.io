import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/journal/model-first-engineering/index.html')({
  head: () => buildLegacyHead(legacyPages.insightModelFirstEngineering),
  component: JournalModelFirstEngineeringHtmlPage,
})

function JournalModelFirstEngineeringHtmlPage() {
  return <LegacyPageView page={legacyPages.insightModelFirstEngineering} />
}


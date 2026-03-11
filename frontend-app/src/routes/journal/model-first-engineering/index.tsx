import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/journal/model-first-engineering/')({
  head: () => buildLegacyHead(legacyPages.journalModelFirstEngineering),
  component: JournalModelFirstEngineeringPage,
})

function JournalModelFirstEngineeringPage() {
  return <LegacyPageView page={legacyPages.journalModelFirstEngineering} />
}

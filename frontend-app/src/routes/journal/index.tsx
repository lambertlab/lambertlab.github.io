import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/journal/')({
  head: () => buildLegacyHead(legacyPages.journal),
  component: JournalPage,
})

function JournalPage() {
  return <LegacyPageView page={legacyPages.journal} />
}

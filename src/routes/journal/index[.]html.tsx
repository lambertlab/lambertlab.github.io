import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/journal/index.html')({
  head: () => buildLegacyHead(legacyPages.journal),
  component: JournalHtmlPage,
})

function JournalHtmlPage() {
  return <LegacyPageView page={legacyPages.journal} />
}

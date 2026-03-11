import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/journal/operational-habits-that-stick/index.html')({
  head: () => buildLegacyHead(legacyPages.insightOperationalHabitsThatStick),
  component: JournalOperationalHabitsThatStickHtmlPage,
})

function JournalOperationalHabitsThatStickHtmlPage() {
  return <LegacyPageView page={legacyPages.insightOperationalHabitsThatStick} />
}


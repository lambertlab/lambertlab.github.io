import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/journal/operational-habits-that-stick/')({
  head: () => buildLegacyHead(legacyPages.journalOperationalHabitsThatStick),
  component: JournalOperationalHabitsThatStickPage,
})

function JournalOperationalHabitsThatStickPage() {
  return <LegacyPageView page={legacyPages.journalOperationalHabitsThatStick} />
}

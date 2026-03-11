import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/insights/operational-habits-that-stick.html')({
  head: () => buildLegacyHead(legacyPages.insightOperationalHabitsThatStick),
  component: InsightOperationalHabitsThatStickPage,
})

function InsightOperationalHabitsThatStickPage() {
  return <LegacyPageView page={legacyPages.insightOperationalHabitsThatStick} />
}


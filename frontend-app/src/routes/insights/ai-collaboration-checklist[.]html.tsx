import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/insights/ai-collaboration-checklist.html')({
  head: () => buildLegacyHead(legacyPages.insightAiCollaborationChecklist),
  component: InsightAiCollaborationChecklistPage,
})

function InsightAiCollaborationChecklistPage() {
  return <LegacyPageView page={legacyPages.insightAiCollaborationChecklist} />
}


import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/journal/ai-collaboration-checklist/')({
  head: () => buildLegacyHead(legacyPages.journalAiCollaborationChecklist),
  component: JournalAiCollaborationChecklistPage,
})

function JournalAiCollaborationChecklistPage() {
  return <LegacyPageView page={legacyPages.journalAiCollaborationChecklist} />
}

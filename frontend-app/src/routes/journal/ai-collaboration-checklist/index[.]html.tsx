import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/journal/ai-collaboration-checklist/index.html')({
  head: () => buildLegacyHead(legacyPages.journalAiCollaborationChecklist),
  component: JournalAiCollaborationChecklistHtmlPage,
})

function JournalAiCollaborationChecklistHtmlPage() {
  return <LegacyPageView page={legacyPages.journalAiCollaborationChecklist} />
}

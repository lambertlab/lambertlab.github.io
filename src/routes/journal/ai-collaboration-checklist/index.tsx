import { createFileRoute } from '@tanstack/react-router'
import { JournalDetailTemplate } from '~/components/content/JournalDetailTemplate'
import { journalDetailEntries } from '~/components/content/journalDetailEntries'
import { buildContentPageHead } from '~/lib/contentPageHead'
import { legacyPageMetadata } from '~/lib/siteCopy'

export const Route = createFileRoute('/journal/ai-collaboration-checklist/')({
  head: () => buildContentPageHead(legacyPageMetadata['journal-ai-collaboration-checklist'], ['/css/bento-pages.css']),
  component: JournalAiCollaborationChecklistPage,
})

function JournalAiCollaborationChecklistPage() {
  return <JournalDetailTemplate entry={journalDetailEntries['ai-collaboration-checklist']} />
}

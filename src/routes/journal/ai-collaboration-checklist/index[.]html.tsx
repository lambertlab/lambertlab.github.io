import { createFileRoute } from '@tanstack/react-router'
import { JournalDetailTemplate } from '~/components/content/JournalDetailTemplate'
import { PublicCompatRouteAdapter } from '~/components/content/PublicCompatRouteAdapter'
import { journalDetailContentBySlug, toContentPageMetadata } from '~/content/contentModels'
import { buildContentPageHead } from '~/lib/contentPageHead'

export const Route = createFileRoute('/journal/ai-collaboration-checklist/index.html')({
  head: () =>
    buildContentPageHead(toContentPageMetadata(journalDetailContentBySlug['ai-collaboration-checklist']), ['/css/bento-pages.css']),
  component: JournalAiCollaborationChecklistHtmlPage,
})

function JournalAiCollaborationChecklistHtmlPage() {
  return (
    <PublicCompatRouteAdapter>
      <JournalDetailTemplate content={journalDetailContentBySlug['ai-collaboration-checklist']} />
    </PublicCompatRouteAdapter>
  )
}

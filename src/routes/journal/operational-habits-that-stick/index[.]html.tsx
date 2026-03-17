import { createFileRoute } from '@tanstack/react-router'
import { JournalDetailTemplate } from '~/components/content/JournalDetailTemplate'
import { PublicCompatRouteAdapter } from '~/components/content/PublicCompatRouteAdapter'
import { journalDetailContentBySlug, toContentPageMetadata } from '~/content/contentModels'
import { buildContentPageHead } from '~/lib/contentPageHead'

export const Route = createFileRoute('/journal/operational-habits-that-stick/index.html')({
  head: () => buildContentPageHead(toContentPageMetadata(journalDetailContentBySlug['operational-habits-that-stick']), ['/css/bento-pages.css']),
  component: JournalOperationalHabitsThatStickHtmlPage,
})

function JournalOperationalHabitsThatStickHtmlPage() {
  return (
    <PublicCompatRouteAdapter>
      <JournalDetailTemplate content={journalDetailContentBySlug['operational-habits-that-stick']} />
    </PublicCompatRouteAdapter>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { JournalDetailTemplate } from '~/components/content/JournalDetailTemplate'
import { PublicCompatRouteAdapter } from '~/components/content/PublicCompatRouteAdapter'
import { journalDetailContentBySlug, toContentPageMetadata } from '~/content/contentModels'
import { buildContentPageHead } from '~/lib/contentPageHead'

export const Route = createFileRoute('/journal/model-first-engineering/index.html')({
  head: () => buildContentPageHead(toContentPageMetadata(journalDetailContentBySlug['model-first-engineering']), ['/css/bento-pages.css']),
  component: JournalModelFirstEngineeringHtmlPage,
})

function JournalModelFirstEngineeringHtmlPage() {
  return (
    <PublicCompatRouteAdapter>
      <JournalDetailTemplate content={journalDetailContentBySlug['model-first-engineering']} />
    </PublicCompatRouteAdapter>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { JournalDetailTemplate } from '~/components/content/JournalDetailTemplate'
import { journalDetailContentBySlug, toContentPageMetadata } from '~/content/contentModels'
import { buildContentPageHead } from '~/lib/contentPageHead'

export const Route = createFileRoute('/journal/model-first-engineering/')({
  head: () => buildContentPageHead(toContentPageMetadata(journalDetailContentBySlug['model-first-engineering']), ['/css/bento-pages.css']),
  component: JournalModelFirstEngineeringPage,
})

function JournalModelFirstEngineeringPage() {
  return <JournalDetailTemplate content={journalDetailContentBySlug['model-first-engineering']} />
}

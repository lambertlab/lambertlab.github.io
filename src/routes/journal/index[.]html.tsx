import { createFileRoute } from '@tanstack/react-router'
import { JournalIndexPage } from '~/components/content/JournalIndexPage'
import { journalIndexContentModel, toContentPageMetadata } from '~/content/contentModels'
import { buildContentPageHead } from '~/lib/contentPageHead'

export const Route = createFileRoute('/journal/index.html')({
  head: () => buildContentPageHead(toContentPageMetadata(journalIndexContentModel), ['/css/page-journal.css']),
  component: JournalHtmlPage,
})

function JournalHtmlPage() {
  return <JournalIndexPage content={journalIndexContentModel} />
}

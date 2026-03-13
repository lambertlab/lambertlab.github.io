import { createFileRoute } from '@tanstack/react-router'
import { JournalIndexPage } from '~/components/content/JournalIndexPage'
import { buildContentPageHead } from '~/lib/contentPageHead'
import { legacyPageMetadata } from '~/lib/siteCopy'

export const Route = createFileRoute('/journal/')({
  head: () => buildContentPageHead(legacyPageMetadata.journal, ['/css/page-journal.css']),
  component: JournalRoutePage,
})

function JournalRoutePage() {
  return <JournalIndexPage />
}

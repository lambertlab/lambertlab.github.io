import { createFileRoute } from '@tanstack/react-router'
import { JournalDetailTemplate } from '~/components/content/JournalDetailTemplate'
import { journalDetailContentBySlug, toContentPageMetadata } from '~/content/contentModels'
import { buildContentPageHead } from '~/lib/contentPageHead'

export const Route = createFileRoute('/journal/operational-habits-that-stick/')({
  head: () => buildContentPageHead(toContentPageMetadata(journalDetailContentBySlug['operational-habits-that-stick']), ['/css/bento-pages.css']),
  component: JournalOperationalHabitsThatStickPage,
})

function JournalOperationalHabitsThatStickPage() {
  return <JournalDetailTemplate content={journalDetailContentBySlug['operational-habits-that-stick']} />
}

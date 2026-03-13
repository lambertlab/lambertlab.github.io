import { createFileRoute } from '@tanstack/react-router'
import { JournalDetailTemplate } from '~/components/content/JournalDetailTemplate'
import { journalDetailEntries } from '~/components/content/journalDetailEntries'
import { buildContentPageHead } from '~/lib/contentPageHead'
import { legacyPageMetadata } from '~/lib/siteCopy'

export const Route = createFileRoute('/journal/operational-habits-that-stick/')({
  head: () =>
    buildContentPageHead(legacyPageMetadata['journal-operational-habits-that-stick'], ['/css/bento-pages.css']),
  component: JournalOperationalHabitsThatStickPage,
})

function JournalOperationalHabitsThatStickPage() {
  return <JournalDetailTemplate entry={journalDetailEntries['operational-habits-that-stick']} />
}

import { createFileRoute } from '@tanstack/react-router'
import { JournalDetailTemplate } from '~/components/content/JournalDetailTemplate'
import { journalDetailEntries } from '~/components/content/journalDetailEntries'
import { buildContentPageHead } from '~/lib/contentPageHead'
import { legacyPageMetadata } from '~/lib/siteCopy'

export const Route = createFileRoute('/journal/model-first-engineering/')({
  head: () => buildContentPageHead(legacyPageMetadata['journal-model-first-engineering'], ['/css/bento-pages.css']),
  component: JournalModelFirstEngineeringPage,
})

function JournalModelFirstEngineeringPage() {
  return <JournalDetailTemplate entry={journalDetailEntries['model-first-engineering']} />
}

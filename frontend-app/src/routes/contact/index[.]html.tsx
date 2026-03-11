import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/contact/index.html')({
  head: () => buildLegacyHead(legacyPages.contact),
  component: ContactHtmlPage,
})

function ContactHtmlPage() {
  return <LegacyPageView page={legacyPages.contact} />
}


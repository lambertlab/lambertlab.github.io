import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/contact/')({
  head: () => buildLegacyHead(legacyPages.contact),
  component: ContactPage,
})

function ContactPage() {
  return <LegacyPageView page={legacyPages.contact} />
}


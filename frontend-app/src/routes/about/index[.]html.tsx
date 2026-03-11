import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/about/index.html')({
  head: () => buildLegacyHead(legacyPages.about),
  component: AboutHtmlPage,
})

function AboutHtmlPage() {
  return <LegacyPageView page={legacyPages.about} />
}


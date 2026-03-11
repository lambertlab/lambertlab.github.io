import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, homeTailwindHeadScripts, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/index.html')({
  head: () => ({
    ...buildLegacyHead(legacyPages.home),
    scripts: homeTailwindHeadScripts,
  }),
  component: HomeHtmlPage,
})

function HomeHtmlPage() {
  return <LegacyPageView page={legacyPages.home} />
}

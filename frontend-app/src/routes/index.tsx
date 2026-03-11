import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, homeTailwindHeadScripts, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/')({
  head: () => ({
    ...buildLegacyHead(legacyPages.home),
    scripts: homeTailwindHeadScripts,
  }),
  component: HomePage,
})

function HomePage() {
  return <LegacyPageView page={legacyPages.home} />
}

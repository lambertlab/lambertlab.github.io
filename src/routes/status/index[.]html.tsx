import { createFileRoute } from '@tanstack/react-router'
import { PublicCompatRouteAdapter } from '~/components/content/PublicCompatRouteAdapter'
import { StatusPage } from '~/components/status/StatusPage'
import { buildStatusPageHead } from '~/components/status/statusPageHead'

export const Route = createFileRoute('/status/index.html')({
  head: () => buildStatusPageHead(),
  component: StatusHtmlRoutePage,
})

function StatusHtmlRoutePage() {
  return (
    <PublicCompatRouteAdapter>
      <StatusPage />
    </PublicCompatRouteAdapter>
  )
}

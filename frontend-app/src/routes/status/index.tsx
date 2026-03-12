import { createFileRoute } from '@tanstack/react-router'
import { StatusPage } from '~/components/status/StatusPage'
import { buildStatusPageHead } from '~/components/status/statusPageHead'

export const Route = createFileRoute('/status/')({
  head: () => buildStatusPageHead(),
  component: StatusRoutePage,
})

function StatusRoutePage() {
  return <StatusPage />
}

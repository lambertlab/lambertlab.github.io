import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/projects/ai-message-value-triage/')({
  head: () => buildLegacyHead(legacyPages.projectAiMessageValueTriage),
  component: ProjectAiMessageValueTriagePage,
})

function ProjectAiMessageValueTriagePage() {
  return <LegacyPageView page={legacyPages.projectAiMessageValueTriage} />
}


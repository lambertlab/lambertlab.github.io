import { createFileRoute } from '@tanstack/react-router'
import { LegacyPageView } from '~/components/LegacyPageView'
import { buildLegacyHead, legacyPages } from '~/legacy/pages'

export const Route = createFileRoute('/projects/ai-message-value-triage/index.html')({
  head: () => buildLegacyHead(legacyPages.projectAiMessageValueTriage),
  component: ProjectAiMessageValueTriageHtmlPage,
})

function ProjectAiMessageValueTriageHtmlPage() {
  return <LegacyPageView page={legacyPages.projectAiMessageValueTriage} />
}


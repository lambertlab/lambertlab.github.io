import type { UiLocale } from '~/lib/uiLocale'
import type { ProjectCatalogMetrics, ProjectsLoadStatus } from '../model/projectTypes'

interface ProjectsCatalogMetricsProps {
  metrics: ProjectCatalogMetrics
  status: ProjectsLoadStatus
  locale: UiLocale
}

const METRICS_COPY = {
  'zh-CN': {
    projects: '项目数',
    active: '活跃数',
    updated: '最近更新',
    sources: '来源数',
    pending: '--',
  },
  en: {
    projects: 'Projects',
    active: 'Active',
    updated: 'Updated',
    sources: 'Sources',
    pending: '--',
  },
} as const

function formatDateTime(value: string | null, locale: UiLocale): string {
  if (!value) return '--'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '--'

  return parsed.toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: locale === 'en' ? 'short' : '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function ProjectsCatalogMetrics({ metrics, status, locale }: ProjectsCatalogMetricsProps) {
  const copy = METRICS_COPY[locale]
  const isPending = status === 'loading' && metrics.totalItems === 0
  const pendingValue = copy.pending

  return (
    <div className="hero-metrics" aria-label="catalog metrics">
      <article className="metric metric-compact">
        <p className="label">{copy.sources}</p>
        <p className="value" data-source-count>{isPending ? pendingValue : metrics.sourceCount}</p>
      </article>
      <article className="metric metric-compact">
        <p className="label">{copy.projects}</p>
        <p className="value" data-total-items>{isPending ? pendingValue : metrics.totalItems}</p>
      </article>
      <article className="metric metric-compact">
        <p className="label">{copy.active}</p>
        <p className="value" data-live-items>{isPending ? pendingValue : metrics.liveItems}</p>
      </article>
      <article className="metric metric-updated">
        <p className="label">{copy.updated}</p>
        <p className="value" data-last-sync>{isPending ? pendingValue : formatDateTime(metrics.lastUpdatedAt, locale)}</p>
      </article>
    </div>
  )
}

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
    projectsDesc: '目录项目总数',
    active: '活跃数',
    activeDesc: '当前活跃项目数量',
    updated: '最近更新',
    updatedDesc: '目录最近更新时间',
    sources: '来源数',
    sourcesDesc: '项目来源类型数量',
    pending: '--',
  },
  en: {
    projects: 'Projects',
    projectsDesc: 'Total catalog entries',
    active: 'Active',
    activeDesc: 'Currently active projects',
    updated: 'Last Updated',
    updatedDesc: 'Latest catalog refresh time',
    sources: 'Sources',
    sourcesDesc: 'Distinct project source types',
    pending: '--',
  },
} as const

function formatDateTime(value: string | null, locale: UiLocale): string {
  if (!value) {
    return '--'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '--'
  }

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

  return (
    <div className="hero-metrics" aria-label="catalog metrics">
      <article className="metric">
        <p className="label">{copy.projects}</p>
        <p className="value" data-total-items>{isPending ? copy.pending : metrics.totalItems}</p>
        <p className="desc">{copy.projectsDesc}</p>
      </article>
      <article className="metric">
        <p className="label">{copy.active}</p>
        <p className="value" data-live-items>{isPending ? copy.pending : metrics.liveItems}</p>
        <p className="desc">{copy.activeDesc}</p>
      </article>
      <article className="metric">
        <p className="label">{copy.updated}</p>
        <p className="value" data-last-sync>{isPending ? 'Pending' : formatDateTime(metrics.lastUpdatedAt, locale)}</p>
        <p className="desc">{copy.updatedDesc}</p>
      </article>
      <article className="metric">
        <p className="label">{copy.sources}</p>
        <p className="value" data-source-count>{isPending ? copy.pending : metrics.sourceCount}</p>
        <p className="desc">{copy.sourcesDesc}</p>
      </article>
    </div>
  )
}
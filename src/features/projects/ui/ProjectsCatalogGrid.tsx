import type { UiLocale } from '~/lib/uiLocale'
import type { ProjectCatalogRecord } from '../model/projectTypes'

interface ProjectsCatalogGridProps {
  projects: ProjectCatalogRecord[]
  locale: UiLocale
  hidden?: boolean
}

const GRID_COPY = {
  'zh-CN': {
    missingSummary: '暂未提供摘要。',
    untagged: '未标记',
    source: '来源',
    type: '类型',
    updated: '更新于',
    detail: '项目详情',
    detailPending: '详情待补充',
    primaryLink: '主入口',
    repository: '仓库',
    sourceLabels: { github: 'GitHub', local: '本地', private: '私有', hybrid: '混合' },
    typeLabels: { uncategorized: '暂不分类', website: '站点', backend: '后端', tooling: '工具', infra: '基础设施', research: '研究', agent: '智能体', data: '数据', library: '库' },
    stageLabels: { active: '活跃', building: '建设中', research: '研究中', archived: '已归档', maintenance: '维护中' },
  },
  en: {
    missingSummary: 'No description provided.',
    untagged: 'untagged',
    source: 'Source',
    type: 'Type',
    updated: 'Updated',
    detail: 'Project Detail',
    detailPending: 'Detail Pending',
    primaryLink: 'Primary Link',
    repository: 'Repository',
    sourceLabels: { github: 'GitHub', local: 'Local', private: 'Private', hybrid: 'Hybrid' },
    typeLabels: { uncategorized: 'Uncategorized', website: 'Website', backend: 'Backend', tooling: 'Tooling', infra: 'Infrastructure', research: 'Research', agent: 'Agent', data: 'Data', library: 'Library' },
    stageLabels: { active: 'Active', building: 'Building', research: 'Research', archived: 'Archived', maintenance: 'Maintenance' },
  },
} as const

function normalizeValue(value: string): string {
  return value.trim().toLowerCase().replace(/[_\s]+/g, '-')
}

function translateStage(value: string, locale: UiLocale): string {
  const normalized = normalizeValue(value)
  const labels = GRID_COPY[locale].stageLabels
  return labels[normalized as keyof typeof labels] ?? value ?? 'Unknown'
}

function translateSource(value: string, locale: UiLocale): string {
  const normalized = normalizeValue(value)
  const labels = GRID_COPY[locale].sourceLabels
  return labels[normalized as keyof typeof labels] ?? value ?? '--'
}

function translateType(value: string, locale: UiLocale): string {
  const normalized = normalizeValue(value)
  const labels = GRID_COPY[locale].typeLabels
  return labels[normalized as keyof typeof labels] ?? value ?? '--'
}

function formatDate(value: string | null, locale: UiLocale): string {
  if (!value) {
    return '--'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '--'
  }

  return parsed.toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function getStageClassName(stage: string): string {
  const normalized = normalizeValue(stage)
  if (normalized === 'active') return 'status-pill stage-active'
  if (normalized === 'building') return 'status-pill stage-building'
  if (normalized === 'research') return 'status-pill stage-research'
  if (normalized === 'archived') return 'status-pill stage-archived'
  return 'status-pill stage-maintenance'
}

export function ProjectsCatalogGrid({ projects, locale, hidden = false }: ProjectsCatalogGridProps) {
  const copy = GRID_COPY[locale]

  return (
    <div className="projects-grid" data-project-grid hidden={hidden}>
      {projects.map((project, index) => {
        const primaryHref = project.canonical_path || '#'
        const summary = project.summary || project.description || copy.missingSummary
        const tags = project.tags.length > 0 ? project.tags.slice(0, 4) : [copy.untagged]
        const stack = project.stack.slice(0, 3)

        return (
          <article key={project.slug || String(project.id ?? index)} className="project-card" data-stage={project.stage || 'unknown'}>
            <div className="project-top">
              <h3 className="project-name">
                <a href={primaryHref}>{project.name}</a>
              </h3>
              <span className={getStageClassName(project.stage)}>{translateStage(project.stage, locale)}</span>
            </div>

            <p className="project-desc">{summary}</p>

            <div className="project-tags">
              {tags.map((tag) => (
                <span key={`tag-${project.slug || project.id || index}-${tag}`} className="project-tag">
                  {tag}
                </span>
              ))}
              {stack.map((item) => (
                <span key={`stack-${project.slug || project.id || index}-${item}`} className="project-tag stack-tag">
                  {item}
                </span>
              ))}
            </div>

            <div className="project-stats">
              <div className="stat-box">
                <p className="stat-label">{copy.source}</p>
                <p className="stat-value">{translateSource(project.source_type, locale)}</p>
              </div>
              <div className="stat-box">
                <p className="stat-label">{copy.type}</p>
                <p className="stat-value">{translateType(project.project_type, locale)}</p>
              </div>
              <div className="stat-box">
                <p className="stat-label">{copy.updated}</p>
                <p className="stat-value">{formatDate(project.updated_at || project.pushed_at, locale)}</p>
              </div>
            </div>

            <div className="project-actions">
              <a className="btn primary" href={primaryHref} aria-disabled={!project.canonical_path ? 'true' : undefined}>
                {project.canonical_path ? copy.detail : copy.detailPending}
              </a>
              {project.links.primary && project.links.primary !== primaryHref ? (
                <a className="btn" href={project.links.primary} target="_blank" rel="noreferrer">
                  {copy.primaryLink}
                </a>
              ) : null}
              {project.links.repo ? (
                <a className="btn" href={project.links.repo} target="_blank" rel="noreferrer">
                  {copy.repository}
                </a>
              ) : null}
              {project.links.demo ? (
                <a className="btn" href={project.links.demo} target="_blank" rel="noreferrer">
                  Demo
                </a>
              ) : null}
              {project.links.docs ? (
                <a className="btn" href={project.links.docs} target="_blank" rel="noreferrer">
                  Docs
                </a>
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}

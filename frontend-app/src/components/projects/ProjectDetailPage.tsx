import { Link } from '@tanstack/react-router'
import * as React from 'react'
import { ProjectApiError, type ProjectDetailRecord, fetchProjectDetail } from '~/lib/projectsApi'
import { useDocumentMetadata, useUiLocale, type UiLocale } from '~/lib/uiLocale'

type DetailState =
  | { status: 'loading' }
  | { status: 'ready'; project: ProjectDetailRecord }
  | { status: 'not-found'; message: string }
  | { status: 'error'; message: string }

interface ProjectDetailPageProps {
  slug: string
}

function isExternalUrl(value: string | null): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase().replace(/[_\s]+/g, '-')
}

function translateStage(value: string, locale: UiLocale): string {
  const normalized = normalizeValue(value)
  if (!normalized) {
    return locale === 'zh-CN' ? '待补充' : 'Pending'
  }

  if (locale === 'en') {
    if (normalized === 'building') return 'Building'
    if (normalized === 'active') return 'Active'
    if (normalized === 'maintenance') return 'Maintenance'
    if (normalized === 'research') return 'Research'
    if (normalized === 'archived') return 'Archived'
    return value
  }

  if (normalized === 'building') return '建设中'
  if (normalized === 'active') return '活跃'
  if (normalized === 'maintenance') return '维护中'
  if (normalized === 'research') return '研究中'
  if (normalized === 'archived') return '已归档'
  return value
}

function translateProjectType(value: string, locale: UiLocale): string {
  const normalized = normalizeValue(value)
  if (!normalized) {
    return locale === 'zh-CN' ? '待补充' : 'Pending'
  }

  if (locale === 'en') {
    if (normalized === 'website') return 'Website'
    if (normalized === 'backend') return 'Backend'
    if (normalized === 'tooling') return 'Tooling'
    if (normalized === 'infra') return 'Infrastructure'
    if (normalized === 'research') return 'Research'
    if (normalized === 'agent') return 'Agent'
    if (normalized === 'data') return 'Data'
    if (normalized === 'library') return 'Library'
    return value
  }

  if (normalized === 'website') return '站点'
  if (normalized === 'backend') return '后端'
  if (normalized === 'tooling') return '工具'
  if (normalized === 'infra') return '基础设施'
  if (normalized === 'research') return '研究'
  if (normalized === 'agent') return '智能体'
  if (normalized === 'data') return '数据'
  if (normalized === 'library') return '库'
  return value
}

function translateSourceType(value: string, locale: UiLocale): string {
  const normalized = normalizeValue(value)
  if (!normalized) {
    return locale === 'zh-CN' ? '待补充' : 'Pending'
  }

  if (locale === 'en') {
    if (normalized === 'github') return 'GitHub'
    if (normalized === 'local') return 'Local'
    if (normalized === 'private') return 'Private'
    if (normalized === 'hybrid') return 'Hybrid'
    return value
  }

  if (normalized === 'github') return 'GitHub'
  if (normalized === 'local') return '本地'
  if (normalized === 'private') return '私有'
  if (normalized === 'hybrid') return '混合'
  return value
}

function translateVisibility(value: string, locale: UiLocale): string {
  const normalized = normalizeValue(value)
  if (!normalized) {
    return locale === 'zh-CN' ? '待补充' : 'Pending'
  }

  if (locale === 'en') {
    if (normalized === 'public') return 'Public'
    if (normalized === 'private') return 'Private'
    if (normalized === 'internal') return 'Internal'
    return value
  }

  if (normalized === 'public') return '公开'
  if (normalized === 'private') return '私有'
  if (normalized === 'internal') return '内部'
  return value
}

function localizeProjectErrorMessage(message: string, locale: UiLocale): string {
  const normalized = message.trim()
  if (!normalized) {
    return locale === 'zh-CN' ? '当前无法加载项目详情。' : 'Unable to load the project detail right now.'
  }

  if (locale === 'en') {
    return normalized
  }

  if (normalized === 'Unable to load the project detail right now.') return '当前无法加载项目详情。'
  if (normalized === 'Project request timed out.') return '项目请求超时。'
  if (normalized === 'Project detail payload is invalid.') return '项目详情响应不符合协议。'
  if (normalized === 'Unknown project request error.') return '项目请求发生未知错误。'
  if (normalized === 'Project slug is required.') return '缺少项目 slug。'
  return normalized
}

function formatDate(value: string | null, locale: UiLocale): string {
  if (!value) {
    return locale === 'zh-CN' ? '待补充' : 'Pending'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return locale === 'zh-CN' ? '待补充' : 'Pending'
  }

  return parsed.toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function buildMetaItems(project: ProjectDetailRecord, locale: UiLocale) {
  return [
    {
      label: locale === 'zh-CN' ? '阶段' : 'Stage',
      value: translateStage(project.stage, locale),
    },
    {
      label: locale === 'zh-CN' ? '项目类型' : 'Project Type',
      value: translateProjectType(project.project_type, locale),
    },
    {
      label: locale === 'zh-CN' ? '来源类型' : 'Source Type',
      value: translateSourceType(project.source_type, locale),
    },
    {
      label: locale === 'zh-CN' ? '精选排序' : 'Featured Rank',
      value: project.featured_rank ? `#${project.featured_rank}` : locale === 'zh-CN' ? '未精选' : 'Not featured',
    },
    {
      label: locale === 'zh-CN' ? '规范路径' : 'Canonical Path',
      value: project.canonical_path || `/projects/${project.slug}/`,
    },
    {
      label: locale === 'zh-CN' ? '更新时间' : 'Updated',
      value: formatDate(project.updated_at, locale),
    },
  ]
}

function buildLinkItems(project: ProjectDetailRecord, locale: UiLocale) {
  return [
    { label: locale === 'zh-CN' ? '主入口' : 'Primary', href: project.links.primary },
    { label: locale === 'zh-CN' ? '仓库' : 'Repository', href: project.links.repo },
    { label: 'Demo', href: project.links.demo },
    { label: 'Docs', href: project.links.docs },
    { label: locale === 'zh-CN' ? '备注' : 'Notes', href: project.links.notes },
  ].filter((item) => typeof item.href === 'string' && item.href.trim().length > 0)
}

function buildSourceItems(project: ProjectDetailRecord, locale: UiLocale) {
  return [
    {
      label: locale === 'zh-CN' ? '项目键' : 'Project Key',
      value: project.project_key || (locale === 'zh-CN' ? '待补充' : 'Pending'),
    },
    {
      label: 'Slug',
      value: project.slug || (locale === 'zh-CN' ? '待补充' : 'Pending'),
    },
    {
      label: locale === 'zh-CN' ? '仓库' : 'Repository',
      value: project.source_refs.repo_full_name || (locale === 'zh-CN' ? '待补充' : 'Pending'),
    },
    {
      label: locale === 'zh-CN' ? '可见性' : 'Visibility',
      value: translateVisibility(project.source_refs.visibility || '', locale),
    },
  ]
}

function buildDetailMetadata(state: DetailState, slug: string, locale: UiLocale) {
  if (state.status === 'ready') {
    const projectName =
      state.project.name || state.project.slug || (locale === 'zh-CN' ? '未命名项目' : 'Untitled Project')
    const projectSummary =
      state.project.summary ||
      state.project.headline ||
      (locale === 'zh-CN'
        ? '基于统一 Projects 合同提供的项目详情页。'
        : 'Project detail powered by the unified Projects contract.')

    return {
      title:
        locale === 'zh-CN'
          ? `${projectName} | 项目详情 | lambertlab`
          : `${projectName} | Project Detail | lambertlab`,
      description: projectSummary,
    }
  }

  if (state.status === 'not-found') {
    return {
      title: locale === 'zh-CN' ? '项目未找到 | lambertlab' : 'Project Not Found | lambertlab',
      description:
        locale === 'zh-CN'
          ? `未找到 slug 为 ${slug} 的项目详情。`
          : `No project detail was found for the slug ${slug}.`,
    }
  }

  if (state.status === 'error') {
    return {
      title: locale === 'zh-CN' ? '项目详情暂不可用 | lambertlab' : 'Project Detail Unavailable | lambertlab',
      description:
        locale === 'zh-CN'
          ? '当前无法加载项目详情，可稍后重试。'
          : 'The project detail is unavailable right now. Please retry later.',
    }
  }

  return {
    title: locale === 'zh-CN' ? '项目详情 | lambertlab' : 'Project Detail | lambertlab',
    description:
      locale === 'zh-CN'
        ? '基于统一 Projects 合同加载项目详情。'
        : 'Loading project detail from the unified Projects contract.',
  }
}

export function ProjectDetailPage({ slug }: ProjectDetailPageProps) {
  const { locale } = useUiLocale()
  const [state, setState] = React.useState<DetailState>({ status: 'loading' })
  const metadata = buildDetailMetadata(state, slug, locale)

  useDocumentMetadata(metadata.title, metadata.description)

  const loadProject = React.useCallback(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })

    fetchProjectDetail(slug, controller.signal)
      .then((project) => {
        setState({ status: 'ready', project })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        const fallbackMessage = locale === 'zh-CN' ? '当前无法加载项目详情。' : 'Unable to load the project detail right now.'
        const message =
          error instanceof ProjectApiError && error.message.trim()
            ? localizeProjectErrorMessage(error.message, locale)
            : fallbackMessage

        if (error instanceof ProjectApiError && error.status === 404) {
          setState({ status: 'not-found', message: locale === 'zh-CN' ? '未找到该项目。' : 'Project not found.' })
          return
        }

        setState({ status: 'error', message })
      })

    return () => {
      controller.abort()
    }
  }, [locale, slug])

  React.useEffect(() => {
    const cleanup = loadProject()
    return cleanup
  }, [loadProject])

  return (
    <main className="project-detail-shell" id="main-content">
      <div className="project-detail-container">
        <div className="project-detail-breadcrumbs">
          <Link to="/projects">{locale === 'zh-CN' ? '项目目录' : 'Projects'}</Link>
          <span>/</span>
          <span>{slug}</span>
        </div>

        {state.status === 'loading' ? (
          <section className="project-detail-panel project-detail-loading" aria-live="polite">
            <p className="project-detail-kicker">{locale === 'zh-CN' ? '加载详情' : 'Loading detail'}</p>
            <h1>{locale === 'zh-CN' ? '正在准备项目详情' : 'Preparing project detail'}</h1>
            <p>
              {locale === 'zh-CN'
                ? '正在从统一 Projects 合同加载详情骨架。'
                : 'Loading the project detail shell from the unified Projects contract.'}
            </p>
          </section>
        ) : null}

        {state.status === 'not-found' ? (
          <section className="project-detail-panel project-detail-message">
            <p className="project-detail-kicker">{locale === 'zh-CN' ? '项目不存在' : 'Project not found'}</p>
            <h1>{state.message}</h1>
            <p>
              {locale === 'zh-CN'
                ? '当前 Projects 目录中不存在这个 slug。'
                : 'The requested slug does not exist in the current Projects catalog.'}
            </p>
            <div className="project-detail-actions">
              <Link className="project-detail-button primary" to="/projects">
                {locale === 'zh-CN' ? '返回项目目录' : 'Back to Projects'}
              </Link>
              <Link className="project-detail-button" to="/index.html">
                {locale === 'zh-CN' ? '回到首页' : 'Back home'}
              </Link>
            </div>
          </section>
        ) : null}

        {state.status === 'error' ? (
          <section className="project-detail-panel project-detail-message">
            <p className="project-detail-kicker">{locale === 'zh-CN' ? '详情暂不可用' : 'Detail unavailable'}</p>
            <h1>{locale === 'zh-CN' ? '当前无法加载这个项目' : 'Unable to load this project right now'}</h1>
            <p>{state.message}</p>
            <div className="project-detail-actions">
              <button className="project-detail-button primary" onClick={loadProject} type="button">
                {locale === 'zh-CN' ? '重试' : 'Retry'}
              </button>
              <Link className="project-detail-button" to="/projects">
                {locale === 'zh-CN' ? '返回项目目录' : 'Back to Projects'}
              </Link>
            </div>
          </section>
        ) : null}

        {state.status === 'ready' ? (
          <ProjectDetailContent locale={locale} project={state.project} onRetry={loadProject} />
        ) : null}
      </div>
    </main>
  )
}

function ProjectDetailContent({
  locale,
  project,
  onRetry,
}: {
  locale: UiLocale
  project: ProjectDetailRecord
  onRetry: () => void
}) {
  const metaItems = buildMetaItems(project, locale)
  const linkItems = buildLinkItems(project, locale)
  const sourceItems = buildSourceItems(project, locale)

  return (
    <div className="project-detail-layout">
      <section className="project-detail-panel project-detail-hero">
        <div className="project-detail-hero-copy">
          <p className="project-detail-kicker">
            {project.featured_rank
              ? locale === 'zh-CN'
                ? `精选 #${project.featured_rank}`
                : `Featured #${project.featured_rank}`
              : locale === 'zh-CN'
                ? '项目详情'
                : 'Project Detail'}
          </p>
          <h1>{project.name || project.slug || (locale === 'zh-CN' ? '未命名项目' : 'Untitled Project')}</h1>
          <p className="project-detail-summary">
            {project.summary || (locale === 'zh-CN' ? '暂未提供摘要。' : 'No summary provided.')}
          </p>
          <p className="project-detail-headline">
            {project.headline ||
              (locale === 'zh-CN'
                ? '项目注册表尚未补充 headline。'
                : 'Headline is pending from the project registry.')}
          </p>
        </div>

        <div className="project-detail-actions">
          {linkItems.length > 0 ? (
            linkItems.map((item, index) => (
              <a
                key={`${item.label}-${item.href}-${index}`}
                className={`project-detail-button ${index === 0 ? 'primary' : ''}`}
                href={item.href ?? '#'}
                target={isExternalUrl(item.href ?? null) ? '_blank' : undefined}
                rel={isExternalUrl(item.href ?? null) ? 'noreferrer' : undefined}
              >
                {item.label}
              </a>
            ))
          ) : (
            <button className="project-detail-button primary" onClick={onRetry} type="button">
              {locale === 'zh-CN' ? '重试拉取' : 'Retry fetch'}
            </button>
          )}
        </div>
      </section>

      <section className="project-detail-panel">
        <div className="project-detail-section-head">
          <p className="project-detail-kicker">{locale === 'zh-CN' ? '概览' : 'Overview'}</p>
          <h2>{locale === 'zh-CN' ? '这个项目是什么' : 'What this project is'}</h2>
        </div>
        <p className="project-detail-prose">
          {project.overview || (locale === 'zh-CN' ? '后端合同尚未补充概览。' : 'Overview is pending from the backend contract.')}
        </p>
        {project.status_note ? <p className="project-detail-status-note">{project.status_note}</p> : null}
      </section>

      <section className="project-detail-panel">
        <div className="project-detail-section-head">
          <p className="project-detail-kicker">{locale === 'zh-CN' ? '核心字段' : 'Core fields'}</p>
          <h2>{locale === 'zh-CN' ? '共享目录详情' : 'Shared catalog detail'}</h2>
        </div>
        <div className="project-detail-meta-grid">
          {metaItems.map((item) => (
            <article className="project-detail-meta-card" key={item.label}>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="project-detail-panel">
        <div className="project-detail-section-head">
          <p className="project-detail-kicker">{locale === 'zh-CN' ? '亮点' : 'Highlights'}</p>
          <h2>{locale === 'zh-CN' ? '当前要点' : 'Current takeaways'}</h2>
        </div>
        {project.highlights.length > 0 ? (
          <ul className="project-detail-highlights">
            {project.highlights.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="project-detail-prose">
            {locale === 'zh-CN' ? '这个项目暂时还没有亮点摘要。' : 'Highlights are not available yet for this project.'}
          </p>
        )}
      </section>

      <section className="project-detail-panel">
        <div className="project-detail-section-head">
          <p className="project-detail-kicker">{locale === 'zh-CN' ? '技术栈与来源' : 'Stack & source'}</p>
          <h2>{locale === 'zh-CN' ? '身份与来源' : 'Identity and provenance'}</h2>
        </div>
        <div className="project-detail-chip-row">
          {project.stack.length > 0 ? (
            project.stack.map((item) => (
              <span className="project-detail-chip" key={item}>
                {item}
              </span>
            ))
          ) : (
            <span className="project-detail-chip muted">{locale === 'zh-CN' ? '技术栈待补充' : 'Stack pending'}</span>
          )}
        </div>
        <dl className="project-detail-source-list">
          {sourceItems.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

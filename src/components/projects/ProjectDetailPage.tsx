import { Link } from '@tanstack/react-router'
import * as React from 'react'
import { loadProjectDetailSnapshot, readProjectDetailSnapshot } from '~/lib/pageDataCache'
import { ProjectApiError, type ProjectDetailRecord } from '~/lib/projectsApi'
import { useDocumentMetadata, useUiLocale, type UiLocale } from '~/lib/uiLocale'

type DetailState =
  | { status: 'loading' }
  | { status: 'ready'; project: ProjectDetailRecord }
  | { status: 'degraded'; project: ProjectDetailRecord; missingFields: DegradedFieldKey[] }
  | { status: 'not-found'; message: string }
  | { status: 'error'; message: string }

interface ProjectDetailPageProps {
  slug: string
}

type DegradedFieldKey = 'summary' | 'overview' | 'stage' | 'project_type' | 'source_type'

interface RepositoryViewItem {
  key: string
  name: string
  fullName: string | null
  href: string | null
  visibility: string | null
  isPrimary: boolean
  canOpen: boolean
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
    if (normalized === 'uncategorized') return 'Uncategorized'
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
      label: locale === 'zh-CN' ? '\u9636\u6bb5' : 'Stage',
      value: translateStage(project.stage, locale),
    },
    {
      label: locale === 'zh-CN' ? '\u9879\u76ee\u7c7b\u578b' : 'Project Type',
      value: translateProjectType(project.project_type, locale),
    },
    {
      label: locale === 'zh-CN' ? '\u66f4\u65b0\u65f6\u95f4' : 'Updated',
      value: formatDate(project.updated_at, locale),
    },
  ]
}

function buildRepositoryItems(project: ProjectDetailRecord): RepositoryViewItem[] {
  return project.repositories.map((repository, index) => {
    const name =
      repository.name || repository.full_name || repository.url || `${project.slug || 'project'}-repository-${index + 1}`
    const fullName = repository.full_name || null
    const href = repository.url || null
    const visibility = normalizeValue(repository.visibility || 'public') || 'public'

    return {
      key: `${repository.full_name || repository.url || repository.name || 'repo'}-${index}`,
      name,
      fullName,
      href,
      visibility,
      isPrimary: repository.is_primary,
      canOpen: visibility === 'public' && Boolean(href),
    }
  })
}

function buildDetailMetadata(state: DetailState, slug: string, locale: UiLocale) {
  if (state.status === 'ready') {
    const projectName =
      state.project.name || state.project.slug || (locale === 'zh-CN' ? '未命名项目' : 'Untitled Project')
    const projectSummary =
      state.project.summary ||
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

  if (state.status === 'degraded') {
    const projectName =
      state.project.name || state.project.slug || (locale === 'zh-CN' ? '未命名项目' : 'Untitled Project')
    return {
      title:
        locale === 'zh-CN'
          ? `${projectName} | 项目详情（降级） | lambertlab`
          : `${projectName} | Project Detail (Degraded) | lambertlab`,
      description:
        locale === 'zh-CN'
          ? '项目详情已降级展示：部分字段暂缺，页面仍保持可读。'
          : 'Project detail is shown in degraded mode because some contract fields are currently missing.',
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

function collectDegradedFields(project: ProjectDetailRecord): DegradedFieldKey[] {
  const missingFields: DegradedFieldKey[] = []

  if (!project.summary) missingFields.push('summary')
  if (!project.overview) missingFields.push('overview')
  if (!project.stage) missingFields.push('stage')
  if (!project.project_type) missingFields.push('project_type')
  if (!project.source_type) missingFields.push('source_type')

  return missingFields
}

function localizeDegradedField(field: DegradedFieldKey, locale: UiLocale): string {
  if (locale === 'en') {
    if (field === 'summary') return 'summary'
    if (field === 'overview') return 'overview'
    if (field === 'stage') return 'stage'
    if (field === 'project_type') return 'project type'
    return 'source type'
  }

  if (field === 'summary') return '摘要'
  if (field === 'overview') return '概览'
  if (field === 'stage') return '阶段'
  if (field === 'project_type') return '项目类型'
  return '来源类型'
}

function buildProjectDetailState(project: ProjectDetailRecord): DetailState {
  const missingFields = collectDegradedFields(project)
  if (missingFields.length > 0) {
    return { status: 'degraded', project, missingFields }
  }

  return { status: 'ready', project }
}

function buildProjectDetailErrorState(error: unknown, locale: UiLocale): DetailState {
  const fallbackMessage = locale === 'zh-CN' ? '当前无法加载项目详情。' : 'Unable to load the project detail right now.'
  const message =
    error instanceof ProjectApiError && error.message.trim()
      ? localizeProjectErrorMessage(error.message, locale)
      : fallbackMessage

  if (error instanceof ProjectApiError && error.status === 404) {
    return { status: 'not-found', message: locale === 'zh-CN' ? '未找到该项目。' : 'Project not found.' }
  }

  return { status: 'error', message }
}

function getInitialProjectDetailState(slug: string, locale: UiLocale): DetailState {
  const snapshot = readProjectDetailSnapshot(slug)

  if (snapshot.status === 'ready' && snapshot.data) {
    return buildProjectDetailState(snapshot.data)
  }

  if (snapshot.status === 'error') {
    return buildProjectDetailErrorState(snapshot.error, locale)
  }

  return { status: 'loading' }
}
export function ProjectDetailPage({ slug }: ProjectDetailPageProps) {
  const { locale } = useUiLocale()
  const [state, setState] = React.useState<DetailState>(() => getInitialProjectDetailState(slug, locale))
  const metadata = buildDetailMetadata(state, slug, locale)

  useDocumentMetadata(metadata.title, metadata.description)

  const loadProject = React.useCallback((options: { force?: boolean } = {}) => {
    let cancelled = false
    const forceReload = options.force === true
    const snapshot = readProjectDetailSnapshot(slug)

    if (forceReload || snapshot.status === 'idle' || snapshot.status === 'pending') {
      setState({ status: 'loading' })
    } else if (snapshot.status === 'ready' && snapshot.data) {
      setState(buildProjectDetailState(snapshot.data))
    } else if (snapshot.status === 'error') {
      setState(buildProjectDetailErrorState(snapshot.error, locale))
    }

    loadProjectDetailSnapshot(slug, { force: forceReload })
      .then((project) => {
        if (cancelled) {
          return
        }

        setState(buildProjectDetailState(project))
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }

        setState(buildProjectDetailErrorState(error, locale))
      })

    return () => {
      cancelled = true
    }
  }, [locale, slug])

  React.useEffect(() => {
    const cleanup = loadProject()
    return cleanup
  }, [loadProject])

  return (
    <main className="project-detail-shell" id="main-content">
      <div className="project-detail-container">

        <div className="project-detail-toolbar">
          <Link className="project-detail-button" preload="intent" to="/projects">
            {locale === 'zh-CN' ? '\u8fd4\u56de\u9879\u76ee\u5217\u8868' : 'Back to Projects'}
          </Link>
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
              <Link className="project-detail-button" to="/">
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
              <button className="project-detail-button primary" onClick={() => {
                loadProject({ force: true })
              }} type="button">
                {locale === 'zh-CN' ? '重试' : 'Retry'}
              </button>
              <Link className="project-detail-button" to="/projects">
                {locale === 'zh-CN' ? '返回项目目录' : 'Back to Projects'}
              </Link>
            </div>
          </section>
        ) : null}

        {state.status === 'degraded' ? (
          <section className="project-detail-panel project-detail-degraded" data-detail-state="degraded">
            <p className="project-detail-kicker">{locale === 'zh-CN' ? '降级展示' : 'Degraded fallback'}</p>
            <h2>
              {locale === 'zh-CN'
                ? '详情已降级展示，部分字段暂缺'
                : 'Detail is available in degraded mode while some fields are missing'}
            </h2>
            <p>
              {locale === 'zh-CN'
                ? '页面仍可浏览；我们将缺失字段标记如下，并保留重试能力。'
                : 'The page remains readable. Missing fields are listed below and retry is available.'}
            </p>
            <ul className="project-detail-degraded-list">
              {state.missingFields.map((field) => (
                <li key={field}>{localizeDegradedField(field, locale)}</li>
              ))}
            </ul>
            <div className="project-detail-actions">
              <button className="project-detail-button primary" onClick={() => {
                loadProject({ force: true })
              }} type="button">
                {locale === 'zh-CN' ? '重试' : 'Retry'}
              </button>
              <Link className="project-detail-button" to="/projects">
                {locale === 'zh-CN' ? '返回项目目录' : 'Back to Projects'}
              </Link>
            </div>
          </section>
        ) : null}

        {state.status === 'ready' || state.status === 'degraded' ? (
          <ProjectDetailContent locale={locale} project={state.project} />
        ) : null}
      </div>
    </main>
  )
}

function ProjectDetailContent({
  locale,
  project,
}: {
  locale: UiLocale
  project: ProjectDetailRecord
}) {
  const metaItems = buildMetaItems(project, locale)
  const repositoryItems = buildRepositoryItems(project)

  return (
    <div className="project-detail-layout">
      <section className="project-detail-panel project-detail-hero">
        <div className="project-detail-section-head">
          <h2>{locale === 'zh-CN' ? '\u9879\u76ee\u8be6\u60c5' : 'Project Detail'}</h2>
        </div>

        <div className="project-detail-hero-top">
          <div className="project-detail-hero-copy">
            <p className="project-detail-summary">
              {project.summary || (locale === 'zh-CN' ? '\u6682\u672a\u63d0\u4f9b\u6458\u8981\u3002' : 'No summary provided.')}
            </p>
          </div>

          <div className="project-detail-hero-title">
            <h1>{project.name || project.slug || (locale === 'zh-CN' ? '\u672a\u547d\u540d\u9879\u76ee' : 'Untitled Project')}</h1>
          </div>
        </div>

        {project.status_note ? <p className="project-detail-status-note">{project.status_note}</p> : null}

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
          <h2>{locale === 'zh-CN' ? '\u4ed3\u5e93' : 'Repositories'}</h2>
        </div>
        {repositoryItems.length > 0 ? (
          <ul className="project-detail-repository-grid">
            {repositoryItems.map((repository) => (
              <li key={repository.key} className="project-detail-repository-grid__item">
                <article className="project-detail-repository-card" data-visibility={repository.visibility || 'unknown'}>
                  <div className="project-detail-repository-card__main">
                    <div className="project-detail-repository-card__header">
                      <div className="project-detail-repository-card__heading">
                        <p className="project-detail-repository-card__name">{repository.name}</p>
                        {repository.fullName ? <p className="project-detail-repository-card__full-name">{repository.fullName}</p> : null}
                      </div>
                      <span className="project-detail-repository-card__role">
                        {repository.isPrimary
                          ? locale === 'zh-CN'
                            ? '\u4e3b\u4ed3\u5e93'
                            : 'Primary'
                          : locale === 'zh-CN'
                            ? '\u5173\u8054\u4ed3\u5e93'
                            : 'Linked'}
                      </span>
                    </div>

                    <div className="project-detail-chip-row project-detail-repository-card__chips">
                      <span className="project-detail-chip">
                        {translateVisibility(repository.visibility || 'public', locale)}
                      </span>
                    </div>
                  </div>

                  <div className="project-detail-repository-card__actions">
                    {repository.canOpen ? (
                      <a className="project-detail-button" href={repository.href || undefined} target="_blank" rel="noreferrer">
                        {locale === 'zh-CN' ? '\u6253\u5f00 Repo' : 'Open Repo'}
                      </a>
                    ) : null}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p className="project-detail-prose">
            {locale === 'zh-CN' ? '\u5f53\u524d\u672a\u7ed1\u5b9a\u4ed3\u5e93\uff0c\u9879\u76ee\u4ecd\u53ef\u6b63\u5e38\u5c55\u793a\u3002' : 'No repositories are linked yet, and the project remains readable.'}
          </p>
        )}
      </section>

      <section className="project-detail-panel">
        <div className="project-detail-section-head">
          <h2>{locale === 'zh-CN' ? '\u6280\u672f\u6808' : 'Technology stack'}</h2>
        </div>
        <div className="project-detail-chip-row">
          {project.stack.length > 0 ? (
            project.stack.map((item) => (
              <span className="project-detail-chip" key={`stack-${item}`}>
                {item}
              </span>
            ))
          ) : (
            <span className="project-detail-chip muted">{locale === 'zh-CN' ? '\u6280\u672f\u6808\u5f85\u8865\u5145' : 'Stack pending'}</span>
          )}
        </div>
      </section>
    </div>
  )
}

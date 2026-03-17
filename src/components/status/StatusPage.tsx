import * as React from 'react'
import {
  StatusPublicApiError,
  type ContentFreshnessLevel,
  type KnownIssueLevel,
  type KnownIssueStatus,
  type PublicStatusTone,
  type PublicSurfaceHealth,
  type StatusContentFreshnessArea,
  type StatusKeySurface,
  type StatusKnownIssue,
  type StatusOverallContext,
  type StatusPublicPagePayload,
  fetchStatusPublicPage,
} from '~/lib/statusPublicApi'
import { useDocumentMetadata, useUiLocale, type UiLocale } from '~/lib/uiLocale'

type StatusPageState =
  | { status: 'loading' }
  | { status: 'ready'; page: StatusPublicPagePayload }
  | { status: 'error'; rawMessage: string }

const DEFAULT_OVERALL_CONTEXT: StatusOverallContext = {
  label: 'Public trust summary',
  scope: 'public-trust',
  note:
    'The header status light reflects system health only. This page is broader: it also considers public surface availability, content freshness, and visitor-facing issues.',
}

function localizeStatusErrorMessage(message: string, locale: UiLocale): string {
  const normalized = message.trim()
  if (!normalized) {
    return locale === 'zh-CN' ? '公开摘要暂不可用。' : 'The public summary is temporarily unavailable.'
  }

  if (locale === 'en') {
    return normalized
  }

  if (normalized === 'The public summary is temporarily unavailable.') return '公开摘要暂不可用。'
  if (normalized === 'Status summary request timed out.') return '状态摘要请求超时。'
  if (normalized === 'Unknown status summary request error.') return '状态摘要请求发生未知错误。'
  if (normalized === 'Status summary payload is invalid.') return '状态摘要响应不符合协议。'
  return normalized
}

function formatDateTime(value: string | null, locale: UiLocale): string {
  if (!value) {
    return locale === 'zh-CN' ? '更新时间未知' : 'Update time unavailable'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return locale === 'zh-CN' ? '更新时间未知' : 'Update time unavailable'
  }

  return parsed.toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: locale === 'zh-CN' ? '2-digit' : 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: locale === 'zh-CN' ? undefined : 'short',
    hour12: false,
  })
}

function getToneLabel(tone: PublicStatusTone, locale: UiLocale): string {
  if (tone === 'red') {
    return locale === 'zh-CN' ? '需关注' : 'Needs attention'
  }
  if (tone === 'yellow') {
    return locale === 'zh-CN' ? '受限' : 'Limited'
  }
  return locale === 'zh-CN' ? '健康' : 'Healthy'
}

function getSurfaceHealthLabel(health: PublicSurfaceHealth, locale: UiLocale): string {
  if (health === 'degraded') {
    return locale === 'zh-CN' ? '降级' : 'Degraded'
  }
  if (health === 'down') {
    return locale === 'zh-CN' ? '不可用' : 'Down'
  }
  if (health === 'unknown') {
    return locale === 'zh-CN' ? '未知' : 'Unknown'
  }
  return locale === 'zh-CN' ? '可用' : 'Up'
}

function getFreshnessLabel(freshness: ContentFreshnessLevel, locale: UiLocale): string {
  if (freshness === 'aging') {
    return locale === 'zh-CN' ? '趋旧' : 'Aging'
  }
  if (freshness === 'stale') {
    return locale === 'zh-CN' ? '过旧' : 'Stale'
  }
  if (freshness === 'unknown') {
    return locale === 'zh-CN' ? '未知' : 'Unknown'
  }
  return locale === 'zh-CN' ? '新鲜' : 'Fresh'
}

function getIssueLevelLabel(level: KnownIssueLevel, locale: UiLocale): string {
  return level === 'warn'
    ? locale === 'zh-CN'
      ? '已知限制'
      : 'Known limitation'
    : locale === 'zh-CN'
      ? '说明'
      : 'Note'
}

function getIssueStatusLabel(status: KnownIssueStatus, locale: UiLocale): string {
  if (status === 'active') {
    return locale === 'zh-CN' ? '处理中' : 'Active'
  }
  if (status === 'resolved') {
    return locale === 'zh-CN' ? '已恢复' : 'Resolved'
  }
  return locale === 'zh-CN' ? '观察中' : 'Monitoring'
}

function getIssueCountLabel(issueCount: number, locale: UiLocale): string {
  if (issueCount <= 0) {
    return locale === 'zh-CN' ? '暂无公开问题' : 'No public issues'
  }
  if (issueCount === 1) {
    return locale === 'zh-CN' ? '1 个公开问题' : '1 public issue'
  }
  return locale === 'zh-CN' ? `${issueCount} 个公开问题` : `${issueCount} public issues`
}

function getIssueSectionSummary(issues: StatusKnownIssue[], locale: UiLocale): string {
  if (issues.length === 0) {
    return locale === 'zh-CN'
      ? '当前没有列出任何面向访客的限制。'
      : 'No visitor-facing limitations are listed right now.'
  }

  if (issues.length === 1) {
    return locale === 'zh-CN'
      ? '当前列出 1 个面向访客的问题，包含影响范围、状态与更新时间。'
      : '1 visitor-facing issue is currently listed with structured impact, status, and update detail.'
  }

  return locale === 'zh-CN'
    ? `当前列出 ${issues.length} 个面向访客的问题，包含影响范围、状态与更新时间。`
    : `${issues.length} visitor-facing issues are currently listed with structured impact, status, and update detail.`
}

function formatSurfaceLabel(surface: string, locale: UiLocale): string {
  const normalized = surface.trim().toLowerCase()

  if (normalized === 'home') {
    return locale === 'zh-CN' ? '首页' : 'Home'
  }
  if (normalized === 'projects') {
    return locale === 'zh-CN' ? '项目目录' : 'Projects'
  }
  if (normalized === 'journal') {
    return locale === 'zh-CN' ? '日志' : 'Journal'
  }
  if (normalized === 'status') {
    return locale === 'zh-CN' ? '状态页' : 'Status page'
  }

  return surface
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')
}

function localizeKnownLabel(label: string, locale: UiLocale): string {
  const normalized = label.trim().toLowerCase()
  if (!normalized) {
    return label
  }

  if (normalized === 'public trust summary') {
    return locale === 'zh-CN' ? '公开信任摘要' : 'Public trust summary'
  }
  if (normalized === 'home') {
    return locale === 'zh-CN' ? '首页' : 'Home'
  }
  if (normalized === 'projects') {
    return locale === 'zh-CN' ? '项目目录' : 'Projects'
  }
  if (normalized === 'journal') {
    return locale === 'zh-CN' ? '日志' : 'Journal'
  }
  if (normalized === 'status page') {
    return locale === 'zh-CN' ? '状态页' : 'Status page'
  }

  return label
}

function buildStatusMetadata(state: StatusPageState, locale: UiLocale) {
  if (state.status === 'ready') {
    return {
      title: locale === 'zh-CN' ? '状态 | lambertlab' : 'Status | lambertlab',
      description:
        state.page.overall_status.summary ||
        (locale === 'zh-CN'
          ? '解释系统健康边界、公开可用性、内容新鲜度与访客可见问题的状态页。'
          : 'Public trust page covering system health boundaries, public availability, content freshness, and visitor-facing issues.'),
    }
  }

  if (state.status === 'error') {
    return {
      title: locale === 'zh-CN' ? '状态摘要暂不可用 | lambertlab' : 'Status Summary Unavailable | lambertlab',
      description:
        locale === 'zh-CN'
          ? '当前无法加载状态摘要，可稍后重试。'
          : 'The status summary is unavailable right now. Please retry later.',
    }
  }

  return {
    title: locale === 'zh-CN' ? '状态 | lambertlab' : 'Status | lambertlab',
    description:
      locale === 'zh-CN'
        ? '解释系统健康边界、公开可用性、内容新鲜度与访客可见问题的状态页。'
        : 'Public trust page for lambertlab explaining system health boundaries, public surface availability, content freshness, and visitor-facing issues.',
  }
}

function StatusToken({
  tone,
  children,
}: {
  tone: PublicStatusTone | PublicSurfaceHealth | ContentFreshnessLevel | KnownIssueLevel | KnownIssueStatus
  children: React.ReactNode
}) {
  return (
    <span className="status-token" data-tone={tone}>
      {children}
    </span>
  )
}

function PublicSurfaceCard({ locale, surface }: { locale: UiLocale; surface: StatusKeySurface }) {
  return (
    <article className="status-detail-card">
      <div className="status-detail-head">
        <div>
          <p className="status-detail-kicker">{locale === 'zh-CN' ? '关键表面' : 'Key surface'}</p>
          <h3>
            <a href={surface.path}>{localizeKnownLabel(surface.label, locale)}</a>
          </h3>
        </div>
        <StatusToken tone={surface.health}>{getSurfaceHealthLabel(surface.health, locale)}</StatusToken>
      </div>
      <p className="status-detail-note">{surface.note}</p>
      <p className="status-detail-path">{surface.path}</p>
    </article>
  )
}

function FreshnessCard({ area, locale }: { area: StatusContentFreshnessArea; locale: UiLocale }) {
  return (
    <article className="status-detail-card">
      <div className="status-detail-head">
        <div>
          <p className="status-detail-kicker">{locale === 'zh-CN' ? '内容区域' : 'Content area'}</p>
          <h3>{localizeKnownLabel(area.label, locale)}</h3>
        </div>
        <StatusToken tone={area.freshness}>{getFreshnessLabel(area.freshness, locale)}</StatusToken>
      </div>
      <p className="status-detail-note">{area.note}</p>
      <p className="status-detail-meta">
        {locale === 'zh-CN' ? '更新于 ' : 'Updated '}
        {formatDateTime(area.updated_at, locale)}
      </p>
    </article>
  )
}

function KnownIssueCard({ issue, locale }: { issue: StatusKnownIssue; locale: UiLocale }) {
  return (
    <article className="status-detail-card status-issue-card">
      <div className="status-detail-head">
        <div>
          <p className="status-detail-kicker">{getIssueLevelLabel(issue.level, locale)}</p>
          <h3>{issue.title}</h3>
        </div>
        <div className="status-token-stack">
          <StatusToken tone={issue.level}>{getIssueLevelLabel(issue.level, locale)}</StatusToken>
          <StatusToken tone={issue.status}>{getIssueStatusLabel(issue.status, locale)}</StatusToken>
        </div>
      </div>
      <p className="status-issue-summary">{issue.summary}</p>
      <div className="status-chip-row" aria-label={locale === 'zh-CN' ? '影响页面' : 'Affected surfaces'}>
        {issue.surfaces.length > 0 ? (
          issue.surfaces.map((surface) => (
            <span className="status-chip" key={`${issue.key}-${surface}`}>
              {formatSurfaceLabel(surface, locale)}
            </span>
          ))
        ) : (
          <span className="status-chip status-chip-muted">
            {locale === 'zh-CN' ? '未列出影响范围' : 'Impact scope not listed'}
          </span>
        )}
      </div>
      <p className="status-detail-note">{issue.detail}</p>
      <p className="status-detail-meta">
        {locale === 'zh-CN' ? '更新于 ' : 'Updated '}
        {formatDateTime(issue.updated_at, locale)}
      </p>
    </article>
  )
}

export function StatusPage() {
  const { locale } = useUiLocale()
  const [state, setState] = React.useState<StatusPageState>({ status: 'loading' })
  const activeRequestRef = React.useRef<AbortController | null>(null)
  const metadata = buildStatusMetadata(state, locale)

  useDocumentMetadata(metadata.title, metadata.description)

  const loadPage = React.useCallback(() => {
    activeRequestRef.current?.abort()

    const controller = new AbortController()
    activeRequestRef.current = controller

    setState((currentState) => (currentState.status === 'loading' ? currentState : { status: 'loading' }))

    fetchStatusPublicPage(controller.signal)
      .then((page) => {
        if (controller.signal.aborted) {
          return
        }

        setState({ status: 'ready', page })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        const rawMessage =
          error instanceof StatusPublicApiError && error.message.trim()
            ? error.message
            : 'The public summary is temporarily unavailable.'

        setState({ status: 'error', rawMessage })
      })
  }, [])

  React.useEffect(() => {
    loadPage()

    return () => {
      activeRequestRef.current?.abort()
    }
  }, [loadPage])

  const overallContext = state.status === 'ready' ? state.page.overall_status.context : DEFAULT_OVERALL_CONTEXT
  const overallContextLabel = localizeKnownLabel(overallContext.label, locale)

  return (
    <main className="status-page-shell" id="main-content">
      <section className="status-page-hero">
        <div className="status-page-copy">
          <p className="status-page-eyebrow">{locale === 'zh-CN' ? '公开信任页' : 'Public trust page'}</p>
          <h1>{locale === 'zh-CN' ? '状态' : 'Status'}</h1>
          <p className="status-page-intro">
            {locale === 'zh-CN'
              ? '这个页面以访客友好的方式说明站点公开可用性与内容活动快照：什么是健康的，什么是受限的，以及当前关注点在哪里。'
              : 'This page shares a visitor-friendly snapshot of public availability and content activity across the site. It summarizes what is healthy, what is limited, and where current attention is focused.'}
          </p>
          <div className="status-semantic-grid" aria-label={locale === 'zh-CN' ? '状态语义说明' : 'Status semantics'}>
            <article className="status-meaning-card">
              <p className="status-detail-kicker">{locale === 'zh-CN' ? '头部状态灯' : 'Header status light'}</p>
              <h2>{locale === 'zh-CN' ? '仅代表系统健康' : 'System health only'}</h2>
              <p>
                {locale === 'zh-CN'
                  ? '它只跟踪核心服务是否正常响应。'
                  : 'It tracks whether core services are responding normally.'}
              </p>
            </article>
            <article className="status-meaning-card status-meaning-card-accent">
              <p className="status-detail-kicker">{overallContextLabel}</p>
              <h2>{locale === 'zh-CN' ? '公开信任摘要' : 'Public trust summary'}</h2>
              <p>{overallContext.note}</p>
            </article>
          </div>
        </div>

        {state.status === 'ready' ? (
          <div className="status-hero-card" data-tone={state.page.overall_status.status}>
            <StatusToken tone={state.page.overall_status.status}>
              {getToneLabel(state.page.overall_status.status, locale)}
            </StatusToken>
            <h2>{state.page.overall_status.summary}</h2>
            <p>
              {locale === 'zh-CN' ? '最近一次公开更新时间：' : 'Latest public update: '}
              {formatDateTime(state.page.overall_status.updated_at, locale)}
            </p>
          </div>
        ) : (
          <div className="status-hero-card" data-tone="green">
            <StatusToken tone="green">{locale === 'zh-CN' ? '公开摘要' : 'Public summary'}</StatusToken>
            <h2>{locale === 'zh-CN' ? '状态快照加载中。' : 'Status snapshot is loading.'}</h2>
            <p>{locale === 'zh-CN' ? '页面正在准备最新的公开摘要。' : 'The page is preparing the latest public summary.'}</p>
          </div>
        )}
      </section>

      {state.status === 'loading' ? (
        <section className="status-state-panel" aria-live="polite">
          <p className="status-detail-kicker">{locale === 'zh-CN' ? '加载中' : 'Loading'}</p>
          <h2>{locale === 'zh-CN' ? '正在准备公开摘要' : 'Preparing the public summary'}</h2>
          <p>
            {locale === 'zh-CN'
              ? '正在获取总体状态、公开表面可用性、内容新鲜度与访客可见问题。'
              : 'Fetching overall status, public surface availability, content freshness, and visitor-facing issues.'}
          </p>
        </section>
      ) : null}

      {state.status === 'error' ? (
        <section className="status-state-panel status-state-panel-error" aria-live="polite">
          <p className="status-detail-kicker">{locale === 'zh-CN' ? '摘要暂不可用' : 'Summary unavailable'}</p>
          <h2>
            {locale === 'zh-CN'
              ? '当前无法加载公开状态摘要。'
              : 'We could not load the current public status summary.'}
          </h2>
          <p>{localizeStatusErrorMessage(state.rawMessage, locale)}</p>
          <p>{locale === 'zh-CN' ? '请稍后重试，以获取下一次刷新后的快照。' : 'Please retry shortly for the next refreshed snapshot.'}</p>
          <div className="status-state-actions">
            <button className="status-button" onClick={loadPage} type="button">
              {locale === 'zh-CN' ? '重试' : 'Retry'}
            </button>
          </div>
        </section>
      ) : null}

      {state.status === 'ready' ? (
        <div className="status-sections">
          <section className="status-section">
            <div className="status-section-head">
              <div>
                <p className="status-detail-kicker">{locale === 'zh-CN' ? '模块 1' : 'Module 1'}</p>
                <h2>{locale === 'zh-CN' ? '总体状态' : 'Overall Status'}</h2>
              </div>
              <StatusToken tone={state.page.overall_status.status}>
                {getToneLabel(state.page.overall_status.status, locale)}
              </StatusToken>
            </div>
            <div className="status-summary-panel">
              <p className="status-summary-text">{state.page.overall_status.summary}</p>
              <p className="status-summary-meta">
                {locale === 'zh-CN' ? '更新于 ' : 'Updated '}
                {formatDateTime(state.page.overall_status.updated_at, locale)}
              </p>
              <p className="status-summary-meta">{state.page.overall_status.context.note}</p>
            </div>
          </section>

          <section className="status-section">
            <div className="status-section-head">
              <div>
                <p className="status-detail-kicker">{locale === 'zh-CN' ? '模块 2' : 'Module 2'}</p>
                <h2>{locale === 'zh-CN' ? '公开表面可用性' : 'Public Surface Availability'}</h2>
              </div>
              <StatusToken tone={state.page.public_surface.summary.status}>
                {getToneLabel(state.page.public_surface.summary.status, locale)}
              </StatusToken>
            </div>
            <div className="status-summary-panel">
              <p className="status-summary-text">{state.page.public_surface.summary.label}</p>
              <p className="status-summary-meta">
                {locale === 'zh-CN'
                  ? '聚合查看首页、项目目录与日志。'
                  : 'Aggregated view of Home, Projects, and Journal.'}
              </p>
            </div>
            <div className="status-card-grid">
              {state.page.public_surface.key_surfaces.length > 0 ? (
                state.page.public_surface.key_surfaces.map((surface) => (
                  <PublicSurfaceCard key={`${surface.key}-${surface.path}`} locale={locale} surface={surface} />
                ))
              ) : (
                <article className="status-detail-card status-detail-card-empty">
                  <p className="status-detail-kicker">{locale === 'zh-CN' ? '关键表面' : 'Key surfaces'}</p>
                  <h3>{locale === 'zh-CN' ? '尚未提供表面详情。' : 'Surface detail is not available yet.'}</h3>
                  <p className="status-detail-note">
                    {locale === 'zh-CN'
                      ? '当前公开摘要没有返回关键表面详情。'
                      : 'The current public summary did not return key surface detail.'}
                  </p>
                </article>
              )}
            </div>
          </section>

          <section className="status-section">
            <div className="status-section-head">
              <div>
                <p className="status-detail-kicker">{locale === 'zh-CN' ? '模块 3' : 'Module 3'}</p>
                <h2>{locale === 'zh-CN' ? '内容新鲜度' : 'Content Freshness'}</h2>
              </div>
              <StatusToken tone={state.page.content_freshness.summary.status}>
                {getToneLabel(state.page.content_freshness.summary.status, locale)}
              </StatusToken>
            </div>
            <div className="status-summary-panel">
              <p className="status-summary-text">{state.page.content_freshness.summary.label}</p>
              <p className="status-summary-meta">
                {locale === 'zh-CN' ? '当前重点：' : 'Active focus: '}
                <strong>
                  {state.page.content_freshness.active_focus ||
                    (locale === 'zh-CN' ? '摘要中未列出当前重点。' : 'Current focus is not listed in this summary.')}
                </strong>
              </p>
            </div>
            <div className="status-card-grid">
              {state.page.content_freshness.areas.length > 0 ? (
                state.page.content_freshness.areas.map((area) => (
                  <FreshnessCard key={area.key} area={area} locale={locale} />
                ))
              ) : (
                <article className="status-detail-card status-detail-card-empty">
                  <p className="status-detail-kicker">{locale === 'zh-CN' ? '新鲜度详情' : 'Freshness detail'}</p>
                  <h3>{locale === 'zh-CN' ? '尚未提供内容新鲜度详情。' : 'Content freshness detail is not available yet.'}</h3>
                  <p className="status-detail-note">
                    {locale === 'zh-CN'
                      ? '当前公开摘要没有返回内容新鲜度区域。'
                      : 'The current public summary did not return content freshness areas.'}
                  </p>
                </article>
              )}
            </div>
          </section>

          <section className="status-section">
            <div className="status-section-head">
              <div>
                <p className="status-detail-kicker">{locale === 'zh-CN' ? '模块 4' : 'Module 4'}</p>
                <h2>{locale === 'zh-CN' ? '已知问题与备注' : 'Known Issues & Notes'}</h2>
              </div>
              <StatusToken tone={state.page.known_issues.length > 0 ? 'warn' : 'info'}>
                {getIssueCountLabel(state.page.known_issues.length, locale)}
              </StatusToken>
            </div>
            <div className="status-summary-panel">
              <p className="status-summary-text">{getIssueSectionSummary(state.page.known_issues, locale)}</p>
              <p className="status-summary-meta">
                {locale === 'zh-CN'
                  ? '这里只列出面向访客的限制，不展示内部诊断和运维细节。'
                  : 'These cards list visitor-facing limitations only. Internal diagnostics and operator detail stay off this page.'}
              </p>
            </div>
            <div
              className={`status-card-grid status-card-grid-issues${state.page.known_issues.length === 1 ? ' status-card-grid-single' : ''}`}
            >
              {state.page.known_issues.length > 0 ? (
                state.page.known_issues.map((issue) => <KnownIssueCard key={issue.key} issue={issue} locale={locale} />)
              ) : (
                <article className="status-detail-card status-detail-card-empty">
                  <p className="status-detail-kicker">{locale === 'zh-CN' ? '当前摘要' : 'Current summary'}</p>
                  <h3>{locale === 'zh-CN' ? '当前没有列出公开问题。' : 'No public issues are listed right now.'}</h3>
                  <p className="status-detail-note">
                    {locale === 'zh-CN'
                      ? '当出现面向访客的限制时，会在这里列出影响范围、状态、更新时间和通俗说明。'
                      : 'When visitor-facing limitations appear, they will be listed here with impact scope, status, update time, and a plain-language explanation.'}
                  </p>
                </article>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}


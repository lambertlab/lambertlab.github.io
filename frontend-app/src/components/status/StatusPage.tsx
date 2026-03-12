import * as React from 'react'
import {
  StatusPublicApiError,
  type ContentFreshnessLevel,
  type KnownIssueLevel,
  type PublicStatusTone,
  type PublicSurfaceHealth,
  type StatusContentFreshnessArea,
  type StatusKeySurface,
  type StatusKnownIssue,
  type StatusPublicPagePayload,
  fetchStatusPublicPage,
} from '~/lib/statusPublicApi'

type StatusPageState =
  | { status: 'loading' }
  | { status: 'ready'; page: StatusPublicPagePayload }
  | { status: 'error'; message: string }

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'Update time unavailable'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'Update time unavailable'
  }

  return parsed.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function getToneLabel(tone: PublicStatusTone): string {
  if (tone === 'red') {
    return 'Needs attention'
  }
  if (tone === 'yellow') {
    return 'Limited'
  }
  return 'Healthy'
}

function getSurfaceHealthLabel(health: PublicSurfaceHealth): string {
  if (health === 'degraded') {
    return 'Degraded'
  }
  if (health === 'down') {
    return 'Down'
  }
  if (health === 'unknown') {
    return 'Unknown'
  }
  return 'Up'
}

function getFreshnessLabel(freshness: ContentFreshnessLevel): string {
  if (freshness === 'aging') {
    return 'Aging'
  }
  if (freshness === 'stale') {
    return 'Stale'
  }
  if (freshness === 'unknown') {
    return 'Unknown'
  }
  return 'Fresh'
}

function getIssueLevelLabel(level: KnownIssueLevel): string {
  return level === 'warn' ? 'Known limitation' : 'Note'
}

function StatusToken({
  tone,
  children,
}: {
  tone: PublicStatusTone | PublicSurfaceHealth | ContentFreshnessLevel | KnownIssueLevel
  children: React.ReactNode
}) {
  return (
    <span className="status-token" data-tone={tone}>
      {children}
    </span>
  )
}

function PublicSurfaceCard({ surface }: { surface: StatusKeySurface }) {
  return (
    <article className="status-detail-card">
      <div className="status-detail-head">
        <div>
          <p className="status-detail-kicker">Key surface</p>
          <h3>
            <a href={surface.path}>{surface.label}</a>
          </h3>
        </div>
        <StatusToken tone={surface.health}>{getSurfaceHealthLabel(surface.health)}</StatusToken>
      </div>
      <p className="status-detail-note">{surface.note}</p>
      <p className="status-detail-path">{surface.path}</p>
    </article>
  )
}

function FreshnessCard({ area }: { area: StatusContentFreshnessArea }) {
  return (
    <article className="status-detail-card">
      <div className="status-detail-head">
        <div>
          <p className="status-detail-kicker">Content area</p>
          <h3>{area.label}</h3>
        </div>
        <StatusToken tone={area.freshness}>{getFreshnessLabel(area.freshness)}</StatusToken>
      </div>
      <p className="status-detail-note">{area.note}</p>
      <p className="status-detail-meta">Updated {formatDateTime(area.updated_at)}</p>
    </article>
  )
}

function KnownIssueCard({ issue }: { issue: StatusKnownIssue }) {
  return (
    <article className="status-detail-card">
      <div className="status-detail-head">
        <div>
          <p className="status-detail-kicker">{getIssueLevelLabel(issue.level)}</p>
          <h3>{issue.title}</h3>
        </div>
        <StatusToken tone={issue.level}>{getIssueLevelLabel(issue.level)}</StatusToken>
      </div>
      <p className="status-detail-note">{issue.detail}</p>
    </article>
  )
}

export function StatusPage() {
  const [state, setState] = React.useState<StatusPageState>({ status: 'loading' })

  React.useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })

    fetchStatusPublicPage(controller.signal)
      .then((page) => {
        if (controller.signal.aborted) {
          return
        }

        React.startTransition(() => {
          setState({ status: 'ready', page })
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        const message =
          error instanceof StatusPublicApiError && error.message.trim()
            ? error.message.trim()
            : 'The public summary is temporarily unavailable.'

        React.startTransition(() => {
          setState({ status: 'error', message })
        })
      })

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <main className="status-page-shell" id="main-content">
      <section className="status-page-hero">
        <div className="status-page-copy">
          <p className="status-page-eyebrow">Public trust page</p>
          <h1>Status</h1>
          <p className="status-page-intro">
            This page shares a visitor-friendly snapshot of public availability and content activity across the site.
            It summarizes what is healthy, what is limited, and where current attention is focused.
          </p>
        </div>

        {state.status === 'ready' ? (
          <div className="status-hero-card" data-tone={state.page.overall_status.status}>
            <StatusToken tone={state.page.overall_status.status}>
              {getToneLabel(state.page.overall_status.status)}
            </StatusToken>
            <h2>{state.page.overall_status.summary}</h2>
            <p>Latest public update: {formatDateTime(state.page.overall_status.updated_at)}</p>
          </div>
        ) : (
          <div className="status-hero-card" data-tone="green">
            <StatusToken tone="green">Public summary</StatusToken>
            <h2>Status snapshot is loading.</h2>
            <p>The page is preparing the latest public summary.</p>
          </div>
        )}
      </section>

      {state.status === 'loading' ? (
        <section className="status-state-panel" aria-live="polite">
          <p className="status-detail-kicker">Loading</p>
          <h2>Preparing the public summary</h2>
          <p>Fetching overall status, public surface availability, content freshness, and current notes.</p>
        </section>
      ) : null}

      {state.status === 'error' ? (
        <section className="status-state-panel status-state-panel-error" aria-live="polite">
          <p className="status-detail-kicker">Summary unavailable</p>
          <h2>We could not load the current public status summary.</h2>
          <p>{state.message}</p>
          <p>Please check back shortly for the next refreshed snapshot.</p>
        </section>
      ) : null}

      {state.status === 'ready' ? (
        <div className="status-sections">
          <section className="status-section">
            <div className="status-section-head">
              <div>
                <p className="status-detail-kicker">Module 1</p>
                <h2>Overall Status</h2>
              </div>
              <StatusToken tone={state.page.overall_status.status}>
                {getToneLabel(state.page.overall_status.status)}
              </StatusToken>
            </div>
            <div className="status-summary-panel">
              <p className="status-summary-text">{state.page.overall_status.summary}</p>
              <p className="status-summary-meta">Updated {formatDateTime(state.page.overall_status.updated_at)}</p>
            </div>
          </section>

          <section className="status-section">
            <div className="status-section-head">
              <div>
                <p className="status-detail-kicker">Module 2</p>
                <h2>Public Surface Availability</h2>
              </div>
              <StatusToken tone={state.page.public_surface.summary.status}>
                {getToneLabel(state.page.public_surface.summary.status)}
              </StatusToken>
            </div>
            <div className="status-summary-panel">
              <p className="status-summary-text">{state.page.public_surface.summary.label}</p>
              <p className="status-summary-meta">Aggregated view of Home, Projects, and Journal.</p>
            </div>
            <div className="status-card-grid">
              {state.page.public_surface.key_surfaces.length > 0 ? (
                state.page.public_surface.key_surfaces.map((surface) => (
                  <PublicSurfaceCard key={`${surface.key}-${surface.path}`} surface={surface} />
                ))
              ) : (
                <article className="status-detail-card status-detail-card-empty">
                  <p className="status-detail-kicker">Key surfaces</p>
                  <h3>Surface detail is not available yet.</h3>
                  <p className="status-detail-note">The current public summary did not return key surface detail.</p>
                </article>
              )}
            </div>
          </section>

          <section className="status-section">
            <div className="status-section-head">
              <div>
                <p className="status-detail-kicker">Module 3</p>
                <h2>Content Freshness</h2>
              </div>
              <StatusToken tone={state.page.content_freshness.summary.status}>
                {getToneLabel(state.page.content_freshness.summary.status)}
              </StatusToken>
            </div>
            <div className="status-summary-panel">
              <p className="status-summary-text">{state.page.content_freshness.summary.label}</p>
              <p className="status-summary-meta">
                Active focus:{' '}
                <strong>{state.page.content_freshness.active_focus || 'Current focus is not listed in this summary.'}</strong>
              </p>
            </div>
            <div className="status-card-grid">
              {state.page.content_freshness.areas.length > 0 ? (
                state.page.content_freshness.areas.map((area) => <FreshnessCard key={area.key} area={area} />)
              ) : (
                <article className="status-detail-card status-detail-card-empty">
                  <p className="status-detail-kicker">Freshness detail</p>
                  <h3>Content freshness detail is not available yet.</h3>
                  <p className="status-detail-note">The current public summary did not return content freshness areas.</p>
                </article>
              )}
            </div>
          </section>

          <section className="status-section">
            <div className="status-section-head">
              <div>
                <p className="status-detail-kicker">Module 4</p>
                <h2>Known Issues &amp; Notes</h2>
              </div>
              <StatusToken tone={state.page.known_issues.length > 0 ? 'warn' : 'info'}>
                {state.page.known_issues.length > 0 ? 'Listed notes' : 'No listed notes'}
              </StatusToken>
            </div>
            <div className="status-card-grid">
              {state.page.known_issues.length > 0 ? (
                state.page.known_issues.map((issue, index) => (
                  <KnownIssueCard key={`${issue.title}-${index}`} issue={issue} />
                ))
              ) : (
                <article className="status-detail-card status-detail-card-empty">
                  <p className="status-detail-kicker">Current summary</p>
                  <h3>No public issues are listed right now.</h3>
                  <p className="status-detail-note">
                    The latest public snapshot does not include any additional limitations or explanatory notes.
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

import { Link } from '@tanstack/react-router'
import * as React from 'react'
import { ProjectApiError, type ProjectDetailRecord, fetchProjectDetail } from '~/lib/projectsApi'

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

function formatDate(value: string | null): string {
  if (!value) {
    return 'Pending'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'Pending'
  }

  return parsed.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function buildMetaItems(project: ProjectDetailRecord) {
  return [
    {
      label: 'Stage',
      value: project.stage || 'Unknown',
    },
    {
      label: 'Project Type',
      value: project.project_type || 'Pending',
    },
    {
      label: 'Source Type',
      value: project.source_type || 'Pending',
    },
    {
      label: 'Featured Rank',
      value: project.featured_rank ? `#${project.featured_rank}` : 'Not featured',
    },
    {
      label: 'Canonical Path',
      value: project.canonical_path || `/projects/${project.slug}/`,
    },
    {
      label: 'Updated',
      value: formatDate(project.updated_at),
    },
  ]
}

function buildLinkItems(project: ProjectDetailRecord) {
  return [
    { label: 'Primary', href: project.links.primary },
    { label: 'Repository', href: project.links.repo },
    { label: 'Demo', href: project.links.demo },
    { label: 'Docs', href: project.links.docs },
    { label: 'Notes', href: project.links.notes },
  ].filter((item) => typeof item.href === 'string' && item.href.trim().length > 0)
}

function buildSourceItems(project: ProjectDetailRecord) {
  return [
    {
      label: 'Project Key',
      value: project.project_key || 'Pending',
    },
    {
      label: 'Slug',
      value: project.slug || 'Pending',
    },
    {
      label: 'Repository',
      value: project.source_refs.repo_full_name || 'Pending',
    },
    {
      label: 'Visibility',
      value: project.source_refs.visibility || 'Pending',
    },
  ]
}

export function ProjectDetailPage({ slug }: ProjectDetailPageProps) {
  const [state, setState] = React.useState<DetailState>({ status: 'loading' })

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

        const message =
          error instanceof ProjectApiError && error.message.trim()
            ? error.message.trim()
            : 'Unable to load the project detail right now.'

        if (error instanceof ProjectApiError && error.status === 404) {
          setState({ status: 'not-found', message: 'Project not found.' })
          return
        }

        setState({ status: 'error', message })
      })

    return () => {
      controller.abort()
    }
  }, [slug])

  React.useEffect(() => {
    const cleanup = loadProject()
    return cleanup
  }, [loadProject])

  return (
    <main className="project-detail-shell">
      <div className="project-detail-container">
        <div className="project-detail-breadcrumbs">
          <Link to="/projects">Projects</Link>
          <span>/</span>
          <span>{slug}</span>
        </div>

        {state.status === 'loading' ? (
          <section className="project-detail-panel project-detail-loading" aria-live="polite">
            <p className="project-detail-kicker">Loading detail</p>
            <h1>Preparing project detail</h1>
            <p>正在从统一 Projects 合同加载详情骨架。</p>
          </section>
        ) : null}

        {state.status === 'not-found' ? (
          <section className="project-detail-panel project-detail-message">
            <p className="project-detail-kicker">Project not found</p>
            <h1>{state.message}</h1>
            <p>The requested slug does not exist in the current Projects catalog.</p>
            <div className="project-detail-actions">
              <Link className="project-detail-button primary" to="/projects">
                Back to Projects
              </Link>
              <Link className="project-detail-button" to="/index.html">
                Back Home
              </Link>
            </div>
          </section>
        ) : null}

        {state.status === 'error' ? (
          <section className="project-detail-panel project-detail-message">
            <p className="project-detail-kicker">Detail unavailable</p>
            <h1>Unable to load this project right now</h1>
            <p>{state.message}</p>
            <div className="project-detail-actions">
              <button className="project-detail-button primary" onClick={loadProject} type="button">
                Retry
              </button>
              <Link className="project-detail-button" to="/projects">
                Back to Projects
              </Link>
            </div>
          </section>
        ) : null}

        {state.status === 'ready' ? (
          <ProjectDetailContent project={state.project} onRetry={loadProject} />
        ) : null}
      </div>
    </main>
  )
}

function ProjectDetailContent({
  project,
  onRetry,
}: {
  project: ProjectDetailRecord
  onRetry: () => void
}) {
  const metaItems = buildMetaItems(project)
  const linkItems = buildLinkItems(project)
  const sourceItems = buildSourceItems(project)

  return (
    <div className="project-detail-layout">
      <section className="project-detail-panel project-detail-hero">
        <div className="project-detail-hero-copy">
          <p className="project-detail-kicker">
            {project.featured_rank ? `Featured #${project.featured_rank}` : 'Project Detail'}
          </p>
          <h1>{project.name || project.slug || 'Untitled Project'}</h1>
          <p className="project-detail-summary">{project.summary || 'No summary provided.'}</p>
          <p className="project-detail-headline">{project.headline || 'Headline is pending from the project registry.'}</p>
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
              Retry Fetch
            </button>
          )}
        </div>
      </section>

      <section className="project-detail-panel">
        <div className="project-detail-section-head">
          <p className="project-detail-kicker">Overview</p>
          <h2>What this project is</h2>
        </div>
        <p className="project-detail-prose">{project.overview || 'Overview is pending from the backend contract.'}</p>
        {project.status_note ? <p className="project-detail-status-note">{project.status_note}</p> : null}
      </section>

      <section className="project-detail-panel">
        <div className="project-detail-section-head">
          <p className="project-detail-kicker">Core fields</p>
          <h2>Shared catalog detail</h2>
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
          <p className="project-detail-kicker">Highlights</p>
          <h2>Current takeaways</h2>
        </div>
        {project.highlights.length > 0 ? (
          <ul className="project-detail-highlights">
            {project.highlights.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="project-detail-prose">Highlights are not available yet for this project.</p>
        )}
      </section>

      <section className="project-detail-panel">
        <div className="project-detail-section-head">
          <p className="project-detail-kicker">Stack & source</p>
          <h2>Identity and provenance</h2>
        </div>
        <div className="project-detail-chip-row">
          {project.stack.length > 0 ? (
            project.stack.map((item) => (
              <span className="project-detail-chip" key={item}>
                {item}
              </span>
            ))
          ) : (
            <span className="project-detail-chip muted">Stack pending</span>
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

import * as React from 'react'
import { fetchAdminOverview, type AdminOverviewSummary } from '~/lib/api/adminProjectsApi'
import { AdminConsoleShell, useAdminConsoleAuth } from './AdminConsoleShell'
import { formatAdminTime, mapAdminError } from './adminConsoleUtils'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

function OverviewContent() {
  const { token, invalidate } = useAdminConsoleAuth()
  const [status, setStatus] = React.useState<LoadStatus>('idle')
  const [message, setMessage] = React.useState('')
  const [data, setData] = React.useState<AdminOverviewSummary | null>(null)
  const [nonce, setNonce] = React.useState(0)

  React.useEffect(() => {
    const controller = new AbortController()

    const run = async () => {
      setStatus('loading')
      setMessage('')
      try {
        const result = await fetchAdminOverview(token, controller.signal)
        if (controller.signal.aborted) return
        setData(result)
        setStatus('ready')
      } catch (error) {
        if (controller.signal.aborted) return
        const mapped = mapAdminError(error)
        if (mapped.code === 'unauthorized') {
          invalidate(mapped.message)
          return
        }
        setStatus('error')
        setMessage(mapped.message)
      }
    }

    void run()
    return () => controller.abort()
  }, [invalidate, nonce, token])

  if (status === 'loading') {
    return <div className="admin-state-card">概览加载中...</div>
  }

  if (status === 'error') {
    return (
      <div className="admin-state-card admin-state-error">
        <p>{message}</p>
        <button className="admin-primary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>
          重试
        </button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <section className="admin-overview-grid">
      <div className="admin-overview-stats">
        <article className="admin-stat-card"><p className="admin-projects-kicker">Projects Total</p><h3>{data.projects_total}</h3></article>
        <article className="admin-stat-card"><p className="admin-projects-kicker">Public</p><h3>{data.projects_public}</h3></article>
        <article className="admin-stat-card"><p className="admin-projects-kicker">Draft</p><h3>{data.projects_draft}</h3></article>
        <article className="admin-stat-card"><p className="admin-projects-kicker">Sync Success</p><h3>{data.sync_recent_success}</h3></article>
        <article className="admin-stat-card"><p className="admin-projects-kicker">Sync Failed</p><h3>{data.sync_recent_failed}</h3></article>
      </div>

      <article className="admin-overview-failures">
        <div className="admin-overview-head">
          <h2>最近失败任务</h2>
          <button className="admin-secondary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>刷新</button>
        </div>

        {data.latest_failures.length === 0 ? (
          <div className="admin-state-card">暂无失败任务。</div>
        ) : (
          <ul className="admin-failure-list">
            {data.latest_failures.map((item) => (
              <li key={`${item.job_id}-${item.failed_at || ''}`}>
                <p><strong>#{item.job_id}</strong>{item.project_name ? ` · ${item.project_name}` : ''}</p>
                <p>{item.reason || '无错误详情'}</p>
                <p className="admin-detail-meta">{formatAdminTime(item.failed_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  )
}

export function AdminOverviewConsolePage() {
  return (
    <AdminConsoleShell
      mode="overview"
      title="Control Center · 概览 | lambertlab"
      description="二期控制台概览：核心统计与近期失败。"
    >
      <OverviewContent />
    </AdminConsoleShell>
  )
}
import * as React from 'react'
import { fetchAdminStatus, type AdminStatusSummary } from '~/lib/api/adminProjectsApi'
import { AdminConsoleShell, useAdminConsoleAuth } from './AdminConsoleShell'
import { healthTone, mapAdminError } from './adminConsoleUtils'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

function StatusContent() {
  const { token, invalidate } = useAdminConsoleAuth()
  const [status, setStatus] = React.useState<LoadStatus>('idle')
  const [message, setMessage] = React.useState('')
  const [data, setData] = React.useState<AdminStatusSummary | null>(null)
  const [nonce, setNonce] = React.useState(0)

  React.useEffect(() => {
    const controller = new AbortController()

    const run = async () => {
      setStatus('loading')
      setMessage('')
      try {
        const result = await fetchAdminStatus(token, controller.signal)
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
    return <div className="admin-state-card">状态加载中...</div>
  }

  if (status === 'error') {
    return (
      <div className="admin-state-card admin-state-error">
        <p>{message}</p>
        <button className="admin-primary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>重试</button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <section className="admin-status-grid">
      <article className="admin-stat-card"><p className="admin-projects-kicker">backend_health</p><h3>{data.backend_health}</h3><span className={`admin-health-badge is-${healthTone(data.backend_health)}`}>{healthTone(data.backend_health)}</span></article>
      <article className="admin-stat-card"><p className="admin-projects-kicker">db_health</p><h3>{data.db_health}</h3><span className={`admin-health-badge is-${healthTone(data.db_health)}`}>{healthTone(data.db_health)}</span></article>
      <article className="admin-stat-card"><p className="admin-projects-kicker">github_health</p><h3>{data.github_health}</h3><span className={`admin-health-badge is-${healthTone(data.github_health)}`}>{healthTone(data.github_health)}</span></article>
      <article className="admin-stat-card"><p className="admin-projects-kicker">github_rate_remaining</p><h3>{data.github_rate_remaining === null ? '--' : data.github_rate_remaining}</h3><button className="admin-secondary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>刷新状态</button></article>
    </section>
  )
}

export function AdminStatusConsolePage() {
  return (
    <AdminConsoleShell
      mode="status"
      title="Control Center · 系统状态 | lambertlab"
      description="系统状态：后端、数据库与 GitHub 配额摘要。"
    >
      <StatusContent />
    </AdminConsoleShell>
  )
}
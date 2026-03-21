import * as React from 'react'
import { fetchAdminStatus, type AdminStatusSummary } from '~/lib/api/adminConsoleApi'
import { useUiLocale } from '~/lib/uiLocale'
import { AdminConsoleShell, useAdminConsoleAuth } from './AdminConsoleShell'
import { healthTone, mapAdminError } from './adminConsoleUtils'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

function StatusCard({
  label,
  value,
  meta,
}: {
  label: string
  value: string
  meta: string
}) {
  const tone = healthTone(value)

  return (
    <article className="admin-stat-card">
      <p className="admin-projects-kicker">{label}</p>
      <h3 data-tone={tone}>{value}</h3>
      <p className="admin-detail-meta">{meta}</p>
    </article>
  )
}

function StatusContent() {
  const { token, invalidate } = useAdminConsoleAuth()
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])
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
    return <div className="admin-state-card">{t('依赖状态加载中...', 'Loading dependency status...')}</div>
  }

  if (status === 'error') {
    return (
      <div className="admin-state-card admin-state-error">
        <p>{message}</p>
        <button className="admin-primary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>
          {t('重试', 'Retry')}
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
        <StatusCard label={t('Backend', 'Backend')} value={data.backend_health || '--'} meta={t('API 进程可达性', 'API process availability')} />
        <StatusCard label={t('Site DB', 'Site DB')} value={data.db_health || '--'} meta={t('站点 SQLite 读写可用性', 'Site SQLite availability')} />
        <StatusCard label={t('GitHub', 'GitHub')} value={data.github_health || '--'} meta={t('上游依赖健康状态', 'Upstream dependency health')} />
        <article className="admin-stat-card">
          <p className="admin-projects-kicker">{t('GitHub Core Remaining', 'GitHub Core Remaining')}</p>
          <h3>{data.github_rate_remaining ?? '--'}</h3>
          <p className="admin-detail-meta">{t('当前可用 GitHub API 配额', 'Current remaining GitHub API quota')}</p>
        </article>
      </div>

      <article className="admin-overview-failures">
        <div className="admin-overview-head">
          <h2>{t('状态说明', 'Status Notes')}</h2>
          <button className="admin-secondary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>
            {t('刷新', 'Refresh')}
          </button>
        </div>
        <ul className="admin-failure-list">
          <li>
            <p>
              <strong>{t('Backend', 'Backend')}</strong>
            </p>
            <p>{t('表示 admin API 自身当前是否可响应。', 'Indicates whether the admin API itself is responding.')}</p>
          </li>
          <li>
            <p>
              <strong>{t('Site DB', 'Site DB')}</strong>
            </p>
            <p>{t('表示控制面读取与写入站点数据库是否正常。', 'Indicates whether the control plane can read and write the site database.')}</p>
          </li>
          <li>
            <p>
              <strong>{t('GitHub', 'GitHub')}</strong>
            </p>
            <p>{t('表示同步依赖的上游 GitHub API 当前是否健康。', 'Indicates whether the upstream GitHub API used by sync is healthy.')}</p>
          </li>
        </ul>
      </article>
    </section>
  )
}

export function AdminStatusConsolePage() {
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])

  return (
    <AdminConsoleShell
      mode="status"
      title={t('Control Center · 依赖状态 | lambertlab', 'Control Center · Dependency Status | lambertlab')}
      description={t('查看后台、站点数据库与 GitHub 依赖的当前健康状态。', 'Review the current health of backend, site database, and GitHub dependencies.')}
    >
      <StatusContent />
    </AdminConsoleShell>
  )
}

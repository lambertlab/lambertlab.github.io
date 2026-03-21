import * as React from 'react'
import {
  fetchAdminOverview,
  fetchAdminStatusProbe,
  type AdminOverviewSummary,
  type AdminStatusProbeResult,
  type AdminStatusProbeTarget,
} from '~/lib/api/adminConsoleApi'
import { useUiLocale } from '~/lib/uiLocale'
import { AdminConsoleShell, useAdminConsoleAuth } from './AdminConsoleShell'
import { formatAdminTime, healthTone, mapAdminError } from './adminConsoleUtils'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'
type ProbeLoadStatus = 'idle' | 'loading' | 'ready' | 'error'

type StatusSnapshot = Pick<
  AdminStatusProbeResult,
  'backend_health' | 'db_health' | 'github_health' | 'github_rate_remaining'
>

type ProbeState = {
  status: ProbeLoadStatus
  message: string
}

const STATUS_TARGETS: AdminStatusProbeTarget[] = ['backend', 'db', 'github']

const INITIAL_STATUS_SNAPSHOT: StatusSnapshot = {
  backend_health: null,
  db_health: null,
  github_health: null,
  github_rate_remaining: null,
}

const INITIAL_PROBE_STATES: Record<AdminStatusProbeTarget, ProbeState> = {
  backend: { status: 'idle', message: '' },
  db: { status: 'idle', message: '' },
  github: { status: 'idle', message: '' },
}

function formatFailureSummary(summary: AdminOverviewSummary['latest_failures'][number]['summary']): string {
  if (!summary) {
    return ''
  }
  if (summary.project_id || summary.failed > 0) {
    return ['同步=' + summary.synced, '失败=' + summary.failed].join(' | ')
  }
  return ['抓取=' + summary.fetched, '新增=' + summary.created, '更新=' + summary.updated, '下线=' + summary.deactivated].join(' | ')
}

function formatStatusProbeErrorMessage(
  error: unknown,
  t: (zh: string, en: string) => string,
): { code: string; message: string } {
  const mapped = mapAdminError(error)
  if (mapped.code === 'request_timeout') {
    return {
      code: mapped.code,
      message: t('检测超时，请单独重试这一项。', 'Probe timed out. Retry this card.'),
    }
  }
  if (mapped.code === 'network_failed') {
    return {
      code: mapped.code,
      message: t('网络请求失败，请检查当前链路。', 'Network request failed. Check this dependency path.'),
    }
  }
  return mapped
}

function mergeStatusSnapshot(current: StatusSnapshot, next: AdminStatusProbeResult): StatusSnapshot {
  return {
    backend_health: next.backend_health ?? current.backend_health,
    db_health: next.db_health ?? current.db_health,
    github_health: next.github_health ?? current.github_health,
    github_rate_remaining:
      next.github_rate_remaining === null ? current.github_rate_remaining : next.github_rate_remaining,
  }
}

function OverviewStatusCard({
  label,
  value,
  hint,
  status,
  message,
  checkingLabel,
  actionLabel,
  onCheck,
  valueTone,
}: {
  label: string
  value: string
  hint: string
  status: ProbeLoadStatus
  message: string
  checkingLabel: string
  actionLabel: string
  onCheck: () => void
  valueTone?: 'ok' | 'warn' | 'error'
}) {
  return (
    <article className="admin-stat-card admin-status-observation-card">
      <div className="admin-status-observation-card__head">
        <div className="admin-status-observation-card__title">
          <p className="admin-projects-kicker">{label}</p>
          <span
            className="admin-status-hint"
            aria-label={hint}
            title={hint}
          >
            !
          </span>
        </div>
        <button
          className="admin-secondary-button admin-status-observation-card__action"
          type="button"
          disabled={status === 'loading'}
          aria-busy={status === 'loading'}
          onClick={onCheck}
        >
          {status === 'loading' ? checkingLabel : actionLabel}
        </button>
      </div>
      <h3 data-tone={valueTone}>{value}</h3>
      <p className="admin-detail-meta">
        {status === 'loading' ? checkingLabel : message || '\u00a0'}
      </p>
    </article>
  )
}

function OverviewStatusPanel() {
  const { token, invalidate } = useAdminConsoleAuth()
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])
  const [snapshot, setSnapshot] = React.useState<StatusSnapshot>(INITIAL_STATUS_SNAPSHOT)
  const [probeStates, setProbeStates] = React.useState<Record<AdminStatusProbeTarget, ProbeState>>(INITIAL_PROBE_STATES)
  const [allChecksRunning, setAllChecksRunning] = React.useState(false)
  const requestSeqRef = React.useRef<Record<AdminStatusProbeTarget, number>>({
    backend: 0,
    db: 0,
    github: 0,
  })

  React.useEffect(() => {
    return () => {
      requestSeqRef.current.backend += 1
      requestSeqRef.current.db += 1
      requestSeqRef.current.github += 1
    }
  }, [])

  const runProbe = React.useCallback(async (target: AdminStatusProbeTarget) => {
    requestSeqRef.current[target] += 1
    const currentSeq = requestSeqRef.current[target]

    setProbeStates((prev) => ({
      ...prev,
      [target]: {
        status: 'loading',
        message: '',
      },
    }))

    try {
      const result = await fetchAdminStatusProbe(token, target)
      if (requestSeqRef.current[target] !== currentSeq) {
        return
      }

      setSnapshot((prev) => mergeStatusSnapshot(prev, result))
      setProbeStates((prev) => ({
        ...prev,
        [target]: {
          status: 'ready',
          message: t('检测完成。', 'Check completed.'),
        },
      }))
    } catch (error) {
      if (requestSeqRef.current[target] !== currentSeq) {
        return
      }

      const mapped = formatStatusProbeErrorMessage(error, t)
      if (mapped.code === 'unauthorized') {
        invalidate(mapped.message)
        return
      }

      setProbeStates((prev) => ({
        ...prev,
        [target]: {
          status: 'error',
          message: mapped.message,
        },
      }))
    }
  }, [invalidate, t, token])

  const runAllChecks = React.useCallback(async () => {
    setAllChecksRunning(true)
    try {
      await Promise.allSettled(STATUS_TARGETS.map((target) => runProbe(target)))
    } finally {
      setAllChecksRunning(false)
    }
  }, [runProbe])

  React.useEffect(() => {
    void runAllChecks()
  }, [runAllChecks])

  const backendValue = snapshot.backend_health || '--'
  const dbValue = snapshot.db_health || '--'
  const githubValue = snapshot.github_health || '--'
  const githubRateValue =
    snapshot.github_rate_remaining === null ? '--' : String(snapshot.github_rate_remaining)

  return (
    <article className="admin-overview-failures admin-overview-status-panel">
      <div className="admin-overview-head">
        <div>
          <h2>{t('运行状态', 'Runtime Status')}</h2>
          <p className="admin-detail-meta">
            {t(
              '将关键依赖观测并入概览；可全体检测，也可单独定位某一项。',
              'Key dependency checks are embedded into the overview. Probe all or isolate a single dependency.',
            )}
          </p>
        </div>
        <button
          className="admin-secondary-button"
          type="button"
          disabled={allChecksRunning}
          aria-busy={allChecksRunning}
          onClick={() => void runAllChecks()}
        >
          {allChecksRunning ? t('检测中...', 'Checking...') : t('全体检测', 'Check All')}
        </button>
      </div>

      <div className="admin-overview-status-grid">
        <OverviewStatusCard
          label={t('Backend', 'Backend')}
          value={backendValue}
          hint={t('表示 admin API 自身当前是否可响应。', 'Indicates whether the admin API itself is responding.')}
          status={probeStates.backend.status}
          message={probeStates.backend.message}
          checkingLabel={t('检测中...', 'Checking...')}
          actionLabel={t('检测', 'Check')}
          onCheck={() => void runProbe('backend')}
          valueTone={healthTone(backendValue)}
        />
        <OverviewStatusCard
          label={t('Site DB', 'Site DB')}
          value={dbValue}
          hint={t('表示控制面读取与写入站点数据库是否正常。', 'Indicates whether the control plane can read and write the site database.')}
          status={probeStates.db.status}
          message={probeStates.db.message}
          checkingLabel={t('检测中...', 'Checking...')}
          actionLabel={t('检测', 'Check')}
          onCheck={() => void runProbe('db')}
          valueTone={healthTone(dbValue)}
        />
        <OverviewStatusCard
          label={t('GitHub', 'GitHub')}
          value={githubValue}
          hint={t('表示同步依赖的上游 GitHub API 当前是否健康。', 'Indicates whether the upstream GitHub API used by sync is healthy.')}
          status={probeStates.github.status}
          message={probeStates.github.message}
          checkingLabel={t('检测中...', 'Checking...')}
          actionLabel={t('检测', 'Check')}
          onCheck={() => void runProbe('github')}
          valueTone={healthTone(githubValue)}
        />
        <OverviewStatusCard
          label={t('GitHub Core Remaining', 'GitHub Core Remaining')}
          value={githubRateValue}
          hint={t('表示当前可用的 GitHub Core API 配额。', 'Indicates the currently remaining GitHub Core API quota.')}
          status={probeStates.github.status}
          message={probeStates.github.message}
          checkingLabel={t('检测中...', 'Checking...')}
          actionLabel={t('检测', 'Check')}
          onCheck={() => void runProbe('github')}
        />
      </div>
    </article>
  )
}

function OverviewContent() {
  const { token, invalidate } = useAdminConsoleAuth()
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])
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
    return <div className="admin-state-card">{t('概览加载中...', 'Loading overview...')}</div>
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
        <article className="admin-stat-card"><p className="admin-projects-kicker">{t('Projects Total', 'Projects Total')}</p><h3>{data.projects_total}</h3></article>
        <article className="admin-stat-card"><p className="admin-projects-kicker">{t('Public', 'Public')}</p><h3>{data.projects_public}</h3></article>
        <article className="admin-stat-card"><p className="admin-projects-kicker">{t('Draft', 'Draft')}</p><h3>{data.projects_draft}</h3></article>
        <article className="admin-stat-card"><p className="admin-projects-kicker">{t('Sync Success', 'Sync Success')}</p><h3>{data.sync_recent_success}</h3></article>
        <article className="admin-stat-card"><p className="admin-projects-kicker">{t('Sync Failed', 'Sync Failed')}</p><h3>{data.sync_recent_failed}</h3></article>
      </div>

      <OverviewStatusPanel />

      <article className="admin-overview-failures">
        <div className="admin-overview-head">
          <h2>{t('最近失败任务', 'Recent Failed Jobs')}</h2>
          <button className="admin-secondary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>
            {t('刷新', 'Refresh')}
          </button>
        </div>

        {data.latest_failures.length === 0 ? (
          <div className="admin-state-card">{t('暂无失败任务。', 'No failed jobs yet.')}</div>
        ) : (
          <ul className="admin-failure-list">
            {data.latest_failures.map((item) => (
              <li key={`${item.job_id}-${item.failed_at || ''}`}>
                <p><strong>#{item.job_id}</strong>{item.project_name ? ` · ${item.project_name}` : ''}</p>
                <p>{item.reason || t('无错误详情', 'No error details.')}</p>
                {item.summary ? <p className="admin-detail-meta">{formatFailureSummary(item.summary)}</p> : null}
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
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])

  return (
    <AdminConsoleShell
      mode="overview"
      title={t('Control Center · 概览 | lambertlab', 'Control Center · Overview | lambertlab')}
      description={t('管理概览：项目规模、运行状态与近期失败任务。', 'Admin overview: project scale, runtime checks, and recent failed jobs.')}
    >
      <OverviewContent />
    </AdminConsoleShell>
  )
}

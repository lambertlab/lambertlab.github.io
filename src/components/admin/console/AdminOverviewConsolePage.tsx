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
import { mapAdminError } from './adminConsoleUtils'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'
type ProbeLoadStatus = 'idle' | 'loading' | 'ready' | 'error'
type ObservationTone = 'neutral' | 'up' | 'timeout' | 'down'

type StatusSnapshot = Pick<
  AdminStatusProbeResult,
  'backend_health' | 'db_health' | 'github_health' | 'github_rate_remaining'
>

type ProbeState = {
  status: ProbeLoadStatus
  failureCode: string | null
}

const STATUS_TARGETS: AdminStatusProbeTarget[] = ['backend', 'db', 'github']

const INITIAL_STATUS_SNAPSHOT: StatusSnapshot = {
  backend_health: null,
  db_health: null,
  github_health: null,
  github_rate_remaining: null,
}

const INITIAL_PROBE_STATES: Record<AdminStatusProbeTarget, ProbeState> = {
  backend: { status: 'idle', failureCode: null },
  db: { status: 'idle', failureCode: null },
  github: { status: 'idle', failureCode: null },
}

function resolveObservationResult({
  health,
  probeState,
}: {
  health?: string | null
  probeState: ProbeState
}): { label: string; tone: ObservationTone } | null {
  if (probeState.status === 'error') {
    if (probeState.failureCode === 'request_timeout') {
      return { label: 'timeout', tone: 'timeout' }
    }
    return { label: 'down', tone: 'down' }
  }

  if (typeof health === 'string' && health.trim()) {
    return health === 'up' ? { label: 'up', tone: 'up' } : { label: 'down', tone: 'down' }
  }
  return null
}

function resolveQuotaObservationResult({
  rateRemaining,
  githubHealth,
  probeState,
  locale,
}: {
  rateRemaining?: number | null
  githubHealth?: string | null
  probeState: ProbeState
  locale: string
}): { label: string; tone: ObservationTone } | null {
  if (probeState.status === 'error') {
    if (probeState.failureCode === 'request_timeout') {
      return { label: 'timeout', tone: 'timeout' }
    }
    return { label: 'down', tone: 'down' }
  }

  if (typeof rateRemaining === 'number') {
    return {
      label: new Intl.NumberFormat(locale === 'zh-CN' ? 'zh-CN' : 'en-US').format(rateRemaining),
      tone: rateRemaining > 0 ? 'up' : 'down',
    }
  }

  if (typeof githubHealth === 'string' && githubHealth.trim() === 'down') {
    return { label: 'down', tone: 'down' }
  }

  return null
}

function formatCheckingLabel(status: ProbeLoadStatus, t: (zh: string, en: string) => string): string {
  return status === 'loading' ? t('检测中...', 'Checking...') : t('检测', 'Check')
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
  hint,
  hintId,
  resultLabel,
  resultTone,
  isPending,
  actionLabel,
  onCheck,
  status,
}: {
  label: string
  hint: string
  hintId: string
  resultLabel: string
  resultTone: ObservationTone
  isPending: boolean
  actionLabel: string
  onCheck: () => void
  status: ProbeLoadStatus
}) {
  return (
    <article className={`admin-stat-card admin-status-observation-card is-${resultTone}`}>
      <div className="admin-status-observation-card__head">
        <p className="admin-projects-kicker">{label}</p>
        <div className="admin-status-hint-wrap">
          <span className="admin-status-hint" aria-describedby={hintId} tabIndex={0}>
            !
          </span>
          <span className="admin-status-hint__tooltip" id={hintId} role="tooltip">
            {hint}
          </span>
        </div>
      </div>
      <div className="admin-status-observation-card__body">
        {isPending ? (
          <div className="admin-status-pending" aria-live="polite">
            <span className="admin-status-pending__dot"></span>
            <span className="admin-status-pending__dot"></span>
            <span className="admin-status-pending__dot"></span>
          </div>
        ) : (
          <span className={`admin-status-result is-${resultTone}`} aria-live="polite">
            {resultLabel}
          </span>
        )}
      </div>
      <div className="admin-status-observation-card__footer">
        <button
          className="admin-secondary-button admin-status-observation-card__action"
          type="button"
          disabled={status === 'loading'}
          aria-busy={status === 'loading'}
          onClick={onCheck}
        >
          {actionLabel}
        </button>
      </div>
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
        failureCode: null,
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
          failureCode: null,
        },
      }))
    } catch (error) {
      if (requestSeqRef.current[target] !== currentSeq) {
        return
      }

      const mapped = mapAdminError(error)
      if (mapped.code === 'unauthorized') {
        invalidate(mapped.message)
        return
      }

      setProbeStates((prev) => ({
        ...prev,
        [target]: {
          status: 'error',
          failureCode: mapped.code,
        },
      }))
    }
  }, [invalidate, token])

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

  const backendObservation = resolveObservationResult({
    health: snapshot.backend_health,
    probeState: probeStates.backend,
  })
  const dbObservation = resolveObservationResult({
    health: snapshot.db_health,
    probeState: probeStates.db,
  })
  const githubObservation = resolveObservationResult({
    health: snapshot.github_health,
    probeState: probeStates.github,
  })
  const githubQuotaObservation = resolveQuotaObservationResult({
    rateRemaining: snapshot.github_rate_remaining,
    githubHealth: snapshot.github_health,
    probeState: probeStates.github,
    locale,
  })

  return (
    <article className="admin-overview-failures admin-overview-status-panel">
      <div className="admin-overview-head">
        <h2>{t('运行状态', 'Runtime Status')}</h2>
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
          hint={t('表示核心公开与管理接口链路是否仍可生成关键读模型。', 'Indicates whether representative public and admin backend surfaces can still produce key read models.')}
          hintId="admin-status-hint-backend"
          resultLabel={backendObservation?.label ?? 'down'}
          resultTone={backendObservation?.tone ?? 'down'}
          isPending={backendObservation === null}
          status={probeStates.backend.status}
          actionLabel={formatCheckingLabel(probeStates.backend.status, t)}
          onCheck={() => void runProbe('backend')}
        />
        <OverviewStatusCard
          label={t('Site DB', 'Site DB')}
          hint={t('表示控制面读取与写入站点数据库是否正常。', 'Indicates whether the control plane can read and write the site database.')}
          hintId="admin-status-hint-db"
          resultLabel={dbObservation?.label ?? 'down'}
          resultTone={dbObservation?.tone ?? 'down'}
          isPending={dbObservation === null}
          status={probeStates.db.status}
          actionLabel={formatCheckingLabel(probeStates.db.status, t)}
          onCheck={() => void runProbe('db')}
        />
        <OverviewStatusCard
          label={t('GitHub', 'GitHub')}
          hint={t('表示后台同步链路访问 GitHub API 是否仍然可用。', 'Indicates whether the backend sync path can still reach the GitHub API.')}
          hintId="admin-status-hint-github"
          resultLabel={githubObservation?.label ?? 'down'}
          resultTone={githubObservation?.tone ?? 'down'}
          isPending={githubObservation === null}
          status={probeStates.github.status}
          actionLabel={formatCheckingLabel(probeStates.github.status, t)}
          onCheck={() => void runProbe('github')}
        />
        <OverviewStatusCard
          label={t('GitHub Quota', 'GitHub Quota')}
          hint={t('表示当前 GitHub Core API 配额是否仍有可用余量。', 'Indicates whether the current GitHub Core API quota still has remaining headroom.')}
          hintId="admin-status-hint-github-quota"
          resultLabel={githubQuotaObservation?.label ?? 'down'}
          resultTone={githubQuotaObservation?.tone ?? 'down'}
          isPending={githubQuotaObservation === null}
          status={probeStates.github.status}
          actionLabel={formatCheckingLabel(probeStates.github.status, t)}
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
      description={t('管理概览：项目规模与运行状态。', 'Admin overview: project scale and runtime status.')}
    >
      <OverviewContent />
    </AdminConsoleShell>
  )
}

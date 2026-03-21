import * as React from 'react'
import {
  fetchAdminSyncJobById,
  fetchAdminSyncJobs,
  retryAdminSyncJob,
  type AdminSyncJobDetail,
  type AdminSyncJobRecord,
  type AdminSyncResultSummary,
} from '~/lib/api/adminConsoleApi'
import { useUiLocale } from '~/lib/uiLocale'
import { useAdminConsoleAuth } from './AdminConsoleShell'
import { formatAdminTime, mapAdminError } from './adminConsoleUtils'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

const JOBS_PAGE_SIZE = 20

function isProjectModeResult(result: AdminSyncResultSummary): boolean {
  return Boolean(result.project_id) || result.failed > 0
}

function summarizeSyncResult(
  result: AdminSyncResultSummary | null,
  t: (zh: string, en: string) => string,
): string {
  if (!result) {
    return ''
  }

  if (isProjectModeResult(result)) {
    return [t('同步=' + result.synced, 'Synced=' + result.synced), t('失败=' + result.failed, 'Failed=' + result.failed)].join(' | ')
  }

  return [
    t('抓取=' + result.fetched, 'Fetched=' + result.fetched),
    t('新增=' + result.created, 'Created=' + result.created),
    t('更新=' + result.updated, 'Updated=' + result.updated),
    t('下线=' + result.deactivated, 'Deactivated=' + result.deactivated),
  ].join(' | ')
}

function describeSyncJobTarget(
  job: Pick<AdminSyncJobRecord, 'mode' | 'project_id' | 'github_username'>,
  t: (zh: string, en: string) => string,
): string {
  if (job.mode === 'project') {
    return job.project_id ? t(`project #${job.project_id}`, `project #${job.project_id}`) : t('project', 'project')
  }

  if (job.github_username) {
    return t(`github_user @${job.github_username}`, `github_user @${job.github_username}`)
  }

  return job.mode || t('unknown', 'unknown')
}

function describeSyncJobFailureReason(
  job: Pick<AdminSyncJobRecord, 'state' | 'error_message'>,
  t: (zh: string, en: string) => string,
): string {
  if (job.state !== 'failed') {
    return ''
  }
  return job.error_message || t('同步失败。', 'Sync failed.')
}

function resolveJobDisplayTime(job: Pick<AdminSyncJobRecord, 'finished_at' | 'created_at'>): string | null {
  return job.finished_at ?? job.created_at
}

export function AdminSyncJobLogsPanels() {
  const { token, invalidate } = useAdminConsoleAuth()
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])

  const [jobsStatus, setJobsStatus] = React.useState<LoadStatus>('idle')
  const [jobsMessage, setJobsMessage] = React.useState('')
  const [jobs, setJobs] = React.useState<AdminSyncJobRecord[]>([])
  const [jobsTotal, setJobsTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [jobsNonce, setJobsNonce] = React.useState(0)

  const [selectedJobId, setSelectedJobId] = React.useState('')
  const [detailStatus, setDetailStatus] = React.useState<LoadStatus>('idle')
  const [detailMessage, setDetailMessage] = React.useState('')
  const [detail, setDetail] = React.useState<AdminSyncJobDetail | null>(null)

  const [retryConfirmJobId, setRetryConfirmJobId] = React.useState('')
  const [retryState, setRetryState] = React.useState<{ status: 'idle' | 'running' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' })

  React.useEffect(() => {
    const controller = new AbortController()

    const run = async () => {
      setJobsStatus('loading')
      setJobsMessage('')

      try {
        const result = await fetchAdminSyncJobs(token, { page, page_size: JOBS_PAGE_SIZE }, controller.signal)
        if (controller.signal.aborted) return

        setJobs(result.jobs)
        setJobsTotal(result.total)
        if (result.jobs.length === 0) {
          setJobsStatus('empty')
          setSelectedJobId('')
          setDetailStatus('idle')
          setDetail(null)
          return
        }

        setJobsStatus('ready')
      } catch (error) {
        if (controller.signal.aborted) return
        const mapped = mapAdminError(error)
        if (mapped.code === 'unauthorized') {
          invalidate(mapped.message)
          return
        }
        setJobsStatus('error')
        setJobsMessage(mapped.message)
      }
    }

    void run()
    return () => controller.abort()
  }, [invalidate, jobsNonce, page, token])

  React.useEffect(() => {
    if (jobsStatus !== 'ready' || jobs.length === 0) return
    if (jobs.some((item) => item.job_id === selectedJobId)) return
    setSelectedJobId(jobs[0].job_id)
  }, [jobs, jobsStatus, selectedJobId])

  React.useEffect(() => {
    if (!selectedJobId) {
      setDetailStatus('idle')
      setDetailMessage('')
      setDetail(null)
      return
    }

    const controller = new AbortController()

    const run = async () => {
      setDetailStatus('loading')
      setDetailMessage('')

      try {
        const result = await fetchAdminSyncJobById(token, selectedJobId, controller.signal)
        if (controller.signal.aborted) return
        setDetail(result)
        setDetailStatus('ready')
      } catch (error) {
        if (controller.signal.aborted) return
        const mapped = mapAdminError(error)
        if (mapped.code === 'unauthorized') {
          invalidate(mapped.message)
          return
        }
        setDetailStatus('error')
        setDetailMessage(mapped.message)
      }
    }

    void run()
    return () => controller.abort()
  }, [invalidate, selectedJobId, token])

  const pages = Math.max(1, Math.ceil(jobsTotal / JOBS_PAGE_SIZE))

  const retryJob = React.useCallback(async (jobId: string) => {
    if (retryState.status === 'running') return

    if (retryConfirmJobId !== jobId) {
      setRetryConfirmJobId(jobId)
      setRetryState({ status: 'idle', message: t('再次点击以确认重试。', 'Click retry again to confirm.') })
      return
    }

    setRetryConfirmJobId('')
    setRetryState({ status: 'running', message: t('重试中...', 'Retrying...') })

    try {
      const result = await retryAdminSyncJob(token, jobId)
      setRetryState({ status: 'success', message: t(`已触发重试：#${result.job_id}。`, `Retry triggered: #${result.job_id}.`) })
      setSelectedJobId(result.job_id)
      setDetail(result)
      setDetailStatus('ready')
      setJobsNonce((prev) => prev + 1)
    } catch (error) {
      const mapped = mapAdminError(error)
      if (mapped.code === 'unauthorized') {
        invalidate(mapped.message)
        return
      }
      setRetryState({ status: 'error', message: mapped.message })
    }
  }, [invalidate, retryConfirmJobId, retryState.status, t, token])

  return (
    <section className="admin-projects-workspace admin-projects-workspace--sync">
      <section className="admin-projects-list-panel">
        <div className="admin-section-head admin-section-head--projects">
          <div>
            <h2>{t('同步任务', 'Sync Jobs')}</h2>
          </div>
          <div className="admin-section-head__actions">
            <button className="admin-secondary-button" type="button" onClick={() => setJobsNonce((prev) => prev + 1)}>
              {t('刷新', 'Refresh')}
            </button>
          </div>
        </div>

        {jobsStatus === 'loading' ? <div className="admin-state-card">{t('正在加载任务...', 'Loading jobs...')}</div> : null}
        {jobsStatus === 'error' ? <div className="admin-state-card admin-state-error"><p>{jobsMessage}</p><button className="admin-primary-button" type="button" onClick={() => setJobsNonce((prev) => prev + 1)}>{t('重试', 'Retry')}</button></div> : null}
        {jobsStatus === 'empty' ? <div className="admin-state-card"><p>{t('暂无同步任务。', 'No sync jobs yet.')}</p></div> : null}

        {jobsStatus === 'ready' ? (
          <>
            <ul className="admin-projects-list">
              {jobs.map((job) => (
                <li key={job.job_id}>
                  <div className="admin-sync-job-row">
                    <button type="button" className={job.job_id === selectedJobId ? 'is-selected' : ''} onClick={() => setSelectedJobId(job.job_id)}>
                      <div>
                        <p className="name">#{job.job_id}</p>
                        <p className="meta">{describeSyncJobTarget(job, t)} · {job.state}</p>
                        {job.state === 'failed' ? <p className="admin-detail-meta">{describeSyncJobFailureReason(job, t)}</p> : null}
                        {job.result ? <p className="admin-detail-meta" data-admin-sync-summary>{summarizeSyncResult(job.result, t)}</p> : null}
                      </div>
                      <span className="pill">{formatAdminTime(resolveJobDisplayTime(job))}</span>
                    </button>
                    {job.state === 'failed' ? (
                      <button className="admin-secondary-button admin-retry-button" type="button" onClick={() => void retryJob(job.job_id)}>
                        {retryConfirmJobId === job.job_id ? t('确认重试', 'Confirm Retry') : t('重试', 'Retry')}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <div className="admin-pagination">
              <button className="admin-secondary-button" type="button" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>{t('上一页', 'Previous')}</button>
              <p>{page} / {pages}</p>
              <button className="admin-secondary-button" type="button" disabled={page >= pages} onClick={() => setPage((prev) => Math.min(pages, prev + 1))}>{t('下一页', 'Next')}</button>
            </div>
            <p className="admin-list-summary">{t(`共 ${jobsTotal} 个任务。`, `${jobsTotal} jobs total.`)}</p>
          </>
        ) : null}

        {retryState.message ? <p className="admin-feedback" data-tone={retryState.status === 'error' ? 'error' : retryState.status === 'success' ? 'success' : 'warn'}>{retryState.message}</p> : null}
      </section>

      <section className="admin-projects-detail-panel">
        <div className="admin-section-head admin-section-head--projects">
          <div>
            <h2>{t('任务详情', 'Job Details')}</h2>
          </div>
        </div>
        {!selectedJobId ? <div className="admin-state-card">{t('请选择一个任务。', 'Select a job.')}</div> : null}
        {selectedJobId && detailStatus === 'loading' ? <div className="admin-state-card">{t('正在加载详情...', 'Loading details...')}</div> : null}
        {selectedJobId && detailStatus === 'error' ? <div className="admin-state-card admin-state-error"><p>{detailMessage}</p><button className="admin-primary-button" type="button" onClick={() => setJobsNonce((prev) => prev + 1)}>{t('重试', 'Retry')}</button></div> : null}

        {selectedJobId && detailStatus === 'ready' && detail ? (
          <div className="admin-sync-detail">
            <div className="admin-sync-detail-grid">
              <p><strong>job_id:</strong> #{detail.job_id}</p>
              <p><strong>state:</strong> {detail.state}</p>
              <p><strong>mode:</strong> {detail.mode}</p>
              <p><strong>project_id:</strong> {detail.project_id || '--'}</p>
              <p><strong>github_username:</strong> {detail.github_username || '--'}</p>
              <p><strong>created_at:</strong> {formatAdminTime(detail.created_at)}</p>
              <p><strong>finished_at:</strong> {formatAdminTime(detail.finished_at)}</p>
            </div>

            {detail.result ? (
              <div className="admin-state-card">
                <p data-admin-sync-summary><strong>result:</strong> {summarizeSyncResult(detail.result, t)}</p>
              </div>
            ) : null}

            {detail.error_code || detail.error_message ? (
              <div className="admin-state-card admin-state-error">
                <p><strong>{detail.error_code || 'error'}</strong></p>
                <p>{detail.error_message || t('暂无错误信息。', 'No error message.')}</p>
              </div>
            ) : null}

            <div className="admin-sync-steps">
              <h3>{t('步骤日志', 'Step Logs')}</h3>
              {detail.steps.length === 0 ? (
                <div className="admin-state-card">{t('暂无步骤日志。', 'No step logs.')}</div>
              ) : (
                <ul className="admin-failure-list">
                  {detail.steps.map((step, index) => (
                    <li key={`${step.name}-${step.at || ''}-${index}`}>
                      <p><strong>{step.name}</strong> · {step.state}</p>
                      <p>{step.message || '--'}</p>
                      <p className="admin-detail-meta">{formatAdminTime(step.at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </section>
  )
}

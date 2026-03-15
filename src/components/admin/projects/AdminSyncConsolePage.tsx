import * as React from 'react'
import {
  createAdminSyncJob,
  fetchAdminSyncJobById,
  fetchAdminSyncJobs,
  retryAdminSyncJob,
  type AdminSyncJobDetail,
  type AdminSyncJobRecord,
} from '~/lib/api/adminProjectsApi'
import { AdminConsoleShell, useAdminConsoleAuth } from './AdminConsoleShell'
import { formatAdminTime, mapAdminError } from './adminConsoleUtils'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

interface SyncFilters {
  state: string
  mode: string
  page: number
  pageSize: number
}

const DEFAULT_SYNC_FILTERS: SyncFilters = {
  state: '',
  mode: '',
  page: 1,
  pageSize: 10,
}

const SYNC_STATES = ['queued', 'running', 'success', 'failed']
const SYNC_MODES = ['project', 'github_user']

function SyncContent() {
  const { token, invalidate } = useAdminConsoleAuth()

  const [filters, setFilters] = React.useState<SyncFilters>(DEFAULT_SYNC_FILTERS)
  const [jobsStatus, setJobsStatus] = React.useState<LoadStatus>('idle')
  const [jobsMessage, setJobsMessage] = React.useState('')
  const [jobs, setJobs] = React.useState<AdminSyncJobRecord[]>([])
  const [jobsTotal, setJobsTotal] = React.useState(0)
  const [jobsNonce, setJobsNonce] = React.useState(0)

  const [selectedJobId, setSelectedJobId] = React.useState('')
  const [detailStatus, setDetailStatus] = React.useState<LoadStatus>('idle')
  const [detailMessage, setDetailMessage] = React.useState('')
  const [detail, setDetail] = React.useState<AdminSyncJobDetail | null>(null)

  const [createMode, setCreateMode] = React.useState<'project' | 'github_user'>('project')
  const [createProjectId, setCreateProjectId] = React.useState('')
  const [createGithubUsername, setCreateGithubUsername] = React.useState('')
  const [createState, setCreateState] = React.useState<{ status: 'idle' | 'running' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' })

  const [retryConfirmJobId, setRetryConfirmJobId] = React.useState('')
  const [retryState, setRetryState] = React.useState<{ status: 'idle' | 'running' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' })

  React.useEffect(() => {
    const controller = new AbortController()

    const run = async () => {
      setJobsStatus('loading')
      setJobsMessage('')

      try {
        const result = await fetchAdminSyncJobs(
          token,
          {
            state: filters.state || undefined,
            mode: filters.mode || undefined,
            page: filters.page,
            page_size: filters.pageSize,
          },
          controller.signal,
        )
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
  }, [filters.mode, filters.page, filters.pageSize, filters.state, invalidate, jobsNonce, token])

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

  const pages = Math.max(1, Math.ceil(jobsTotal / filters.pageSize))

  const createJob = async () => {
    setCreateState({ status: 'running', message: '正在创建任务...' })
    try {
      const result = await createAdminSyncJob(token, {
        mode: createMode,
        project_id: createMode === 'project' ? createProjectId : undefined,
        github_username: createMode === 'github_user' ? createGithubUsername : undefined,
      })
      setCreateState({ status: 'success', message: `任务已创建 #${result.job_id}。` })
      setSelectedJobId(result.job_id)
      setJobsNonce((prev) => prev + 1)
    } catch (error) {
      const mapped = mapAdminError(error)
      if (mapped.code === 'unauthorized') {
        invalidate(mapped.message)
        return
      }
      setCreateState({ status: 'error', message: mapped.message })
    }
  }
  const retryJob = async (jobId: string) => {
    if (retryState.status === 'running') return

    if (retryConfirmJobId !== jobId) {
      setRetryConfirmJobId(jobId)
      setRetryState({ status: 'idle', message: '请再次点击“重试”确认。' })
      return
    }

    setRetryConfirmJobId('')
    setRetryState({ status: 'running', message: '正在发起重试...' })

    try {
      const result = await retryAdminSyncJob(token, jobId)
      setRetryState({ status: 'success', message: `已触发重试：#${result.job_id}。` })
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
  }

  return (
    <section className="admin-projects-workspace">
      <aside className="admin-projects-list-panel">
        <h2>同步中心</h2>

        <div className="admin-state-card">
          <h3>创建同步任务</h3>
          <div className="admin-projects-controls">
            <label>
              mode
              <select value={createMode} onChange={(event) => setCreateMode(event.target.value === 'github_user' ? 'github_user' : 'project')}>
                <option value="project">project</option>
                <option value="github_user">github_user</option>
              </select>
            </label>
            {createMode === 'project' ? (
              <label>project_id<input type="text" value={createProjectId} onChange={(event) => setCreateProjectId(event.target.value)} placeholder="例如 12" /></label>
            ) : (
              <label>github_username<input type="text" value={createGithubUsername} onChange={(event) => setCreateGithubUsername(event.target.value)} placeholder="例如 lambertlab" /></label>
            )}
          </div>
          <div className="admin-list-actions">
            <button className="admin-primary-button" type="button" disabled={createState.status === 'running'} onClick={() => void createJob()}>
              {createState.status === 'running' ? '创建中...' : '创建任务'}
            </button>
          </div>
          {createState.message ? <p className="admin-feedback" data-tone={createState.status === 'error' ? 'error' : createState.status === 'success' ? 'success' : 'info'}>{createState.message}</p> : null}
        </div>

        <div className="admin-projects-controls">
          <label>state<select value={filters.state} onChange={(event) => setFilters((prev) => ({ ...prev, state: event.target.value, page: 1 }))}><option value="">All</option>{SYNC_STATES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>mode<select value={filters.mode} onChange={(event) => setFilters((prev) => ({ ...prev, mode: event.target.value, page: 1 }))}><option value="">All</option>{SYNC_MODES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>page_size<select value={String(filters.pageSize)} onChange={(event) => setFilters((prev) => ({ ...prev, pageSize: Number(event.target.value), page: 1 }))}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label>
        </div>

        <div className="admin-list-actions">
          <button className="admin-secondary-button" type="button" onClick={() => setFilters(DEFAULT_SYNC_FILTERS)}>重置筛选</button>
          <button className="admin-secondary-button" type="button" onClick={() => setJobsNonce((prev) => prev + 1)}>刷新</button>
        </div>

        {jobsStatus === 'loading' ? <div className="admin-state-card">任务列表加载中...</div> : null}
        {jobsStatus === 'error' ? <div className="admin-state-card admin-state-error"><p>{jobsMessage}</p><button className="admin-primary-button" type="button" onClick={() => setJobsNonce((prev) => prev + 1)}>重试</button></div> : null}
        {jobsStatus === 'empty' ? <div className="admin-state-card"><p>暂无同步任务。</p><button className="admin-primary-button" type="button" onClick={() => setJobsNonce((prev) => prev + 1)}>重试</button></div> : null}

        {jobsStatus === 'ready' ? (
          <>
            <ul className="admin-projects-list">
              {jobs.map((job) => (
                <li key={job.job_id}>
                  <div className="admin-sync-job-row">
                    <button type="button" className={job.job_id === selectedJobId ? 'is-selected' : ''} onClick={() => setSelectedJobId(job.job_id)}>
                      <div><p className="name">#{job.job_id}</p><p className="meta">{job.mode} · {job.state}</p></div>
                      <span className="pill">{formatAdminTime(job.created_at)}</span>
                    </button>
                    {job.state === 'failed' ? (
                      <button className="admin-secondary-button admin-retry-button" type="button" onClick={() => void retryJob(job.job_id)}>
                        {retryConfirmJobId === job.job_id ? '再次确认重试' : '重试'}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <div className="admin-pagination">
              <button className="admin-secondary-button" type="button" disabled={filters.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}>上一页</button>
              <p>{filters.page} / {pages}</p>
              <button className="admin-secondary-button" type="button" disabled={filters.page >= pages} onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(pages, prev.page + 1) }))}>下一页</button>
            </div>
            <p className="admin-list-summary">共 {jobsTotal} 条任务。</p>
          </>
        ) : null}

        {retryState.message ? <p className="admin-feedback" data-tone={retryState.status === 'error' ? 'error' : retryState.status === 'success' ? 'success' : 'warn'}>{retryState.message}</p> : null}
      </aside>

      <section className="admin-projects-detail-panel">
        <h2>任务详情</h2>
        {!selectedJobId ? <div className="admin-state-card">请选择任务。</div> : null}
        {selectedJobId && detailStatus === 'loading' ? <div className="admin-state-card">详情加载中...</div> : null}
        {selectedJobId && detailStatus === 'error' ? <div className="admin-state-card admin-state-error"><p>{detailMessage}</p><button className="admin-primary-button" type="button" onClick={() => setJobsNonce((prev) => prev + 1)}>重试详情</button></div> : null}

        {selectedJobId && detailStatus === 'ready' && detail ? (
          <div className="admin-sync-detail">
            <div className="admin-sync-detail-grid">
              <p><strong>job_id:</strong> #{detail.job_id}</p>
              <p><strong>state:</strong> {detail.state}</p>
              <p><strong>mode:</strong> {detail.mode}</p>
              <p><strong>project_id:</strong> {detail.project_id || '--'}</p>
              <p><strong>github_username:</strong> {detail.github_username || '--'}</p>
              <p><strong>updated_at:</strong> {formatAdminTime(detail.updated_at)}</p>
            </div>

            {detail.error_code || detail.error_message ? (
              <div className="admin-state-card admin-state-error">
                <p><strong>{detail.error_code || 'error'}</strong></p>
                <p>{detail.error_message || '无错误消息。'}</p>
              </div>
            ) : null}

            <div className="admin-sync-steps">
              <h3>步骤日志</h3>
              {detail.steps.length === 0 ? (
                <div className="admin-state-card">暂无步骤日志。</div>
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

export function AdminSyncConsolePage() {
  return (
    <AdminConsoleShell
      mode="sync"
      title="Control Center · 同步中心 | lambertlab"
      description="同步中心：创建任务、查看详情、失败重试。"
    >
      <SyncContent />
    </AdminConsoleShell>
  )
}

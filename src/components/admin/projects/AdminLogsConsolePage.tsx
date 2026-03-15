import * as React from 'react'
import { fetchAdminLogs, type AdminLogRecord, type AdminLogsListResult } from '~/lib/api/adminProjectsApi'
import { AdminConsoleShell, useAdminConsoleAuth } from './AdminConsoleShell'
import { formatAdminTime, mapAdminError } from './adminConsoleUtils'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

interface LogsFilters {
  projectId: string
  action: string
  from: string
  to: string
  page: number
  pageSize: number
}

const DEFAULT_LOGS_FILTERS: LogsFilters = {
  projectId: '',
  action: '',
  from: '',
  to: '',
  page: 1,
  pageSize: 20,
}

const LOG_ACTIONS = ['edit_project', 'sync_project', 'retry_sync', 'sync_job_create']

function LogsContent() {
  const { token, invalidate } = useAdminConsoleAuth()
  const [filters, setFilters] = React.useState<LogsFilters>(DEFAULT_LOGS_FILTERS)
  const [status, setStatus] = React.useState<LoadStatus>('idle')
  const [message, setMessage] = React.useState('')
  const [data, setData] = React.useState<AdminLogsListResult>({ logs: [], total: 0, page: 1, page_size: 20 })
  const [nonce, setNonce] = React.useState(0)

  React.useEffect(() => {
    const controller = new AbortController()

    const run = async () => {
      setStatus('loading')
      setMessage('')
      try {
        const result = await fetchAdminLogs(
          token,
          {
            project_id: filters.projectId || undefined,
            action: filters.action || undefined,
            from: filters.from || undefined,
            to: filters.to || undefined,
            page: filters.page,
            page_size: filters.pageSize,
          },
          controller.signal,
        )
        if (controller.signal.aborted) return

        setData(result)
        if (result.logs.length === 0) {
          setStatus('empty')
          return
        }

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
  }, [filters.action, filters.from, filters.page, filters.pageSize, filters.projectId, filters.to, invalidate, nonce, token])

  const pages = Math.max(1, Math.ceil(data.total / filters.pageSize))

  return (
    <section className="admin-projects-detail-panel admin-logs-page">
      <h2>操作日志</h2>

      <div className="admin-projects-controls">
        <label>project_id<input type="text" value={filters.projectId} onChange={(event) => setFilters((prev) => ({ ...prev, projectId: event.target.value, page: 1 }))} placeholder="例如 12" /></label>
        <label>action<select value={filters.action} onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value, page: 1 }))}><option value="">All</option>{LOG_ACTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>from<input type="datetime-local" value={filters.from} onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value, page: 1 }))} /></label>
        <label>to<input type="datetime-local" value={filters.to} onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value, page: 1 }))} /></label>
        <label>page_size<select value={String(filters.pageSize)} onChange={(event) => setFilters((prev) => ({ ...prev, pageSize: Number(event.target.value), page: 1 }))}><option value="20">20</option><option value="50">50</option><option value="100">100</option></select></label>
      </div>

      <div className="admin-list-actions">
        <button className="admin-secondary-button" type="button" onClick={() => setFilters(DEFAULT_LOGS_FILTERS)}>重置筛选</button>
        <button className="admin-secondary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>刷新</button>
      </div>

      {status === 'loading' ? <div className="admin-state-card">日志加载中...</div> : null}
      {status === 'error' ? <div className="admin-state-card admin-state-error"><p>{message}</p><button className="admin-primary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>重试</button></div> : null}
      {status === 'empty' ? <div className="admin-state-card"><p>暂无日志。</p><button className="admin-primary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>重试</button></div> : null}

      {status === 'ready' ? (
        <>
          <div className="admin-logs-table-wrap">
            <table className="admin-logs-table">
              <thead><tr><th>时间</th><th>动作</th><th>project_id</th><th>结果</th><th>来源</th><th>消息</th></tr></thead>
              <tbody>
                {data.logs.map((log: AdminLogRecord) => (
                  <tr key={log.id}>
                    <td>{formatAdminTime(log.created_at)}</td>
                    <td>{log.action || '--'}</td>
                    <td>{log.project_id || '--'}</td>
                    <td>{log.result || '--'}</td>
                    <td>{log.operator_source || '--'}</td>
                    <td>{log.message || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <button className="admin-secondary-button" type="button" disabled={filters.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}>上一页</button>
            <p>{filters.page} / {pages}</p>
            <button className="admin-secondary-button" type="button" disabled={filters.page >= pages} onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(pages, prev.page + 1) }))}>下一页</button>
          </div>
          <p className="admin-list-summary">共 {data.total} 条日志。</p>
        </>
      ) : null}
    </section>
  )
}

export function AdminLogsConsolePage() {
  return (
    <AdminConsoleShell
      mode="logs"
      title="Control Center · 操作日志 | lambertlab"
      description="操作日志：按项目/动作/时间过滤与分页。"
    >
      <LogsContent />
    </AdminConsoleShell>
  )
}
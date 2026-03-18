import * as React from 'react'
import { fetchAdminLogs, type AdminLogRecord, type AdminLogsListResult } from '~/lib/api/adminProjectsApi'
import { useUiLocale } from '~/lib/uiLocale'
import { AdminConsoleShell, useAdminConsoleAuth } from './AdminConsoleShell'
import { formatAdminTime, mapAdminError } from './adminConsoleUtils'
import { AdminSyncJobLogsPanels } from './AdminSyncConsolePage'

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
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])
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
    <section className="admin-projects-workspace admin-projects-workspace--catalog">
      <section className="admin-projects-list-panel admin-logs-page">
        <div className="admin-section-head admin-section-head--projects">
          <div>
            <h2>{t('操作日志', 'Activity Logs')}</h2>
          </div>
          <div className="admin-section-head__actions">
            <button className="admin-secondary-button" type="button" onClick={() => setFilters(DEFAULT_LOGS_FILTERS)}>
              {t('重置', 'Reset')}
            </button>
            <button className="admin-secondary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>
              {t('刷新', 'Refresh')}
            </button>
          </div>
        </div>

        <div className="admin-logs-toolbar" aria-label={t('日志筛选', 'Log filters')}>
          <div className="admin-logs-toolbar__filters">
            <input
              aria-label="project_id"
              className="admin-logs-filter"
              type="text"
              value={filters.projectId}
              onChange={(event) => setFilters((prev) => ({ ...prev, projectId: event.target.value, page: 1 }))}
              placeholder="project_id"
            />
            <select
              aria-label={t('操作类型', 'Action')}
              className="admin-logs-filter admin-logs-filter--select"
              value={filters.action}
              onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value, page: 1 }))}
            >
              <option value="">{t('全部操作', 'All actions')}</option>
              {LOG_ACTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              aria-label={t('开始时间', 'From')}
              className="admin-logs-filter admin-logs-filter--datetime"
              type="datetime-local"
              value={filters.from}
              onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value, page: 1 }))}
            />
            <input
              aria-label={t('结束时间', 'To')}
              className="admin-logs-filter admin-logs-filter--datetime"
              type="datetime-local"
              value={filters.to}
              onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value, page: 1 }))}
            />
            <select
              aria-label={t('每页数量', 'Page size')}
              className="admin-logs-filter admin-logs-filter--select admin-logs-filter--size"
              value={String(filters.pageSize)}
              onChange={(event) => setFilters((prev) => ({ ...prev, pageSize: Number(event.target.value), page: 1 }))}
            >
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>
        </div>

        {status === 'loading' ? <div className="admin-state-card">{t('日志加载中...', 'Loading logs...')}</div> : null}
        {status === 'error' ? <div className="admin-state-card admin-state-error"><p>{message}</p><button className="admin-primary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>{t('重试', 'Retry')}</button></div> : null}
        {status === 'empty' ? <div className="admin-state-card"><p>{t('暂无日志。', 'No logs yet.')}</p></div> : null}

        {status === 'ready' ? (
          <>
            <div className="admin-logs-table-wrap">
              <table className="admin-logs-table">
                <thead>
                  <tr>
                    <th>{t('时间', 'Time')}</th>
                    <th>{t('动作', 'Action')}</th>
                    <th>project_id</th>
                    <th>{t('结果', 'Result')}</th>
                    <th>{t('来源', 'Source')}</th>
                    <th>{t('消息', 'Message')}</th>
                  </tr>
                </thead>
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
              <button className="admin-secondary-button" type="button" disabled={filters.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}>
                {t('上一页', 'Previous')}
              </button>
              <p>{filters.page} / {pages}</p>
              <button className="admin-secondary-button" type="button" disabled={filters.page >= pages} onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(pages, prev.page + 1) }))}>
                {t('下一页', 'Next')}
              </button>
            </div>
            <p className="admin-list-summary">{t(`共 ${data.total} 条日志。`, `${data.total} logs total.`)}</p>
          </>
        ) : null}
      </section>
    </section>
  )
}

export function AdminLogsConsolePage() {
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])

  return (
    <AdminConsoleShell
      mode="logs"
      title={t('Control Center · 操作日志 | lambertlab', 'Control Center · Logs | lambertlab')}
      description={t('查看同步任务历史、步骤日志与后台操作日志。', 'Review sync history, step logs, and admin activity logs.')}
    >
      <div className="admin-console-stack">
        <AdminSyncJobLogsPanels />
        <LogsContent />
      </div>
    </AdminConsoleShell>
  )
}

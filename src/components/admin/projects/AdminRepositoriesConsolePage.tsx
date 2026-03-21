import * as React from 'react'
import {
  createAdminSyncJob,
  fetchAdminRepositories,
  fetchAdminSyncJobs,
  type AdminRepositoryRecord,
  type AdminSyncJobRecord,
  type AdminSyncResultSummary,
} from '~/lib/api/adminProjectsApi'
import { useUiLocale } from '~/lib/uiLocale'
import { AdminConsoleShell, useAdminConsoleAuth } from './AdminConsoleShell'
import { mapAdminError } from './adminConsoleUtils'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

const REPOSITORIES_PAGE_SIZE = 100
const JOBS_PAGE_SIZE = 20

function summarizeSyncResult(result: AdminSyncResultSummary | null): string {
  if (!result) {
    return ''
  }

  return ['新增=' + result.created, '更新=' + result.updated, '下线=' + result.deactivated].join(' | ')
}

function describeCreatedGithubSyncJobOutcome(
  job: Pick<AdminSyncJobRecord, 'job_id' | 'state' | 'error_message' | 'result'>,
  t: (zh: string, en: string) => string,
): { status: 'success' | 'error'; message: string } {
  const summaryText = summarizeSyncResult(job.result)
  if (job.state === 'failed') {
    const reason = job.error_message || t('同步失败。', 'Sync failed.')
    return {
      status: 'error',
      message: summaryText
        ? t(`任务 #${job.job_id} 失败：${reason}。${summaryText}`, `Job #${job.job_id} failed: ${reason}. ${summaryText}`)
        : t(`任务 #${job.job_id} 失败：${reason}`, `Job #${job.job_id} failed: ${reason}`),
    }
  }
  return {
    status: 'success',
    message: summaryText
      ? t(`任务 #${job.job_id} 已创建。${summaryText}`, `Job #${job.job_id} created. ${summaryText}`)
      : t(`任务 #${job.job_id} 已创建。`, `Job #${job.job_id} created.`),
  }
}

function describeRecoveredGithubSyncJobOutcome(
  job: Pick<AdminSyncJobRecord, 'job_id' | 'state' | 'error_message' | 'result'>,
  t: (zh: string, en: string) => string,
): { status: 'success' | 'error'; message: string } {
  const summaryText = summarizeSyncResult(job.result)
  if (job.state === 'failed') {
    const reason = job.error_message || t('同步失败。', 'Sync failed.')
    return {
      status: 'error',
      message: summaryText
        ? t(`请求超时，但任务 #${job.job_id} 已失败：${reason}。${summaryText}`, `Request timed out, but job #${job.job_id} failed: ${reason}. ${summaryText}`)
        : t(`请求超时，但任务 #${job.job_id} 已失败：${reason}`, `Request timed out, but job #${job.job_id} failed: ${reason}`),
    }
  }
  return {
    status: 'success',
    message: t(`请求超时，但任务 #${job.job_id} 已受理，请到 Logs 查看详情。`, `Request timed out, but job #${job.job_id} was accepted. Check Logs for details.`),
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

function isRecentJob(createdAt: string | null, now: number, windowMs: number): boolean {
  if (!createdAt) return true
  const parsed = Date.parse(createdAt)
  if (Number.isNaN(parsed)) return true
  return now - parsed <= windowMs
}

function RepositoryListContent() {
  const { token, invalidate } = useAdminConsoleAuth()
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])

  const [repositories, setRepositories] = React.useState<AdminRepositoryRecord[]>([])
  const [listStatus, setListStatus] = React.useState<LoadStatus>('idle')
  const [listMessage, setListMessage] = React.useState('')
  const [searchInput, setSearchInput] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [listNonce, setListNonce] = React.useState(0)
  const [createState, setCreateState] = React.useState<{ status: 'idle' | 'running' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  })

  React.useEffect(() => {
    if (searchInput === searchQuery) {
      return
    }

    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
    }, 400)

    return () => window.clearTimeout(timer)
  }, [searchInput, searchQuery])

  React.useEffect(() => {
    const controller = new AbortController()

    const run = async () => {
      setListStatus('loading')
      setListMessage('')

      try {
        const result = await fetchAdminRepositories(
          token,
          {
            q: searchQuery,
            page_size: REPOSITORIES_PAGE_SIZE,
          },
          controller.signal,
        )
        if (controller.signal.aborted) return
        setRepositories(result.repositories)
        setListStatus(result.repositories.length > 0 ? 'ready' : 'empty')
      } catch (error) {
        if (controller.signal.aborted) return
        const mapped = mapAdminError(error)
        if (mapped.code === 'unauthorized') {
          invalidate(mapped.message)
          return
        }
        setRepositories([])
        setListStatus('error')
        setListMessage(mapped.message)
      }
    }

    void run()
    return () => controller.abort()
  }, [invalidate, listNonce, searchQuery, token])

  const createJob = React.useCallback(async () => {
    setCreateState({ status: 'running', message: t('导入中...', 'Importing...') })

    try {
      const result = await createAdminSyncJob(token, {
        mode: 'github_user',
        github_username: 'lambertlab',
      })

      setCreateState(describeCreatedGithubSyncJobOutcome(result, t))
      setListNonce((prev) => prev + 1)
    } catch (error) {
      const mapped = mapAdminError(error)
      if (mapped.code === 'unauthorized') {
        invalidate(mapped.message)
        return
      }

      if (mapped.code !== 'request_timeout') {
        setCreateState({ status: 'error', message: mapped.message })
        return
      }

      setCreateState({ status: 'running', message: t('请求超时，正在检查最近导入任务...', 'Request timed out. Checking recent import jobs...') })

      const now = Date.now()
      let recovered: AdminSyncJobRecord | null = null

      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          const jobsResult = await fetchAdminSyncJobs(token, { page: 1, page_size: JOBS_PAGE_SIZE })
          recovered =
            jobsResult.jobs.find((job) => {
              if (job.mode !== 'github_user') return false
              if ((job.github_username || '').trim().toLowerCase() !== 'lambertlab') return false
              return isRecentJob(job.created_at, now, 20 * 60 * 1000)
            }) ?? null

          if (recovered) {
            break
          }
        } catch (recoverError) {
          const recoverMapped = mapAdminError(recoverError)
          if (recoverMapped.code === 'unauthorized') {
            invalidate(recoverMapped.message)
            return
          }
        }

        await sleep(800 + attempt * 500)
      }

      if (!recovered) {
        setCreateState({
          status: 'error',
          message: t('请求超时，暂未发现匹配任务，请稍后到 Logs 查看。', 'Request timed out. No matching job found yet, please check Logs later.'),
        })
        return
      }

      setCreateState(describeRecoveredGithubSyncJobOutcome(recovered, t))
      setListNonce((prev) => prev + 1)
    }
  }, [invalidate, t, token])

  return (
    <section className="admin-projects-workspace admin-projects-workspace--catalog admin-projects-workspace--list">
      <section className="admin-projects-catalog" aria-label={t('仓库列表', 'Repository list')}>
        <div className="admin-projects-actions" role="toolbar" aria-label={t('仓库操作区', 'Repository actions')}>
          <label className="admin-search-field admin-search-field--projects admin-projects-actions__search">
            <input
              aria-label={t('搜索仓库', 'Search repositories')}
              type="search"
              value={searchInput}
              onChange={(event) => {
                const nextValue = event.target.value
                setSearchInput(nextValue)
                if (nextValue === '') {
                  setSearchQuery('')
                }
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                setSearchQuery(searchInput.trim())
              }}
              onBlur={() => setSearchQuery(searchInput.trim())}
              placeholder="Search Repositories..."
            />
          </label>

          <div className="admin-projects-actions__buttons">
            <button className="admin-primary-button" type="button" onClick={() => void createJob()} disabled={createState.status === 'running'}>
              {createState.status === 'running' ? t('导入中...', 'Importing...') : t('导入 Github Repo', 'Import Github Repo')}
            </button>
          </div>
        </div>

        {createState.message ? (
          <div className="admin-surface-feedback">
            <p className="admin-feedback" data-tone={createState.status === 'error' ? 'error' : createState.status === 'success' ? 'success' : 'info'}>
              {createState.message}
            </p>
          </div>
        ) : null}

        <div className="admin-projects-results">
          {listStatus === 'loading' ? <div className="admin-state-card">{t('加载中...', 'Loading...')}</div> : null}
          {listStatus === 'error' ? (
            <div className="admin-state-card admin-state-error">
              <p>{listMessage}</p>
              <button className="admin-primary-button" type="button" onClick={() => setListNonce((prev) => prev + 1)}>
                {t('重试', 'Retry')}
              </button>
            </div>
          ) : null}
          {listStatus === 'empty' ? (
            <div className="admin-state-card">
              <p>
                {searchQuery
                  ? t('没有匹配的 GitHub 仓库。', 'No matching GitHub repositories.')
                  : t('当前还没有导入任何 GitHub 仓库。', 'No GitHub repositories have been imported yet.')}
              </p>
            </div>
          ) : null}

          {listStatus === 'ready' ? (
            <ul className="admin-repository-grid">
              {repositories.map((repo) => {
                const visibility = (repo.visibility || 'public').toLowerCase()
                const description = repo.description?.trim() || t('\u8be5\u4ed3\u5e93\u6682\u65e0\u63cf\u8ff0\u3002', 'No description provided for this repository.')

                return (
                  <li key={repo.id} className="admin-repository-grid__item">
                    <article className="admin-repository-card" data-visibility={visibility}>
                      <div className="admin-repository-card__main">
                        <div className="admin-repository-card__header">
                          <p className="admin-repository-card__name">{repo.repo_name || repo.repo_full_name}</p>
                          <p className="admin-repository-card__meta">{`Stars ${repo.stargazers_count}`}</p>
                        </div>
                        <p className="admin-repository-card__description" title={description}>
                          {description}
                        </p>
                      </div>
                      <div className="admin-repository-card__actions">
                        <a className="admin-secondary-button" href={repo.repo_url} target="_blank" rel="noreferrer">
                          {t('\u6253\u5f00 Repo', 'Open Repo')}
                        </a>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      </section>
    </section>
  )
}

export function AdminRepositoriesConsolePage() {
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])

  return (
    <AdminConsoleShell
      mode="repositories"
      title={t('Lambert Lab Admin · Repositories | lambertlab', 'Lambert Lab Admin · Repositories | lambertlab')}
      description={t('Repositories 页面用于导入并查看同步到系统的仓库。', 'Repositories is used to import and review repositories synced into the system.')}
    >
      <RepositoryListContent />
    </AdminConsoleShell>
  )
}

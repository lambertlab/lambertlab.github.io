import { Link } from '@tanstack/react-router'
import * as React from 'react'
import {
  AdminProjectsApiError,
  type AdminProjectErrorCode,
  type AdminProjectRecord,
  fetchAdminProjectById,
  fetchAdminProjects,
  syncAdminProjectRepositories,
  updateAdminProjectById,
  verifyAdminToken,
} from '~/lib/api/adminProjectsApi'
import { useDocumentMetadata, useUiLocale } from '~/lib/uiLocale'
import {
  DEFAULT_ADMIN_PROJECTS_SEARCH_STATE,
  normalizeAdminProjectsSearchState,
  type AdminProjectsSearchState,
} from './adminProjectsSearch'

const TOKEN_KEY = 'll-admin-token-v1'
const STAGES = ['building', 'active', 'maintenance', 'research', 'archived']
const PROJECT_TYPES = ['website', 'backend', 'tooling', 'infra', 'research', 'agent', 'data', 'library']
const VISIBILITY = ['public', 'private', 'internal']

type ConsoleMode = 'overview' | 'projects'
type AuthStatus = 'checking' | 'locked' | 'verifying' | 'ready' | 'error'
type LoadStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

interface FormState {
  slug: string
  name: string
  headline: string
  summary: string
  overview: string
  status_note: string
  stage: string
  project_type: string
  visibility: string
  is_featured: boolean
  featured_rank: string
  sort_order: string
  accent: string
}

interface OperationState {
  status: 'idle' | 'running' | 'success' | 'error'
  message: string
}

interface Props {
  mode: ConsoleMode
  searchState?: AdminProjectsSearchState
  onSearchStateChange?: (patch: Partial<AdminProjectsSearchState>) => void
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readToken(): string {
  if (typeof window === 'undefined') return ''
  try {
    return toText(window.localStorage.getItem(TOKEN_KEY))
  } catch {
    return ''
  }
}

function saveToken(token: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // noop
  }
}

function clearToken() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // noop
  }
}

function toForm(project: AdminProjectRecord): FormState {
  return {
    slug: project.slug,
    name: project.name,
    headline: project.headline,
    summary: project.summary,
    overview: project.overview,
    status_note: project.status_note ?? '',
    stage: project.stage,
    project_type: project.project_type,
    visibility: project.visibility,
    is_featured: project.is_featured,
    featured_rank: project.featured_rank === null ? '' : String(project.featured_rank),
    sort_order: project.sort_order === null ? '' : String(project.sort_order),
    accent: project.accent ?? '',
  }
}

function toPayload(form: FormState) {
  const asNullableNumber = (value: string): number | null => {
    const text = value.trim()
    if (!text) return null
    const parsed = Number(text)
    if (!Number.isFinite(parsed)) return null
    return Math.round(parsed)
  }

  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    headline: form.headline.trim(),
    summary: form.summary.trim(),
    overview: form.overview.trim(),
    status_note: form.status_note.trim() || null,
    stage: form.stage.trim().toLowerCase(),
    project_type: form.project_type.trim().toLowerCase(),
    visibility: form.visibility.trim().toLowerCase(),
    is_featured: form.is_featured,
    featured_rank: asNullableNumber(form.featured_rank),
    sort_order: asNullableNumber(form.sort_order),
    accent: form.accent.trim() || null,
  }
}

function formatTime(value: string | null): string {
  if (!value) return '--'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '--'
  return parsed.toLocaleString('zh-CN', { hour12: false })
}

function errorMessage(error: unknown): { code: AdminProjectErrorCode; message: string } {
  if (error instanceof AdminProjectsApiError) {
    if (error.code === 'unauthorized') return { code: 'unauthorized', message: 'Admin Token 无效或过期，请重新验证。' }
    if (error.code === 'project_not_found') return { code: error.code, message: '未找到该项目，请刷新列表后重试。' }
    if (error.code === 'project_slug_conflict') return { code: error.code, message: 'Slug 冲突，请更换后保存。' }
    if (error.code === 'invalid_stage') return { code: error.code, message: 'stage 不合法，请按协议填写。' }
    if (error.code === 'invalid_project_type') return { code: error.code, message: 'project_type 不合法，请按协议填写。' }
    if (error.code === 'invalid_visibility') return { code: error.code, message: 'visibility 不合法，请按协议填写。' }
    if (error.code === 'repository_conflict') return { code: error.code, message: '仓库绑定冲突，请检查后重试。' }
    if (error.code === 'sync_failed') return { code: error.code, message: '同步失败，请稍后重试。' }
    if (error.code === 'invalid_link_type') return { code: error.code, message: '链接类型不合法，请检查后重试。' }
    if (toText(error.message)) return { code: error.code, message: toText(error.message) }
  }

  if (error instanceof Error && toText(error.message)) {
    return { code: 'unknown', message: toText(error.message) }
  }

  return { code: 'unknown', message: '请求失败，请重试。' }
}

export function AdminProjectsConsolePage({ mode, searchState, onSearchStateChange }: Props) {
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])

  const [localSearchState, setLocalSearchState] = React.useState(DEFAULT_ADMIN_PROJECTS_SEARCH_STATE)
  const currentSearch = normalizeAdminProjectsSearchState(
    (searchState ? { ...DEFAULT_ADMIN_PROJECTS_SEARCH_STATE, ...searchState } : localSearchState) as unknown as Record<string, unknown>,
  )

  const patchSearch = React.useCallback(
    (patch: Partial<AdminProjectsSearchState>) => {
      if (onSearchStateChange) {
        onSearchStateChange(patch)
        return
      }
      setLocalSearchState((prev) => normalizeAdminProjectsSearchState({ ...prev, ...patch } as unknown as Record<string, unknown>))
    },
    [onSearchStateChange],
  )

  const [tokenInput, setTokenInput] = React.useState('')
  const [token, setToken] = React.useState<string | null>(null)
  const [authStatus, setAuthStatus] = React.useState<AuthStatus>('checking')
  const [authMessage, setAuthMessage] = React.useState('')

  const [projects, setProjects] = React.useState<AdminProjectRecord[]>([])
  const [backendTotal, setBackendTotal] = React.useState(0)
  const [listStatus, setListStatus] = React.useState<LoadStatus>('idle')
  const [listMessage, setListMessage] = React.useState('')
  const [listNonce, setListNonce] = React.useState(0)

  const [detailStatus, setDetailStatus] = React.useState<LoadStatus>('idle')
  const [detailMessage, setDetailMessage] = React.useState('')
  const [detailProject, setDetailProject] = React.useState<AdminProjectRecord | null>(null)
  const [form, setForm] = React.useState<FormState | null>(null)

  const [saveState, setSaveState] = React.useState<OperationState>({ status: 'idle', message: '' })
  const [syncState, setSyncState] = React.useState<OperationState>({ status: 'idle', message: '' })

  useDocumentMetadata(
    mode === 'projects' ? t('Control Center · Projects 管理 | lambertlab', 'Control Center · Projects Admin | lambertlab') : t('Control Center · Admin 入口 | lambertlab', 'Control Center · Admin Entry | lambertlab'),
    mode === 'projects' ? t('Projects 后台管理：列表、编辑、同步。', 'Projects admin: list, edit, sync.') : t('Control Center 管理入口，需 token 验证。', 'Control Center admin entry with token gate.'),
  )

  const invalidate = React.useCallback(
    (message?: string) => {
      clearToken()
      setToken(null)
      setAuthStatus('error')
      setAuthMessage(message || t('Admin Token 已失效，请重新验证。', 'Admin token expired. Please verify again.'))
      setProjects([])
      setBackendTotal(0)
      setListStatus('idle')
      setDetailStatus('idle')
      setDetailProject(null)
      setForm(null)
      setSaveState({ status: 'idle', message: '' })
      setSyncState({ status: 'idle', message: '' })
      if (mode === 'projects') {
        patchSearch({ projectId: '', page: 1 })
      }
    },
    [mode, patchSearch, t],
  )

  const verify = React.useCallback(
    async (candidate: string, silent = false) => {
      const value = candidate.trim()
      if (!value) {
        setAuthStatus('locked')
        setAuthMessage(t('请输入 Admin Token。', 'Please input admin token.'))
        return
      }

      setAuthStatus(silent ? 'checking' : 'verifying')
      setAuthMessage('')
      try {
        await verifyAdminToken(value)
        saveToken(value)
        setToken(value)
        setAuthStatus('ready')
      } catch (error) {
        const mapped = errorMessage(error)
        clearToken()
        setToken(null)
        setAuthStatus('error')
        setAuthMessage(mapped.message)
      }
    },
    [t],
  )

  React.useEffect(() => {
    const stored = readToken()
    if (!stored) {
      setAuthStatus('locked')
      return
    }
    setTokenInput(stored)
    void verify(stored, true)
  }, [verify])

  const loadList = React.useCallback(
    async (signal?: AbortSignal) => {
      if (!token) return
      setListStatus('loading')
      setListMessage('')

      try {
        const result = await fetchAdminProjects(token, undefined, signal)
        if (signal?.aborted) return
        setProjects(result.projects)
        setBackendTotal(result.total)
        if (result.projects.length === 0) {
          setListStatus('empty')
          patchSearch({ projectId: '', page: 1 })
          return
        }
        setListStatus('ready')
      } catch (error) {
        if (signal?.aborted) return
        const mapped = errorMessage(error)
        if (mapped.code === 'unauthorized') {
          invalidate(mapped.message)
          return
        }
        setListStatus('error')
        setListMessage(mapped.message)
      }
    },
    [invalidate, patchSearch, token],
  )

  React.useEffect(() => {
    if (authStatus !== 'ready' || mode !== 'projects') return
    const controller = new AbortController()
    void loadList(controller.signal)
    return () => controller.abort()
  }, [authStatus, listNonce, loadList, mode])

  const filtered = React.useMemo(() => {
    const q = currentSearch.q.trim().toLowerCase()
    const stage = currentSearch.stage.trim().toLowerCase()
    const visibility = currentSearch.visibility.trim().toLowerCase()

    return projects.filter((project) => {
      if (stage && project.stage.trim().toLowerCase() !== stage) return false
      if (visibility && project.visibility.trim().toLowerCase() !== visibility) return false
      if (!q) return true
      const content = [project.name, project.slug, project.headline, project.summary].join(' ').toLowerCase()
      return content.includes(q)
    })
  }, [currentSearch.q, currentSearch.stage, currentSearch.visibility, projects])

  const pages = Math.max(1, Math.ceil(filtered.length / currentSearch.pageSize))
  const page = Math.min(Math.max(currentSearch.page, 1), pages)

  React.useEffect(() => {
    if (page !== currentSearch.page) {
      patchSearch({ page })
    }
  }, [currentSearch.page, page, patchSearch])

  React.useEffect(() => {
    if (mode !== 'projects' || listStatus !== 'ready' || projects.length === 0) return
    if (projects.some((item) => item.id === currentSearch.projectId)) return
    patchSearch({ projectId: projects[0].id })
  }, [currentSearch.projectId, listStatus, mode, patchSearch, projects])

  const start = (page - 1) * currentSearch.pageSize
  const paged = filtered.slice(start, start + currentSearch.pageSize)
  const selectedId = currentSearch.projectId

  const loadDetail = React.useCallback(
    async (projectId: string, signal?: AbortSignal) => {
      if (!token || !projectId) {
        setDetailStatus('idle')
        setDetailMessage('')
        setDetailProject(null)
        setForm(null)
        return
      }

      setDetailStatus('loading')
      setDetailMessage('')
      setSaveState({ status: 'idle', message: '' })
      setSyncState({ status: 'idle', message: '' })

      try {
        const detail = await fetchAdminProjectById(token, projectId, signal)
        if (signal?.aborted) return
        setDetailStatus('ready')
        setDetailProject(detail)
        setForm(toForm(detail))
      } catch (error) {
        if (signal?.aborted) return
        const mapped = errorMessage(error)
        if (mapped.code === 'unauthorized') {
          invalidate(mapped.message)
          return
        }
        setDetailStatus('error')
        setDetailMessage(mapped.message)
      }
    },
    [invalidate, token],
  )

  React.useEffect(() => {
    if (authStatus !== 'ready' || mode !== 'projects') return
    if (!selectedId) {
      setDetailStatus('idle')
      setDetailProject(null)
      setForm(null)
      return
    }

    const controller = new AbortController()
    void loadDetail(selectedId, controller.signal)
    return () => controller.abort()
  }, [authStatus, loadDetail, mode, selectedId])

  const saveProject = React.useCallback(async () => {
    if (!token || !selectedId || !form) return

    setSaveState({ status: 'running', message: t('正在保存变更...', 'Saving changes...') })
    try {
      const updated = await updateAdminProjectById(token, selectedId, toPayload(form))
      setSaveState({ status: 'success', message: t('保存成功。', 'Saved.') })
      setSyncState({ status: 'idle', message: '' })
      setDetailProject(updated)
      setDetailStatus('ready')
      setForm(toForm(updated))
      setProjects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (error) {
      const mapped = errorMessage(error)
      if (mapped.code === 'unauthorized') {
        invalidate(mapped.message)
        return
      }
      setSaveState({ status: 'error', message: mapped.message })
    }
  }, [form, invalidate, selectedId, t, token])

  const syncProject = React.useCallback(async () => {
    if (!token || !selectedId) return

    setSyncState({ status: 'running', message: t('正在同步仓库...', 'Syncing repositories...') })
    try {
      const updated = await syncAdminProjectRepositories(token, selectedId)
      setSyncState({ status: 'success', message: t(`同步完成：${formatTime(updated.synced_at)}`, `Sync done: ${formatTime(updated.synced_at)}`) })
      setSaveState({ status: 'idle', message: '' })
      setDetailProject(updated)
      setDetailStatus('ready')
      setForm(toForm(updated))
      setProjects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (error) {
      const mapped = errorMessage(error)
      if (mapped.code === 'unauthorized') {
        invalidate(mapped.message)
        return
      }
      setSyncState({ status: 'error', message: mapped.message })
    }
  }, [invalidate, selectedId, t, token])

  const ready = authStatus === 'ready'

  const resetFilters = () => {
    patchSearch({
      q: '',
      stage: '',
      visibility: '',
      page: 1,
      pageSize: DEFAULT_ADMIN_PROJECTS_SEARCH_STATE.pageSize,
    })
  }

  return (
    <main className="admin-projects-shell" id="main-content">
      <section className="admin-projects-hero">
        <div>
          <p className="admin-projects-kicker">Control Center · Phase 1</p>
          <h1>{t('Projects 后台管理 MVP', 'Projects Admin MVP')}</h1>
          <p>{t('覆盖 token 门禁、列表筛选分页、编辑与同步。', 'Token gate, list filters, edit and sync.')}</p>
        </div>
        <nav className="admin-projects-tabs" aria-label="admin nav">
          <Link to="/admin" className={mode === 'overview' ? 'is-active' : ''}>/admin</Link>
          <Link to="/admin/projects" search={DEFAULT_ADMIN_PROJECTS_SEARCH_STATE} className={mode === 'projects' ? 'is-active' : ''}>/admin/projects</Link>
        </nav>
      </section>

      {!ready ? (
        <section className="admin-auth-card" aria-live="polite">
          <h2>{t('Admin Token 校验', 'Admin Token Verification')}</h2>
          <form
            className="admin-auth-form"
            onSubmit={(event) => {
              event.preventDefault()
              void verify(tokenInput)
            }}
          >
            <label htmlFor="admin-token">X-Admin-Token</label>
            <input id="admin-token" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} type="password" autoComplete="off" />
            <div className="admin-auth-actions">
              <button className="admin-primary-button" type="submit" disabled={authStatus === 'checking' || authStatus === 'verifying'}>
                {authStatus === 'checking' || authStatus === 'verifying' ? t('校验中...', 'Verifying...') : t('验证 Token', 'Verify Token')}
              </button>
              <button
                className="admin-secondary-button"
                type="button"
                onClick={() => {
                  clearToken()
                  setTokenInput('')
                  setAuthStatus('locked')
                  setAuthMessage('')
                }}
              >
                {t('清空', 'Clear')}
              </button>
            </div>
          </form>
          {authStatus === 'checking' ? <p className="admin-feedback" data-tone="info">{t('正在检查已保存 token...', 'Checking stored token...')}</p> : null}
          {authStatus === 'locked' && authMessage ? <p className="admin-feedback" data-tone="warn">{authMessage}</p> : null}
          {authStatus === 'error' ? <p className="admin-feedback" data-tone="error">{authMessage}</p> : null}
        </section>
      ) : null}

      {ready && mode === 'overview' ? (
        <section className="admin-overview-grid">
          <article>
            <p className="admin-projects-kicker">Gate</p>
            <h3>{t('门禁已通过', 'Gate verified')}</h3>
            <p>{t('你可以进入 /admin/projects 执行列表、编辑、同步流程。', 'You can open /admin/projects for list, edit and sync.')}</p>
            <Link className="admin-primary-button inline" to="/admin/projects" search={DEFAULT_ADMIN_PROJECTS_SEARCH_STATE}>{t('进入项目管理', 'Open Projects Admin')}</Link>
          </article>
        </section>
      ) : null}

      {ready && mode === 'projects' ? (
        <section className="admin-projects-workspace">
          <aside className="admin-projects-list-panel">
            <h2>{t('项目列表', 'Projects List')}</h2>
            <div className="admin-projects-controls">
              <label>Query<input type="search" value={currentSearch.q} onChange={(event) => patchSearch({ q: event.target.value, page: 1 })} /></label>
              <label>Stage<select value={currentSearch.stage} onChange={(event) => patchSearch({ stage: event.target.value, page: 1 })}><option value="">All</option>{STAGES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label>Visibility<select value={currentSearch.visibility} onChange={(event) => patchSearch({ visibility: event.target.value, page: 1 })}><option value="">All</option>{VISIBILITY.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label>Page Size<select value={String(currentSearch.pageSize)} onChange={(event) => patchSearch({ pageSize: Number(event.target.value), page: 1 })}><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option></select></label>
            </div>
            <div className="admin-list-actions">
              <button className="admin-secondary-button" type="button" onClick={resetFilters}>{t('重置筛选', 'Reset Filters')}</button>
              <button className="admin-secondary-button" type="button" onClick={() => setListNonce((prev) => prev + 1)}>{t('刷新', 'Refresh')}</button>
            </div>

            {listStatus === 'loading' ? <div className="admin-state-card">{t('加载中...', 'Loading...')}</div> : null}
            {listStatus === 'error' ? <div className="admin-state-card admin-state-error"><p>{listMessage}</p><button className="admin-primary-button" type="button" onClick={() => setListNonce((prev) => prev + 1)}>{t('重试', 'Retry')}</button></div> : null}
            {listStatus === 'empty' ? <div className="admin-state-card"><p>{t('暂无项目。', 'No projects.')}</p><button className="admin-primary-button" type="button" onClick={() => setListNonce((prev) => prev + 1)}>{t('重试', 'Retry')}</button></div> : null}
            {listStatus === 'ready' && filtered.length === 0 ? <div className="admin-state-card"><p>{t('筛选后为空。', 'No results after filters.')}</p><button className="admin-secondary-button" type="button" onClick={resetFilters}>{t('清空筛选', 'Clear Filters')}</button></div> : null}

            {listStatus === 'ready' && filtered.length > 0 ? (
              <>
                <ul className="admin-projects-list">
                  {paged.map((item) => (
                    <li key={item.id}>
                      <button type="button" className={item.id === selectedId ? 'is-selected' : ''} onClick={() => patchSearch({ projectId: item.id })}>
                        <div>
                          <p className="name">{item.name || item.slug || item.id}</p>
                          <p className="meta">{item.stage || '--'} · {item.project_type || '--'}</p>
                        </div>
                        <span className="pill">{item.visibility || '--'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="admin-pagination">
                  <button className="admin-secondary-button" type="button" disabled={page <= 1} onClick={() => patchSearch({ page: Math.max(1, page - 1) })}>{t('上一页', 'Prev')}</button>
                  <p>{page} / {pages}</p>
                  <button className="admin-secondary-button" type="button" disabled={page >= pages} onClick={() => patchSearch({ page: Math.min(pages, page + 1) })}>{t('下一页', 'Next')}</button>
                </div>
                <p className="admin-list-summary">{t(`后端 ${backendTotal} 条，筛选后 ${filtered.length} 条。`, `${backendTotal} backend, ${filtered.length} filtered.`)}</p>
              </>
            ) : null}
          </aside>

          <section className="admin-projects-detail-panel">
            <h2>{t('项目编辑与同步', 'Project Edit & Sync')}</h2>
            {!selectedId ? <div className="admin-state-card">{t('请选择项目。', 'Select a project.')}</div> : null}
            {selectedId && detailStatus === 'loading' ? <div className="admin-state-card">{t('详情加载中...', 'Loading detail...')}</div> : null}
            {selectedId && detailStatus === 'error' ? <div className="admin-state-card admin-state-error"><p>{detailMessage}</p><button className="admin-primary-button" type="button" onClick={() => void loadDetail(selectedId)}>{t('重试详情', 'Retry detail')}</button></div> : null}

            {selectedId && detailStatus === 'ready' && form && detailProject ? (
              <form className="admin-editor-form" onSubmit={(event) => { event.preventDefault(); void saveProject() }}>
                <div className="admin-editor-grid two-col">
                  <label>ID<input type="text" value={detailProject.id} readOnly /></label>
                  <label>slug<input type="text" value={form.slug} onChange={(event) => setForm((prev) => (prev ? { ...prev, slug: event.target.value } : prev))} /></label>
                </div>
                <label>Name<input type="text" value={form.name} onChange={(event) => setForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))} /></label>
                <label>headline<input type="text" value={form.headline} onChange={(event) => setForm((prev) => (prev ? { ...prev, headline: event.target.value } : prev))} /></label>
                <label>summary<textarea rows={3} value={form.summary} onChange={(event) => setForm((prev) => (prev ? { ...prev, summary: event.target.value } : prev))} /></label>
                <label>overview<textarea rows={4} value={form.overview} onChange={(event) => setForm((prev) => (prev ? { ...prev, overview: event.target.value } : prev))} /></label>
                <label>status_note<textarea rows={2} value={form.status_note} onChange={(event) => setForm((prev) => (prev ? { ...prev, status_note: event.target.value } : prev))} /></label>

                <div className="admin-editor-grid three-col">
                  <label>stage<select value={form.stage} onChange={(event) => setForm((prev) => (prev ? { ...prev, stage: event.target.value } : prev))}><option value="">--</option>{STAGES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                  <label>project_type<select value={form.project_type} onChange={(event) => setForm((prev) => (prev ? { ...prev, project_type: event.target.value } : prev))}><option value="">--</option>{PROJECT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                  <label>visibility<select value={form.visibility} onChange={(event) => setForm((prev) => (prev ? { ...prev, visibility: event.target.value } : prev))}><option value="">--</option>{VISIBILITY.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                </div>

                <div className="admin-editor-grid three-col">
                  <label>featured_rank<input type="number" value={form.featured_rank} onChange={(event) => setForm((prev) => (prev ? { ...prev, featured_rank: event.target.value } : prev))} /></label>
                  <label>sort_order<input type="number" value={form.sort_order} onChange={(event) => setForm((prev) => (prev ? { ...prev, sort_order: event.target.value } : prev))} /></label>
                  <label>accent<input type="text" value={form.accent} onChange={(event) => setForm((prev) => (prev ? { ...prev, accent: event.target.value } : prev))} /></label>
                </div>

                <label className="admin-checkbox-row"><input type="checkbox" checked={form.is_featured} onChange={(event) => setForm((prev) => (prev ? { ...prev, is_featured: event.target.checked } : prev))} /><span>is_featured</span></label>
                <div className="admin-editor-actions">
                  <button className="admin-primary-button" type="submit" disabled={saveState.status === 'running' || syncState.status === 'running'}>{saveState.status === 'running' ? t('保存中...', 'Saving...') : t('保存变更', 'Save')}</button>
                  <button className="admin-secondary-button" type="button" disabled={saveState.status === 'running' || syncState.status === 'running'} onClick={() => void syncProject()}>{syncState.status === 'running' ? t('同步中...', 'Syncing...') : t('同步仓库', 'Sync Repositories')}</button>
                </div>
                {saveState.status !== 'idle' && saveState.message ? <p className="admin-feedback" data-tone={saveState.status === 'success' ? 'success' : saveState.status === 'error' ? 'error' : 'info'}>{saveState.message}</p> : null}
                {syncState.status !== 'idle' && syncState.message ? <p className="admin-feedback" data-tone={syncState.status === 'success' ? 'success' : syncState.status === 'error' ? 'error' : 'info'}>{syncState.message}</p> : null}
                <p className="admin-detail-meta">{t('上次同步：', 'Synced: ')} {formatTime(detailProject.synced_at)}</p>
                <p className="admin-detail-meta">{t('最后更新：', 'Updated: ')} {formatTime(detailProject.updated_at)}</p>
              </form>
            ) : null}
          </section>
        </section>
      ) : null}
    </main>
  )
}



import { Link } from '@tanstack/react-router'
import * as React from 'react'
import {
  AdminProjectsApiError,
  type AdminProjectErrorCode,
  type AdminProjectRecord,
  type CreateAdminProjectInput,
  createAdminProject,
  deleteAdminProjectById,
  fetchAdminProjectById,
  fetchAdminProjects,
  updateAdminProjectById,
  verifyAdminToken,
} from '~/lib/api/adminProjectsApi'
import { useDocumentMetadata, useUiLocale } from '~/lib/uiLocale'
import {
  DEFAULT_ADMIN_PROJECTS_SEARCH_STATE,
  normalizeAdminProjectsSearchState,
  type AdminProjectsSearchState,
} from './adminProjectsSearch'
import { DEFAULT_ADMIN_PROJECT_SYNC_SEARCH_STATE } from './adminProjectSyncSearch'
import { AdminConsoleFrame } from './AdminConsoleFrame'

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

interface CreateFormState {
  project_key: string
  slug: string
  name: string
  summary: string
  stage: string
  project_type: string
  visibility: string
  sort_order: string
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
    featured_rank: form.is_featured ? asNullableNumber(form.featured_rank) : null,
    sort_order: asNullableNumber(form.sort_order),
    accent: form.accent.trim() || null,
  }
}

const DEFAULT_CREATE_FORM: CreateFormState = {
  project_key: '',
  slug: '',
  name: '',
  summary: '',
  stage: 'active',
  project_type: 'tooling',
  visibility: 'public',
  sort_order: '100',
}

function toCreatePayload(form: CreateFormState): CreateAdminProjectInput | null {
  const projectKey = form.project_key.trim()
  const slug = form.slug.trim()
  const name = form.name.trim()
  const summary = form.summary.trim()
  const stage = form.stage.trim().toLowerCase()
  const projectType = form.project_type.trim().toLowerCase()
  const visibility = form.visibility.trim().toLowerCase()
  const sortOrder = Number(form.sort_order.trim())

  if (!projectKey || !slug || !name || !summary || !stage || !projectType || !visibility || !Number.isFinite(sortOrder)) {
    return null
  }

  return {
    project_key: projectKey,
    slug,
    name,
    summary,
    stage,
    project_type: projectType,
    visibility,
    sort_order: Math.round(sortOrder),
  }
}

function formatTime(value: string | null): string {
  if (!value) return '--'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '--'
  return parsed.toLocaleString('zh-CN', { hour12: false })
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

interface CreateRequestDiagnostic {
  requestUrl: string
  method: string
  code: AdminProjectErrorCode
  status: number | null
  phase: string
  preflightHint: string
}

function readCreateDiagnostic(error: unknown): CreateRequestDiagnostic | null {
  if (!(error instanceof AdminProjectsApiError)) {
    return null
  }

  const details = toRecord(error.details)
  const statusFromDetails = toFiniteNumber(details?.status)
  const phaseFromDetails = toText(details?.phase)

  return {
    requestUrl: toText(details?.request_url),
    method: toText(details?.method).toUpperCase() || 'POST',
    code: error.code,
    status: typeof error.status === 'number' ? error.status : statusFromDetails,
    phase: phaseFromDetails || (error.code === 'network_failed' ? 'preflight_or_network' : error.code === 'request_timeout' ? 'timeout' : 'unknown'),
    preflightHint: toText(details?.preflight_hint),
  }
}

function formatCreateDiagnostic(diagnostic: CreateRequestDiagnostic | null, fallbackCode: AdminProjectErrorCode): string {
  const requestUrl = diagnostic?.requestUrl || '/admin/projects'
  const code = diagnostic?.code || fallbackCode
  const status = typeof diagnostic?.status === 'number' ? String(diagnostic.status) : '--'
  const method = diagnostic?.method || 'POST'
  const phase = diagnostic?.phase || 'unknown'
  const hint = diagnostic?.preflightHint

  const summary = ['URL=' + requestUrl, 'code=' + code, 'HTTP=' + status, 'method=' + method, 'phase=' + phase]
  if (hint) {
    summary.push('hint=' + hint)
  }

  return summary.join(' | ')
}

function errorMessage(error: unknown): { code: AdminProjectErrorCode; message: string } {
  if (error instanceof AdminProjectsApiError) {
    if (error.code === 'unauthorized') return { code: 'unauthorized', message: 'Admin Token 无效或过期，请重新验证。' }
    if (error.code === 'project_not_found') return { code: error.code, message: '未找到该项目，请刷新列表后重试。' }
    if (error.code === 'validation_failed') return { code: error.code, message: '\u8bf7\u6c42\u53c2\u6570\u6821\u9a8c\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u5fc5\u586b\u9879\u3002' }
    if (error.code === 'request_timeout') return { code: error.code, message: '\u8bf7\u6c42\u8d85\u65f6\uff0c\u53ef\u80fd\u5df2\u53d7\u7406\u3002\u7cfb\u7edf\u5c06\u81ea\u52a8\u56de\u67e5\u521b\u5efa\u7ed3\u679c\u3002' }
    if (error.code === 'network_failed') return { code: error.code, message: '\u7f51\u7edc\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5 API_BASE\u3001CORS \u6216\u670d\u52a1\u53ef\u8fbe\u6027\u540e\u91cd\u8bd5\u3002' }
    if (error.code === 'project_slug_conflict') return { code: error.code, message: 'Slug 冲突，请更换后保存。' }
    if (error.code === 'invalid_stage') return { code: error.code, message: 'stage 不合法，请按协议填写。' }
    if (error.code === 'invalid_project_type') return { code: error.code, message: 'project_type 不合法，请按协议填写。' }
    if (error.code === 'invalid_visibility') return { code: error.code, message: 'visibility 不合法，请按协议填写。' }
    if (error.code === 'repository_conflict') return { code: error.code, message: '仓库绑定冲突，请检查后重试。' }
    if (error.code === 'sync_failed') return { code: error.code, message: '同步失败，请稍后重试。' }
    if (error.code === 'sync_rate_limited') return { code: error.code, message: 'GitHub 配额限流，请稍后再试。' }
    if (error.code === 'invalid_link_type') return { code: error.code, message: '链接类型不合法，请检查后重试。' }
    if (toText(error.message).toLowerCase().includes('failed to fetch')) return { code: 'network_failed', message: '\u7f51\u7edc\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5 API_BASE\u3001CORS \u6216\u670d\u52a1\u53ef\u8fbe\u6027\u540e\u91cd\u8bd5\u3002' }
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
  const [searchInput, setSearchInput] = React.useState(currentSearch.q)

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
  const [deleteState, setDeleteState] = React.useState<OperationState>({ status: 'idle', message: '' })
  const [createForm, setCreateForm] = React.useState<CreateFormState>(DEFAULT_CREATE_FORM)
  const [createState, setCreateState] = React.useState<OperationState>({ status: 'idle', message: '' })
  const [deleteTarget, setDeleteTarget] = React.useState<AdminProjectRecord | null>(null)

  useDocumentMetadata(
    mode === 'projects'
      ? t('Admin \u00b7 \u9879\u76ee\u7ba1\u7406 | lambertlab', 'Admin \u00b7 Projects | lambertlab')
      : t('Admin \u00b7 Overview | lambertlab', 'Admin \u00b7 Overview | lambertlab'),
    mode === 'projects'
      ? t('Projects \u540e\u53f0\u7ba1\u7406\uff1a\u5217\u8868\u3001\u521b\u5efa\u3001\u7f16\u8f91\uff1b\u540c\u6b65\u5728 Projects \u5b50\u9875\u4e2d\u5904\u7406\u3002', 'Projects admin: list, create, edit; sync stays inside the Projects subpage.')
      : t('Admin overview \u5165\u53e3\uff0c\u9700 token \u9a8c\u8bc1\u3002', 'Admin overview entry with token gate.'),
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
      setDeleteState({ status: 'idle', message: '' })
      setDeleteTarget(null)
      setCreateState({ status: 'idle', message: '' })
      setCreateForm(DEFAULT_CREATE_FORM)
      if (mode === 'projects') {
        patchSearch({ projectId: '', page: 1, panel: 'closed' })
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
          patchSearch({ projectId: '', page: 1, panel: 'closed' })
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

  React.useEffect(() => {
    setSearchInput(currentSearch.q)
  }, [currentSearch.q])

  const commitSearchInput = React.useCallback(
    (value: string) => {
      if (value === currentSearch.q) return
      patchSearch({ q: value, page: 1 })
    },
    [currentSearch.q, patchSearch],
  )

  React.useEffect(() => {
    if (mode !== 'projects') return
    if (searchInput === currentSearch.q) return

    const timer = window.setTimeout(() => {
      commitSearchInput(searchInput)
    }, 400)

    return () => window.clearTimeout(timer)
  }, [commitSearchInput, currentSearch.q, mode, searchInput])

  const filtered = React.useMemo(() => {
    const q = searchInput.trim().toLowerCase()

    return projects.filter((project) => {
      if (!q) return true
      const content = [project.name, project.slug, project.headline, project.summary].join(' ').toLowerCase()
      return content.includes(q)
    })
  }, [projects, searchInput])

  const visibleProjects = filtered
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

  const createProject = React.useCallback(async () => {
    if (!token) return

    const payload = toCreatePayload(createForm)
    if (!payload) {
      setCreateState({ status: 'error', message: t('\u8bf7\u586b\u5199\u5fc5\u586b\u5b57\u6bb5\uff0c\u5e76\u786e\u4fdd sort_order \u4e3a\u6570\u5b57\u3002', 'Please fill required fields and ensure sort_order is numeric.') })
      return
    }

    const commitCreated = (created: AdminProjectRecord, successMessage?: string) => {
      const name = created.name || created.slug || created.id

      setCreateState({ status: 'success', message: successMessage || t('\u521b\u5efa\u6210\u529f\uff1a' + name, 'Created: ' + name) })
      setCreateForm((prev) => ({
        ...DEFAULT_CREATE_FORM,
        stage: prev.stage,
        project_type: prev.project_type,
        visibility: prev.visibility,
        sort_order: prev.sort_order,
      }))

      setListStatus('ready')
      setProjects((prev) => [created, ...prev.filter((item) => item.id !== created.id)])
      setBackendTotal((prev) => prev + 1)
      setDetailProject(created)
      setForm(toForm(created))
      setDetailStatus('ready')
      setDetailMessage('')
      setSearchInput('')

      patchSearch({
        q: '',
        stage: '',
        visibility: '',
        page: 1,
        projectId: created.id,
        panel: 'closed',
      })
      setListNonce((prev) => prev + 1)
    }

    setCreateState({ status: 'running', message: t('\u6b63\u5728\u521b\u5efa\u9879\u76ee...', 'Creating project...') })

    try {
      const created = await createAdminProject(token, payload)
      commitCreated(created)
    } catch (error) {
      const mapped = errorMessage(error)
      if (mapped.code === 'unauthorized') {
        invalidate(mapped.message)
        return
      }

      const diagnostic = readCreateDiagnostic(error)
      const diagnosticMessage = formatCreateDiagnostic(diagnostic, mapped.code)
      const shouldProbe = mapped.code === 'request_timeout' || mapped.code === 'network_failed' || diagnostic?.phase === 'main_response_parse'
      if (!shouldProbe) {
        setCreateState({
          status: 'error',
          message: mapped.message + t('；诊断：', ' | Diagnostic: ') + diagnosticMessage,
        })
        return
      }

      setCreateState({ status: 'running', message: t('\u8bf7\u6c42\u672a\u786e\u8ba4\uff0c\u6b63\u5728\u56de\u67e5\u9879\u76ee\u5217\u8868...', 'Request not confirmed. Re-checking project list...') })

      const normalizedSlug = payload.slug.trim().toLowerCase()
      const probeQueries: Array<{ q?: string; page: number; page_size: number }> = [
        { q: payload.slug, page: 1, page_size: 100 },
        { page: 1, page_size: 200 },
      ]

      if (payload.project_key.trim().toLowerCase() !== normalizedSlug) {
        probeQueries.splice(1, 0, { q: payload.project_key, page: 1, page_size: 100 })
      }

      let recovered: AdminProjectRecord | null = null

      for (let attempt = 0; attempt < 4 && !recovered; attempt += 1) {
        for (const query of probeQueries) {
          try {
            const probe = await fetchAdminProjects(token, query)
            recovered = probe.projects.find((item) => item.slug.trim().toLowerCase() === normalizedSlug) ?? null
            if (recovered) {
              break
            }
          } catch (probeError) {
            const probeMapped = errorMessage(probeError)
            if (probeMapped.code === 'unauthorized') {
              invalidate(probeMapped.message)
              return
            }
          }
        }

        if (!recovered && attempt < 3) {
          await sleep(700 + attempt * 500)
        }
      }

      if (recovered) {
        const name = recovered.name || recovered.slug || recovered.id
        commitCreated(recovered, t('\u8bf7\u6c42\u4e2d\u65ad\u4f46\u9879\u76ee\u5df2\u521b\u5efa\uff1a' + name, 'Request interrupted but project was created: ' + name))
        return
      }

      setCreateState({
        status: 'error',
        message:
          t('\u521b\u5efa\u8bf7\u6c42\u672a\u6210\u529f\u8fd4\u56de\uff0c\u4e14\u56de\u67e5\u672a\u53d1\u73b0\u65b0\u9879\u76ee\u3002\u8bf7\u68c0\u67e5 API_BASE\u3001CORS \u6216\u7f51\u7edc\u8fde\u63a5\u540e\u91cd\u8bd5\u3002', 'Create request did not return successfully and probe found no new project. Check API_BASE/CORS/network and retry.') +
          t('；诊断：', ' | Diagnostic: ') +
          diagnosticMessage,
      })
    }
  }, [createForm, invalidate, patchSearch, t, token])

  const saveProject = React.useCallback(async () => {
    if (!token || !selectedId || !form) return

    setSaveState({ status: 'running', message: t('正在保存变更...', 'Saving changes...') })
    try {
      const updated = await updateAdminProjectById(token, selectedId, toPayload(form))
      setSaveState({ status: 'success', message: t('保存成功。', 'Saved.') })
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


  const deleteProjectByRecord = React.useCallback(async (project: AdminProjectRecord) => {
    if (!token) return

    const projectId = project.id
    const projectName = project.name || project.slug || project.id

    setDeleteState({ status: 'running', message: t('\u6b63\u5728\u5220\u9664\u9879\u76ee...', 'Deleting project...') })
    try {
      await deleteAdminProjectById(token, projectId)
      const remainingProjects = projects.filter((item) => item.id !== projectId)
      const nextSelectedId = selectedId === projectId ? remainingProjects[0]?.id || '' : selectedId

      setProjects(remainingProjects)
      setBackendTotal((prev) => Math.max(0, prev - 1))
      setSaveState({ status: 'idle', message: '' })
      setDeleteState({ status: 'success', message: t(`\u5df2\u5220\u9664\uff1a${projectName}`, `Deleted: ${projectName}`) })
      setDeleteTarget(null)

      if (selectedId === projectId) {
        setDetailProject(null)
        setForm(null)
        setDetailMessage('')
        setDetailStatus('idle')
      }

      if (remainingProjects.length === 0) {
        setListStatus('empty')
        patchSearch({ projectId: '', page: 1, panel: 'closed' })
        return
      }

      setListStatus('ready')
      patchSearch({ projectId: nextSelectedId, page: 1, panel: 'closed' })
    } catch (error) {
      const mapped = errorMessage(error)
      if (mapped.code === 'unauthorized') {
        invalidate(mapped.message)
        return
      }
      setDeleteState({ status: 'error', message: mapped.message })
    }
  }, [invalidate, patchSearch, projects, selectedId, t, token])

  const ready = authStatus === 'ready'
  const panel = currentSearch.panel
  const selectedProjectName = detailProject?.name || detailProject?.slug || detailProject?.id || ''
  const createModalOpen = ready && mode === 'projects' && panel === 'create'
  const editModalOpen = ready && mode === 'projects' && panel === 'edit'
  const deleteModalOpen = ready && mode === 'projects' && deleteTarget !== null
  const deleteTargetName = deleteTarget?.name || deleteTarget?.slug || deleteTarget?.id || ''
  const surfaceFeedback = !createModalOpen && !editModalOpen && !deleteModalOpen ? createState.message || deleteState.message : ''
  const surfaceFeedbackTone = createState.message
    ? createState.status === 'error'
      ? 'error'
      : createState.status === 'success'
        ? 'success'
        : 'info'
    : deleteState.status === 'error'
      ? 'error'
      : deleteState.status === 'success'
        ? 'success'
        : 'info'

  const resetFilters = () => {
    setSearchInput('')
    patchSearch({
      q: '',
      stage: '',
      visibility: '',
      page: 1,
      pageSize: DEFAULT_ADMIN_PROJECTS_SEARCH_STATE.pageSize,
    })
  }

  const closePanel = () => {
    patchSearch({ panel: 'closed' })
  }

  const closeDeleteModal = () => {
    if (deleteState.status === 'running') return
    setDeleteTarget(null)
    if (deleteState.status !== 'success') {
      setDeleteState({ status: 'idle', message: '' })
    }
  }

  const openCreatePanel = () => {
    setCreateState({ status: 'idle', message: '' })
    patchSearch({ panel: 'create' })
  }

  const openEditPanel = (projectId: string) => {
    setSaveState({ status: 'idle', message: '' })
    patchSearch({ projectId, panel: 'edit' })
  }

  const openDeleteModal = (project: AdminProjectRecord) => {
    setDeleteState({ status: 'idle', message: '' })
    setDeleteTarget(project)
  }


  return (
    <AdminConsoleFrame mode={mode === 'overview' ? 'overview' : 'projects'}>
      {!ready ? (
        <section className="admin-auth-card" aria-live="polite">
          <h2>{t('Admin Token \u6821\u9a8c', 'Admin Token Verification')}</h2>
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
                {authStatus === 'checking' || authStatus === 'verifying' ? t('\u6821\u9a8c\u4e2d...', 'Verifying...') : t('\u9a8c\u8bc1 Token', 'Verify Token')}
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
                {t('\u6e05\u7a7a', 'Clear')}
              </button>
            </div>
          </form>
          {authStatus === 'checking' ? <p className="admin-feedback" data-tone="info">{t('\u6b63\u5728\u68c0\u67e5\u5df2\u4fdd\u5b58 token...', 'Checking stored token...')}</p> : null}
          {authStatus === 'locked' && authMessage ? <p className="admin-feedback" data-tone="warn">{authMessage}</p> : null}
          {authStatus === 'error' ? <p className="admin-feedback" data-tone="error">{authMessage}</p> : null}
        </section>
      ) : null}

      {ready && mode === 'overview' ? (
        <section className="admin-overview-grid">
          <article>
            <p className="admin-projects-kicker">Gate</p>
            <h3>{t('\u95e8\u7981\u5df2\u901a\u8fc7', 'Gate verified')}</h3>
            <p>{t('\u4f60\u53ef\u4ee5\u8fdb\u5165 /admin/projects \u6267\u884c\u9879\u76ee\u5217\u8868\u4e0e\u7ba1\u7406\u3002', 'Use /admin/projects for the project list and management.')}</p>
            <Link className="admin-primary-button inline" to="/admin/projects" search={DEFAULT_ADMIN_PROJECTS_SEARCH_STATE}>{t('\u8fdb\u5165\u9879\u76ee\u7ba1\u7406', 'Open Projects Admin')}</Link>
          </article>
        </section>
      ) : null}

      {ready && mode === 'projects' ? (
        <section className="admin-projects-workspace admin-projects-workspace--catalog">
          <section className="admin-projects-list-panel admin-projects-board">
            <div className="admin-section-head admin-section-head--projects">
              <div>
                <h2>{t('Project List', 'Project List')}</h2>
              </div>
              <div className="admin-section-head__actions">
                <button className="admin-primary-button" type="button" onClick={openCreatePanel}>
                  {t('\u65b0\u5efa\u9879\u76ee', 'New Project')}
                </button>
                <Link className="admin-primary-button" to="/admin/sync" search={DEFAULT_ADMIN_PROJECT_SYNC_SEARCH_STATE}>
                  {t('\u5bfc\u5165 Github Repo', 'Import Github Repo')}
                </Link>
              </div>
            </div>

            <div className="admin-projects-toolbar admin-projects-toolbar--single">
              <label className="admin-search-field admin-search-field--projects">
                <input
                  aria-label={t('\u641c\u7d22\u9879\u76ee', 'Search projects')}
                  type="search"
                  value={searchInput}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setSearchInput(nextValue)
                    if (nextValue === '') {
                      commitSearchInput('')
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return
                    event.preventDefault()
                    commitSearchInput(searchInput)
                  }}
                  onBlur={() => commitSearchInput(searchInput)}
                  placeholder={t('Search projects...', 'Search projects...')}
                />
              </label>
            </div>

            {listStatus === 'loading' ? <div className="admin-state-card">{t('\u52a0\u8f7d\u4e2d...', 'Loading...')}</div> : null}
            {listStatus === 'error' ? <div className="admin-state-card admin-state-error"><p>{listMessage}</p><button className="admin-primary-button" type="button" onClick={() => setListNonce((prev) => prev + 1)}>{t('\u91cd\u8bd5', 'Retry')}</button></div> : null}
            {listStatus === 'empty' ? (
              <div className="admin-state-card">
                <p>{t('\u5f53\u524d\u6ca1\u6709\u9879\u76ee\u3002\u4f60\u53ef\u4ee5\u5148\u65b0\u5efa\u9879\u76ee\uff0c\u6216\u5bfc\u5165 GitHub Repo\u3002', 'There are no projects yet. Create one first, or import a GitHub repository.')}</p>
                <div className="admin-list-actions">
                  <button className="admin-primary-button" type="button" onClick={openCreatePanel}>{t('\u521b\u5efa\u9996\u4e2a\u9879\u76ee', 'Create First Project')}</button>
                  <Link className="admin-primary-button" to="/admin/sync" search={DEFAULT_ADMIN_PROJECT_SYNC_SEARCH_STATE}>{t('\u5bfc\u5165 Github Repo', 'Import Github Repo')}</Link>
                </div>
              </div>
            ) : null}
            {listStatus === 'ready' && filtered.length === 0 ? <div className="admin-state-card"><p>{t('\u6ca1\u6709\u5339\u914d\u7684\u9879\u76ee\u3002', 'No matching projects.')}</p><button className="admin-secondary-button" type="button" onClick={resetFilters}>{t('\u6e05\u7a7a\u7b5b\u9009', 'Clear Filters')}</button></div> : null}
            {surfaceFeedback ? <div className="admin-surface-feedback"><p className="admin-feedback" data-tone={surfaceFeedbackTone}>{surfaceFeedback}</p></div> : null}

            {listStatus === 'ready' && filtered.length > 0 ? (
              <>
                <div className="admin-projects-table-head admin-projects-table-head--projects" aria-hidden="true">
                  <span>{t('Name', 'Name')}</span>
                  <span>{t('Status', 'Status')}</span>
                  <span>{t('Last Updated', 'Last Updated')}</span>
                  <span>{t('Actions', 'Actions')}</span>
                </div>
                <ul className="admin-projects-list admin-projects-table">
                  {visibleProjects.map((item) => (
                    <li key={item.id}>
                      <div className="admin-project-row">
                        <div className="admin-project-row__identity">
                          <p className="name">{item.name || item.slug || item.id}</p>
                        </div>
                        <p className="admin-project-row__stage" data-stage={item.stage || 'unknown'}>{item.stage || '--'}</p>
                        <p className="admin-project-row__updated">{formatTime(item.updated_at)}</p>
                        <div className="admin-project-row__actions">
                          <button className="admin-secondary-button" type="button" onClick={() => openEditPanel(item.id)}>{t('\u7f16\u8f91', 'Edit')}</button>
                          <button className="admin-danger-button" type="button" onClick={() => openDeleteModal(item)}>{t('\u5220\u9664', 'Delete')}</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        </section>
      ) : null}

      {createModalOpen ? (
        <div className="admin-project-modal-backdrop" onClick={closePanel}>
          <section className="admin-projects-detail-panel admin-project-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="admin-project-modal__head">
              <div className="admin-project-modal__titleblock">
                <h2>{t('\u521b\u5efa\u9879\u76ee', 'Create Project')}</h2>
                <p className="admin-project-modal__project-name">{t('\u65b0\u9879\u76ee', 'New project')}</p>
              </div>
              <button className="admin-modal-close" type="button" onClick={closePanel} aria-label={t('\u5173\u95ed', 'Close')}>{'\u00d7'}</button>
            </div>

            <form className="admin-project-modal__content" onSubmit={(event) => { event.preventDefault(); void createProject() }}>
              <div className="admin-project-modal__body admin-editor-form admin-editor-form--modal">
                <div className="admin-editor-grid two-col">
                  <label>project_key<input type="text" value={createForm.project_key} onChange={(event) => setCreateForm((prev) => ({ ...prev, project_key: event.target.value }))} placeholder="my-first-project" /></label>
                  <label>slug<input type="text" value={createForm.slug} onChange={(event) => setCreateForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="my-first-project" /></label>
                </div>
                <label>name<input type="text" value={createForm.name} onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="My First Project" /></label>
                <label>summary<textarea value={createForm.summary} onChange={(event) => setCreateForm((prev) => ({ ...prev, summary: event.target.value }))} placeholder={t('\u4e00\u53e5\u8bdd\u6982\u8ff0', 'One-line summary')} /></label>
                <div className="admin-editor-grid three-col">
                  <label>stage<select value={createForm.stage} onChange={(event) => setCreateForm((prev) => ({ ...prev, stage: event.target.value }))}>{STAGES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                  <label>project_type<select value={createForm.project_type} onChange={(event) => setCreateForm((prev) => ({ ...prev, project_type: event.target.value }))}>{PROJECT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                  <label>visibility<select value={createForm.visibility} onChange={(event) => setCreateForm((prev) => ({ ...prev, visibility: event.target.value }))}>{VISIBILITY.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                </div>
                <label>sort_order<input type="number" value={createForm.sort_order} onChange={(event) => setCreateForm((prev) => ({ ...prev, sort_order: event.target.value }))} /></label>
                {createState.message ? <p className="admin-feedback" data-tone={createState.status === 'success' ? 'success' : createState.status === 'error' ? 'error' : 'info'}>{createState.message}</p> : null}
              </div>
              <div className="admin-project-modal__footer">
                <button className="admin-primary-button" type="submit" disabled={createState.status === 'running'}>{createState.status === 'running' ? t('\u521b\u5efa\u4e2d...', 'Creating...') : t('\u521b\u5efa\u9879\u76ee', 'Create Project')}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {editModalOpen ? (
        <div className="admin-project-modal-backdrop" onClick={closePanel}>
          <section className="admin-projects-detail-panel admin-project-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="admin-project-modal__head">
              <div className="admin-project-modal__titleblock">
                <h2>{t('\u7f16\u8f91\u9879\u76ee', 'Edit Project')}</h2>
                <p className="admin-project-modal__project-name">{selectedProjectName || selectedId || '--'}</p>
              </div>
              <button className="admin-modal-close" type="button" onClick={closePanel} aria-label={t('\u5173\u95ed', 'Close')}>{'\u00d7'}</button>
            </div>

            {!selectedId ? (
              <div className="admin-project-modal__content">
                <div className="admin-project-modal__body">
                  <div className="admin-state-card"><p>{t('\u8bf7\u5148\u9009\u62e9\u4e00\u4e2a\u9879\u76ee\u3002', 'Select a project first.')}</p></div>
                </div>
              </div>
            ) : null}
            {selectedId && detailStatus === 'loading' ? (
              <div className="admin-project-modal__content">
                <div className="admin-project-modal__body">
                  <div className="admin-state-card"><p>{t('\u6b63\u5728\u52a0\u8f7d\u9879\u76ee\u8be6\u60c5...', 'Loading detail...')}</p></div>
                </div>
              </div>
            ) : null}
            {selectedId && detailStatus === 'error' ? (
              <div className="admin-project-modal__content">
                <div className="admin-project-modal__body">
                  <div className="admin-state-card admin-state-error">
                    <p>{detailMessage}</p>
                    <button className="admin-primary-button" type="button" onClick={() => void loadDetail(selectedId)}>{t('\u91cd\u8bd5\u52a0\u8f7d', 'Retry detail')}</button>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedId && detailStatus === 'ready' && form && detailProject ? (
              <form className="admin-project-modal__content" onSubmit={(event) => { event.preventDefault(); void saveProject() }}>
                <div className="admin-project-modal__body admin-editor-form admin-editor-form--modal">
                  <div className="admin-editor-grid two-col">
                    <label>ID<input type="text" value={detailProject.id} readOnly /></label>
                    <label>slug<input type="text" value={form.slug} onChange={(event) => setForm((prev) => (prev ? { ...prev, slug: event.target.value } : prev))} /></label>
                  </div>
                  <label>Name<input type="text" value={form.name} onChange={(event) => setForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))} /></label>
                  <label>headline<input type="text" value={form.headline} onChange={(event) => setForm((prev) => (prev ? { ...prev, headline: event.target.value } : prev))} /></label>
                  <label>summary<textarea value={form.summary} onChange={(event) => setForm((prev) => (prev ? { ...prev, summary: event.target.value } : prev))} /></label>
                  <label>overview<textarea value={form.overview} onChange={(event) => setForm((prev) => (prev ? { ...prev, overview: event.target.value } : prev))} /></label>
                  <label>status_note<textarea value={form.status_note} onChange={(event) => setForm((prev) => (prev ? { ...prev, status_note: event.target.value } : prev))} /></label>

                  <div className="admin-editor-grid three-col">
                    <label>stage<select value={form.stage} onChange={(event) => setForm((prev) => (prev ? { ...prev, stage: event.target.value } : prev))}><option value="">--</option>{STAGES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                    <label>project_type<select value={form.project_type} onChange={(event) => setForm((prev) => (prev ? { ...prev, project_type: event.target.value } : prev))}><option value="">--</option>{PROJECT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                    <label>visibility<select value={form.visibility} onChange={(event) => setForm((prev) => (prev ? { ...prev, visibility: event.target.value } : prev))}><option value="">--</option>{VISIBILITY.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                  </div>

                  <div className="admin-editor-grid two-col">
                    <label>sort_order<input type="number" value={form.sort_order} onChange={(event) => setForm((prev) => (prev ? { ...prev, sort_order: event.target.value } : prev))} /></label>
                    <label>accent<input type="text" value={form.accent} onChange={(event) => setForm((prev) => (prev ? { ...prev, accent: event.target.value } : prev))} /></label>
                  </div>

                  <label className="admin-checkbox-row"><input type="checkbox" checked={form.is_featured} onChange={(event) => setForm((prev) => (prev ? { ...prev, is_featured: event.target.checked, featured_rank: event.target.checked ? prev.featured_rank : '' } : prev))} /><span>is_featured</span></label>
                  {form.is_featured ? <label>featured_rank<input type="number" value={form.featured_rank} onChange={(event) => setForm((prev) => (prev ? { ...prev, featured_rank: event.target.value } : prev))} /></label> : null}
                  {saveState.status !== 'idle' && saveState.message ? <p className="admin-feedback" data-tone={saveState.status === 'success' ? 'success' : saveState.status === 'error' ? 'error' : 'info'}>{saveState.message}</p> : null}
                </div>
                <div className="admin-project-modal__footer">
                  <button className="admin-primary-button" type="submit" disabled={saveState.status === 'running'}>{saveState.status === 'running' ? t('\u4fdd\u5b58\u4e2d...', 'Saving...') : t('\u4fdd\u5b58', 'Save')}</button>
                </div>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}
      {deleteModalOpen ? (
        <div className="admin-project-modal-backdrop" onClick={closeDeleteModal}>
          <section className="admin-projects-detail-panel admin-project-modal admin-confirm-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="admin-project-modal__head">
              <div>
                <h2>{t('Delete Project', 'Delete Project')}</h2>
                <p>{t(`\u786e\u8ba4\u5220\u9664\u9879\u76ee\u300c${deleteTargetName || '--'}\u300d\uff1f`, `Delete project "${deleteTargetName || '--'}"?`)}</p>
              </div>
              <button className="admin-modal-close" type="button" onClick={closeDeleteModal} disabled={deleteState.status === 'running'} aria-label={t('\u5173\u95ed', 'Close')}>{'\u00d7'}</button>
            </div>

            <div className="admin-confirm-copy">
              <p>{t('\u6b64\u64cd\u4f5c\u4e0d\u53ef\u64a4\u9500\uff0c\u9879\u76ee\u8bb0\u5f55\u5c06\u4ece\u5217\u8868\u4e2d\u79fb\u9664\u3002', 'This action cannot be undone and the project record will be removed.')}</p>
            </div>
            {deleteState.status !== 'idle' && deleteState.message ? <p className="admin-feedback" data-tone={deleteState.status === 'error' ? 'error' : deleteState.status === 'success' ? 'success' : 'info'}>{deleteState.message}</p> : null}
            <div className="admin-confirm-modal__actions">
              <button className="admin-secondary-button" type="button" onClick={closeDeleteModal} disabled={deleteState.status === 'running'}>{t('\u53d6\u6d88', 'Cancel')}</button>
              <button className="admin-danger-button" type="button" onClick={() => deleteTarget ? void deleteProjectByRecord(deleteTarget) : undefined} disabled={deleteState.status === 'running'}>
                {deleteState.status === 'running' ? t('\u5220\u9664\u4e2d...', 'Deleting...') : t('\u786e\u8ba4\u5220\u9664', 'Confirm Delete')}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </AdminConsoleFrame>
  )
}

import { Link } from '@tanstack/react-router'
import * as React from 'react'
import { createPortal } from 'react-dom'
import {
  AdminProjectsApiError,
  type AdminProjectErrorCode,
  type AdminProjectLinkedRepositoryRecord,
  type AdminProjectLinksRecord,
  type AdminProjectRecord,
  type AdminProjectRepositoryBindingInput,
  type AdminRepositoryRecord,
  type CreateAdminProjectInput,
  createAdminProject,
  deleteAdminProjectById,
  fetchAdminProjectById,
  fetchAdminProjects,
  fetchAdminRepositories,
  replaceAdminProjectLinks,
  replaceAdminProjectRepositories,
  updateAdminProjectById,
  verifyAdminToken,
} from '~/lib/api/adminProjectsApi'
import { useDocumentMetadata, useUiLocale } from '~/lib/uiLocale'
import {
  DEFAULT_ADMIN_PROJECTS_SEARCH_STATE,
  normalizeAdminProjectsSearchState,
  type AdminProjectsSearchState,
} from './adminProjectsSearch'
import { AdminConsoleFrame } from './AdminConsoleFrame'

const TOKEN_KEY = 'll-admin-token-v1'
const STAGE_OPTIONS = [
  { value: 'building', zh: '建设中', en: 'Building' },
  { value: 'active', zh: '活跃', en: 'Active' },
  { value: 'maintenance', zh: '维护中', en: 'Maintenance' },
  { value: 'research', zh: '研究中', en: 'Research' },
  { value: 'archived', zh: '已归档', en: 'Archived' },
] as const
const PROJECT_TYPE_OPTIONS = [
  { value: 'uncategorized', zh: '暂不分类', en: 'Uncategorized' },
  { value: 'website', zh: '网站', en: 'Website' },
  { value: 'backend', zh: '后端', en: 'Backend' },
  { value: 'tooling', zh: '工具', en: 'Tooling' },
  { value: 'infra', zh: '基础设施', en: 'Infrastructure' },
  { value: 'research', zh: '研究', en: 'Research' },
  { value: 'agent', zh: '智能体', en: 'Agent' },
  { value: 'data', zh: '数据', en: 'Data' },
  { value: 'library', zh: '库', en: 'Library' },
] as const
const VISIBILITY_OPTIONS = [
  { value: 'public', zh: '公开', en: 'Public' },
  { value: 'private', zh: '私有', en: 'Private' },
  { value: 'internal', zh: '内部', en: 'Internal' },
] as const

type ConsoleMode = 'overview' | 'projects'
type AuthStatus = 'checking' | 'locked' | 'verifying' | 'ready' | 'error'
type LoadStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

interface FormState {
  name: string
  summary: string
  overview: string
  status_note: string
  stage: string
  project_type: string
  visibility: string
  is_featured: boolean
  featured_rank: string
  sort_order: string
  repository_full_names: string[]
  primary_repository_full_name: string
  explicit_repo_link: string
}

interface CreateFormState {
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

interface AdminFormSelectOption {
  value: string
  zh: string
  en: string
}

interface AdminFormSelectProps {
  label: React.ReactNode
  options: readonly AdminFormSelectOption[]
  value: string
  onChange: (value: string) => void
  t: (zh: string, en: string) => string
}

interface AdminFormSelectMenuPosition {
  left: number
  top: number
  width: number
  maxHeight: number
}

function AdminFormSelect({ label, options, value, onChange, t }: AdminFormSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [menuPosition, setMenuPosition] = React.useState<AdminFormSelectMenuPosition | null>(null)
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const listboxId = React.useId()
  const selectedOption = options.find((option) => option.value === value) ?? options[0] ?? null
  const currentIndex = Math.max(0, options.findIndex((option) => option.value === value))

  const updateMenuPosition = React.useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const spaceBelow = viewportHeight - rect.bottom - 16
    const spaceAbove = rect.top - 16
    const shouldOpenUpward = spaceBelow < 240 && spaceAbove > spaceBelow
    const maxHeight = Math.max(160, Math.min(320, shouldOpenUpward ? spaceAbove : spaceBelow))
    const width = Math.min(rect.width, viewportWidth - 24)
    const left = Math.min(rect.left, viewportWidth - width - 12)
    const top = shouldOpenUpward ? Math.max(12, rect.top - maxHeight - 8) : Math.min(viewportHeight - maxHeight - 12, rect.bottom + 8)

    setMenuPosition({ left, top, width, maxHeight })
  }, [])

  React.useEffect(() => {
    if (!open) return undefined

    updateMenuPosition()

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node) && !(event.target instanceof Node && document.getElementById(listboxId)?.contains(event.target))) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    const handleViewportChange = () => {
      updateMenuPosition()
    }

    document.addEventListener('mousedown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [listboxId, open, updateMenuPosition])

  const selectIndex = React.useCallback((index: number) => {
    const nextOption = options[index]
    if (!nextOption) return
    onChange(nextOption.value)
    setOpen(false)
  }, [onChange, options])

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      selectIndex(Math.min(currentIndex + 1, options.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      selectIndex(Math.max(currentIndex - 1, 0))
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen((prev) => !prev)
    }
  }

  const menu = open && menuPosition
    ? createPortal(
        <div
          className="admin-custom-select__menu admin-custom-select__menu--floating"
          id={listboxId}
          role="listbox"
          style={{ left: menuPosition.left, top: menuPosition.top, width: menuPosition.width, maxHeight: menuPosition.maxHeight }}
        >
          {options.map((option, index) => {
            const selected = option.value === value
            return (
              <button
                aria-selected={selected}
                className="admin-custom-select__option"
                data-selected={selected ? 'true' : 'false'}
                key={option.value}
                onClick={() => selectIndex(index)}
                role="option"
                type="button"
              >
                <span>{t(option.zh, option.en)}</span>
                {selected ? <span aria-hidden="true" className="admin-custom-select__option-mark" /> : null}
              </button>
            )
          })}
        </div>,
        document.body,
      )
    : null

  return (
    <div className="admin-field admin-custom-select" ref={rootRef}>
      <span className="admin-field-label">{label}</span>
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="admin-custom-select__trigger"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span className="admin-custom-select__value">{selectedOption ? t(selectedOption.zh, selectedOption.en) : ''}</span>
        <span aria-hidden="true" className="admin-custom-select__chevron" />
      </button>
      {menu}
    </div>
  )
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
  const repositoryFullNames = project.repositories.map((repository) => repository.repo_full_name)

  return {
    name: project.name,
    summary: project.summary,
    overview: project.overview,
    status_note: project.status_note ?? '',
    stage: project.stage,
    project_type: project.project_type,
    visibility: project.visibility,
    is_featured: project.is_featured,
    featured_rank: project.featured_rank == null ? '' : String(project.featured_rank),
    sort_order: project.sort_order == null ? '' : String(project.sort_order),
    repository_full_names: repositoryFullNames,
    primary_repository_full_name: resolvePrimaryRepositoryFullName(
      repositoryFullNames,
      project.repositories.find((repository) => repository.is_primary)?.repo_full_name || '',
    ),
    explicit_repo_link: project.stored_links.repo ?? '',
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
    name: form.name.trim(),
    summary: form.summary.trim(),
    overview: form.overview.trim(),
    status_note: form.status_note.trim() || null,
    stage: form.stage.trim().toLowerCase(),
    project_type: form.project_type.trim().toLowerCase(),
    visibility: form.visibility.trim().toLowerCase(),
    is_featured: form.is_featured,
    featured_rank: form.is_featured ? asNullableNumber(form.featured_rank) : null,
    sort_order: asNullableNumber(form.sort_order),
  }
}


function mergeSavedProjectRecord(form: FormState, updated: AdminProjectRecord): AdminProjectRecord {
  const submitted = toPayload(form)
  const isFeatured = updated.is_featured || form.is_featured

  return {
    ...updated,
    is_featured: isFeatured,
    featured_rank: isFeatured ? updated.featured_rank ?? submitted.featured_rank : null,
    sort_order: updated.sort_order ?? submitted.sort_order,
  }
}

function normalizeRepositoryBindingKey(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeComparableLink(value: string | null | undefined): string {
  return (value || '').trim()
}

function resolvePrimaryRepositoryFullName(
  repositoryFullNames: readonly string[],
  primaryRepositoryFullName: string,
): string {
  const normalizedPrimary = normalizeRepositoryBindingKey(primaryRepositoryFullName)
  if (normalizedPrimary) {
    const matched = repositoryFullNames.find((value) => normalizeRepositoryBindingKey(value) === normalizedPrimary)
    if (matched) {
      return matched
    }
  }

  return repositoryFullNames[0] || ''
}

function buildProjectRepositoryBindings(
  form: FormState,
  repositoryOptions: AdminRepositoryRecord[],
  currentRepositories: AdminProjectLinkedRepositoryRecord[],
): { bindings: AdminProjectRepositoryBindingInput[]; missing: string[] } {
  const selectedKeys = Array.from(
    new Set(form.repository_full_names.map((value) => normalizeRepositoryBindingKey(value)).filter(Boolean)),
  )

  const repositoryMap = new Map<string, AdminProjectRepositoryBindingInput>()
  repositoryOptions.forEach((repository) => {
    const normalizedKey = normalizeRepositoryBindingKey(repository.repo_full_name)
    if (!normalizedKey) return
    repositoryMap.set(normalizedKey, {
      repo_full_name: repository.repo_full_name,
      repo_url: repository.repo_url,
      source: repository.source || 'manual',
    })
  })
  currentRepositories.forEach((repository) => {
    const normalizedKey = normalizeRepositoryBindingKey(repository.repo_full_name)
    if (!normalizedKey || repositoryMap.has(normalizedKey)) return
    repositoryMap.set(normalizedKey, {
      repo_full_name: repository.repo_full_name,
      repo_url: repository.repo_url,
      source: repository.source || 'manual',
    })
  })

  const primaryKey = normalizeRepositoryBindingKey(
    resolvePrimaryRepositoryFullName(form.repository_full_names, form.primary_repository_full_name),
  )

  const bindings: AdminProjectRepositoryBindingInput[] = []
  const missing: string[] = []
  selectedKeys.forEach((key) => {
    const repository = repositoryMap.get(key)
    if (!repository || !repository.repo_url) {
      missing.push(key)
      return
    }
    bindings.push({
      ...repository,
      is_primary: key === primaryKey,
    })
  })

  return { bindings, missing }
}

function buildProjectLinksPayload(form: FormState, currentProject: AdminProjectRecord): AdminProjectLinksRecord {
  return {
    ...currentProject.stored_links,
    repo: normalizeComparableLink(form.explicit_repo_link) || null,
  }
}

function projectLinksEqual(left: AdminProjectLinksRecord, right: AdminProjectLinksRecord): boolean {
  return (
    normalizeComparableLink(left.primary) === normalizeComparableLink(right.primary) &&
    normalizeComparableLink(left.repo) === normalizeComparableLink(right.repo) &&
    normalizeComparableLink(left.demo) === normalizeComparableLink(right.demo) &&
    normalizeComparableLink(left.docs) === normalizeComparableLink(right.docs) &&
    normalizeComparableLink(left.notes) === normalizeComparableLink(right.notes)
  )
}

function isValidEditForm(form: FormState): boolean {
  const name = form.name.trim()
  const stage = form.stage.trim()
  const projectType = form.project_type.trim()
  const visibility = form.visibility.trim()
  const sortOrder = Number(form.sort_order.trim())

  return Boolean(name && stage && projectType && visibility && Number.isFinite(sortOrder) && sortOrder >= 1 && sortOrder <= 99)
}

const DEFAULT_CREATE_FORM: CreateFormState = {
  name: '',
  summary: '',
  stage: 'building',
  project_type: 'uncategorized',
  visibility: 'private',
  sort_order: '99',
}

function toCreatePayload(form: CreateFormState): CreateAdminProjectInput | null {
  const name = form.name.trim()
  const summary = form.summary.trim()
  const stage = form.stage.trim().toLowerCase()
  const projectType = form.project_type.trim().toLowerCase()
  const visibility = form.visibility.trim().toLowerCase()
  const sortOrder = Number(form.sort_order.trim())

  if (!name || !stage || !projectType || !visibility || !Number.isFinite(sortOrder) || sortOrder < 1 || sortOrder > 99) {
    return null
  }

  return {
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
    if (error.code === 'invalid_primary_repository') return { code: error.code, message: '\u8bf7\u9009\u62e9\u4e14\u4ec5\u9009\u62e9 1 \u4e2a\u4e3b\u4ed3\u540e\u518d\u4fdd\u5b58\u3002' }
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
  const detailProjectRef = React.useRef<AdminProjectRecord | null>(null)
  detailProjectRef.current = detailProject
  const [form, setForm] = React.useState<FormState | null>(null)
  const formRef = React.useRef<FormState | null>(null)
  formRef.current = form
  const [repositoryOptions, setRepositoryOptions] = React.useState<AdminRepositoryRecord[]>([])
  const repositoryOptionsRef = React.useRef<AdminRepositoryRecord[]>([])
  repositoryOptionsRef.current = repositoryOptions
  const [repositoryOptionsStatus, setRepositoryOptionsStatus] = React.useState<LoadStatus>('idle')
  const [repositoryOptionsMessage, setRepositoryOptionsMessage] = React.useState('')
  const [repositoryDialogOpen, setRepositoryDialogOpen] = React.useState(false)

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
      const content = [project.name, project.summary, project.overview].join(' ').toLowerCase()
      return content.includes(q)
    })
  }, [projects, searchInput])

  const visibleProjects = filtered
  const selectedId = currentSearch.projectId
  const ready = authStatus === 'ready'
  const panel = currentSearch.panel
  const createModalOpen = ready && mode === 'projects' && panel === 'create'
  const editModalOpen = ready && mode === 'projects' && panel === 'edit'

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

  const loadRepositoryOptions = React.useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        setRepositoryOptions([])
        setRepositoryOptionsStatus('idle')
        setRepositoryOptionsMessage('')
        return
      }

      setRepositoryOptionsStatus('loading')
      setRepositoryOptionsMessage('')
      try {
        const result = await fetchAdminRepositories(token, { page: 1, page_size: 200 }, signal)
        if (signal?.aborted) return
        const sorted = [...result.repositories].sort((left, right) => left.repo_full_name.localeCompare(right.repo_full_name))
        setRepositoryOptions(sorted)
        setRepositoryOptionsStatus(sorted.length > 0 ? 'ready' : 'empty')
      } catch (error) {
        if (signal?.aborted) return
        const mapped = errorMessage(error)
        if (mapped.code === 'unauthorized') {
          invalidate(mapped.message)
          return
        }
        setRepositoryOptions([])
        setRepositoryOptionsStatus('error')
        setRepositoryOptionsMessage(mapped.message)
      }
    },
    [invalidate, token],
  )

  React.useEffect(() => {
    if (authStatus !== 'ready' || mode !== 'projects' || currentSearch.panel !== 'edit') return undefined
    const controller = new AbortController()
    void loadRepositoryOptions(controller.signal)
    return () => controller.abort()
  }, [authStatus, currentSearch.panel, loadRepositoryOptions, mode])

  const repositoryDialogOptions = React.useMemo(() => {
    if (!form) {
      return [] as Array<{
        repo_full_name: string
        repo_name: string
        description: string
        visibility: string
        missing: boolean
      }>
    }

    const seen = new Set<string>()
    const items: Array<{
      repo_full_name: string
      repo_name: string
      description: string
      visibility: string
      missing: boolean
    }> = []

    repositoryOptions.forEach((repository) => {
      const normalizedKey = normalizeRepositoryBindingKey(repository.repo_full_name)
      if (!normalizedKey || seen.has(normalizedKey)) return
      seen.add(normalizedKey)
      items.push({
        repo_full_name: repository.repo_full_name,
        repo_name: repository.repo_name || repository.repo_full_name.split('/').pop() || repository.repo_full_name,
        description: repository.description?.trim() || t('未提供仓库描述', 'No repository description'),
        visibility: repository.visibility || 'public',
        missing: false,
      })
    })

    form.repository_full_names.forEach((fullName) => {
      const normalizedKey = normalizeRepositoryBindingKey(fullName)
      if (!normalizedKey || seen.has(normalizedKey)) return
      seen.add(normalizedKey)
      items.push({
        repo_full_name: fullName,
        repo_name: fullName.split('/').pop() || fullName,
        description: t('当前未在已导入仓库列表中', 'Not in imported repository list'),
        visibility: 'unknown',
        missing: true,
      })
    })

    return items
  }, [form, repositoryOptions, t])

  const primaryRepositoryLabel = React.useMemo(() => {
    if (!form) {
      return ''
    }

    return resolvePrimaryRepositoryFullName(form.repository_full_names, form.primary_repository_full_name)
  }, [form])

  const repositoryBindingPreview = React.useMemo(() => {
    if (!form || !detailProject) {
      return { bindings: [], missing: [] }
    }

    return buildProjectRepositoryBindings(form, repositoryOptions, detailProject.repositories)
  }, [detailProject, form, repositoryOptions])

  const repoLinkPreview = React.useMemo(() => {
    if (!detailProject) {
      return null
    }

    const explicitRepoLink = normalizeComparableLink(form?.explicit_repo_link) || null
    const currentEffectiveRepoLink = normalizeComparableLink(detailProject.links.repo) || null
    const pendingPrimaryRepository = repositoryBindingPreview.bindings.find((repository) => repository.is_primary)
    const pendingPrimaryRepoLink = normalizeComparableLink(pendingPrimaryRepository?.repo_url) || null
    const pendingEffectiveRepoLink = explicitRepoLink || pendingPrimaryRepoLink || null
    const sourceKind = explicitRepoLink ? 'explicit' : pendingPrimaryRepoLink ? 'primary_repository' : 'none'

    return {
      currentEffectiveRepoLink,
      pendingEffectiveRepoLink,
      sourceKind,
      willChange: normalizeComparableLink(currentEffectiveRepoLink) !== normalizeComparableLink(pendingEffectiveRepoLink),
    } as const
  }, [detailProject, repositoryBindingPreview])

  const repoLinkPreviewSourceLabel = React.useMemo(() => {
    if (!repoLinkPreview) {
      return ''
    }

    if (repoLinkPreview.sourceKind === 'explicit') {
      return t('显式 link', 'Explicit link')
    }

    if (repoLinkPreview.sourceKind === 'primary_repository') {
      return t('主仓派生', 'Primary-derived')
    }

    return t('未提供', 'None')
  }, [repoLinkPreview, t])

  const repoLinkPreviewMessage = React.useMemo(() => {
    if (!repoLinkPreview) {
      return ''
    }

    if (repoLinkPreview.sourceKind === 'explicit') {
      return t(
        '当前已配置显式 repo link；修改主仓不会改变公开 Repo 链接。',
        'An explicit repo link is configured, so changing the primary repository will not change the public Repo link.',
      )
    }

    if (repoLinkPreview.sourceKind === 'primary_repository') {
      return repoLinkPreview.willChange
        ? t(
            '当前未单独配置 repo link；保存后公开 Repo 链接会跟随主仓 URL 更新。',
            'No explicit repo link is configured. After saving, the public Repo link will update to the primary repository URL.',
          )
        : t(
            '当前未单独配置 repo link；公开 Repo 链接会跟随主仓 URL。',
            'No explicit repo link is configured. The public Repo link follows the primary repository URL.',
          )
    }

    return t(
      '当前既没有显式 repo link，也没有可用主仓 URL；公开页面不会显示 Repo 链接。',
      'There is no explicit repo link and no usable primary repository URL, so the public view will not show a Repo link.',
    )
  }, [repoLinkPreview, t])

  const repositoryDialogButtonLabel = React.useMemo(() => {
    if (!form || form.repository_full_names.length === 0) {
      return t('\u9009\u62e9\u4ed3\u5e93', 'Choose repositories')
    }

    if (form.repository_full_names.length === 1) {
      return primaryRepositoryLabel || form.repository_full_names[0]
    }

    if (primaryRepositoryLabel) {
      return t(
        `\u5df2\u5173\u8054 ${form.repository_full_names.length} \u4e2a\u4ed3\u5e93 | \u4e3b\u4ed3 ${primaryRepositoryLabel}`,
        `${form.repository_full_names.length} repositories linked | primary ${primaryRepositoryLabel}`,
      )
    }

    return t(`\u5df2\u5173\u8054 ${form.repository_full_names.length} \u4e2a\u4ed3\u5e93`, `${form.repository_full_names.length} repositories linked`)
  }, [form, primaryRepositoryLabel, t])

  const toggleRepositorySelection = React.useCallback((repoFullName: string) => {
    setForm((prev) => {
      if (!prev) return prev
      const normalizedKey = normalizeRepositoryBindingKey(repoFullName)
      const exists = prev.repository_full_names.some((value) => normalizeRepositoryBindingKey(value) === normalizedKey)
      const repository_full_names = exists
        ? prev.repository_full_names.filter((value) => normalizeRepositoryBindingKey(value) !== normalizedKey)
        : [...prev.repository_full_names, repoFullName]
      const nextPrimaryCandidate =
        exists && normalizeRepositoryBindingKey(prev.primary_repository_full_name) === normalizedKey
          ? ''
          : prev.primary_repository_full_name || repoFullName

      return {
        ...prev,
        repository_full_names,
        primary_repository_full_name: resolvePrimaryRepositoryFullName(repository_full_names, nextPrimaryCandidate),
      }
    })
  }, [])

  const setPrimaryRepository = React.useCallback((repoFullName: string) => {
    setForm((prev) => {
      if (!prev) return prev
      const primary_repository_full_name = resolvePrimaryRepositoryFullName(prev.repository_full_names, repoFullName)
      if (!primary_repository_full_name) {
        return prev
      }

      return {
        ...prev,
        primary_repository_full_name,
      }
    })
  }, [])

  React.useEffect(() => {
    if (!editModalOpen) {
      setRepositoryDialogOpen(false)
    }
  }, [editModalOpen])

  const createProject = React.useCallback(async () => {
    if (!token) return

    const payload = toCreatePayload(createForm)
    if (!payload) {
      setCreateState({ status: 'error', message: t('请填写必填字段，并确保 sort_order 在 1~99 之间。', 'Please fill required fields and keep sort_order between 1 and 99.') })
      return
    }

    const commitCreated = (created: AdminProjectRecord, successMessage?: string) => {
      const name = created.name || t('未命名项目', 'Untitled project')

      setCreateState({ status: 'success', message: successMessage || t('创建成功：' + name, 'Created: ' + name) })
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

    setCreateState({ status: 'running', message: t('正在创建项目...', 'Creating project...') })

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

      setCreateState({ status: 'running', message: t('请求未确认，正在回查项目列表...', 'Request not confirmed. Re-checking project list...') })

      const normalizedName = payload.name.trim().toLowerCase()
      const probeQueries: Array<{ q?: string; page: number; page_size: number }> = [
        { q: payload.name, page: 1, page_size: 100 },
        { page: 1, page_size: 200 },
      ]

      let recovered: AdminProjectRecord | null = null

      for (let attempt = 0; attempt < 4 && !recovered; attempt += 1) {
        for (const query of probeQueries) {
          try {
            const probe = await fetchAdminProjects(token, query)
            recovered = probe.projects.find((item) => item.name.trim().toLowerCase() === normalizedName) ?? null
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
        const name = recovered.name || t('未命名项目', 'Untitled project')
        commitCreated(recovered, t('请求中断但项目已创建：' + name, 'Request interrupted but project was created: ' + name))
        return
      }

      setCreateState({
        status: 'error',
        message:
          t('创建请求未成功返回，且回查未发现新项目。请检查 API_BASE、CORS 或网络连接后重试。', 'Create request did not return successfully and probe found no new project. Check API_BASE/CORS/network and retry.') +
          t('；诊断：', ' | Diagnostic: ') +
          diagnosticMessage,
      })
    }
  }, [createForm, invalidate, patchSearch, t, token])
  const saveProject = React.useCallback(async (closeAfterSave: boolean) => {
    const currentForm = formRef.current
    if (!token || !selectedId || !currentForm) return
    if (!isValidEditForm(currentForm)) {
      setSaveState({ status: 'error', message: t('\u8bf7\u586b\u5199\u6240\u6709\u5fc5\u586b\u9879\u3002', 'Please complete all required fields.') })
      return
    }

    const currentDetailProject = detailProjectRef.current
    const repositoryBindings = buildProjectRepositoryBindings(
      currentForm,
      repositoryOptionsRef.current,
      currentDetailProject?.repositories ?? [],
    )
    const nextLinks = currentDetailProject ? buildProjectLinksPayload(currentForm, currentDetailProject) : null
    const shouldSaveLinks = currentDetailProject && nextLinks ? !projectLinksEqual(nextLinks, currentDetailProject.stored_links) : false
    if (repositoryBindings.missing.length > 0) {
      setSaveState({
        status: 'error',
        message: t('\u90e8\u5206\u4ed3\u5e93\u9009\u9879\u5c1a\u672a\u52a0\u8f7d\u5b8c\u6210\uff0c\u8bf7\u5237\u65b0\u540e\u91cd\u8bd5\u3002', 'Some repository options are not ready yet. Refresh and try again.'),
      })
      return
    }

    if (repositoryBindings.bindings.length > 0) {
      const primaryCount = repositoryBindings.bindings.filter((repository) => repository.is_primary).length
      if (primaryCount !== 1) {
        setSaveState({
          status: 'error',
          message: t('\u8bf7\u9009\u62e9\u4e14\u4ec5\u9009\u62e9 1 \u4e2a\u4e3b\u4ed3\u540e\u518d\u4fdd\u5b58\u3002', 'Select exactly one primary repository before saving.'),
        })
        return
      }
    }

    setSaveState({ status: 'running', message: t('\u6b63\u5728\u4fdd\u5b58\u53d8\u66f4...', 'Saving changes...') })
    try {
      const patchedProject = mergeSavedProjectRecord(
        currentForm,
        await updateAdminProjectById(token, selectedId, toPayload(currentForm)),
      )

      let updated = patchedProject
      try {
        updated = mergeSavedProjectRecord(
          currentForm,
          await replaceAdminProjectRepositories(token, selectedId, repositoryBindings.bindings),
        )
      } catch (error) {
        const mapped = errorMessage(error)
        if (mapped.code === 'unauthorized') {
          invalidate(mapped.message)
          return
        }
        setDetailProject(patchedProject)
        setDetailStatus('ready')
        setForm(toForm(patchedProject))
        setProjects((prev) => prev.map((item) => (item.id === patchedProject.id ? patchedProject : item)))
        setSaveState({
          status: 'error',
          message:
            t('\u9879\u76ee\u57fa\u672c\u4fe1\u606f\u5df2\u4fdd\u5b58\uff0c\u4f46\u4ed3\u5e93\u5173\u8054\u5931\u8d25\uff1a', 'Project fields were saved, but repository bindings failed: ') +
            mapped.message,
        })
        return
      }

      if (shouldSaveLinks && nextLinks) {
        try {
          updated = mergeSavedProjectRecord(
            currentForm,
            await replaceAdminProjectLinks(token, selectedId, nextLinks),
          )
        } catch (error) {
          const mapped = errorMessage(error)
          if (mapped.code === 'unauthorized') {
            invalidate(mapped.message)
            return
          }
          setDetailProject(updated)
          setDetailStatus('ready')
          setForm({ ...currentForm })
          setProjects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
          setSaveState({
            status: 'error',
            message:
              t('\u9879\u76ee\u57fa\u672c\u4fe1\u606f\u4e0e\u4ed3\u5e93\u5173\u8054\u5df2\u4fdd\u5b58\uff0c\u4f46 Repo link \u5199\u5165\u5931\u8d25\uff1a', 'Project fields and repository bindings were saved, but Repo link save failed: ') +
              mapped.message,
          })
          return
        }
      }

      setSaveState({ status: 'success', message: t('\u4fdd\u5b58\u6210\u529f\u3002', 'Saved.') })
      setDetailProject(updated)
      setDetailStatus('ready')
      setForm(toForm(updated))
      setProjects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      if (closeAfterSave) {
        patchSearch({ panel: 'closed' })
      }
    } catch (error) {
      const mapped = errorMessage(error)
      if (mapped.code === 'unauthorized') {
        invalidate(mapped.message)
        return
      }
      setSaveState({ status: 'error', message: mapped.message })
    }
  }, [invalidate, patchSearch, selectedId, t, token])


  const deleteProjectByRecord = React.useCallback(async (project: AdminProjectRecord) => {
    if (!token) return

    const projectId = project.id
    const projectName = project.name || t('未命名项目', 'Untitled project')

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

  const selectedProjectName = detailProject?.name || ''
  const deleteModalOpen = ready && mode === 'projects' && deleteTarget !== null
  const deleteTargetName = deleteTarget?.name || t('未命名项目', 'Untitled project')
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
  const closeEditPanel = () => {
    setRepositoryDialogOpen(false)
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
    setRepositoryDialogOpen(false)
    patchSearch({ projectId, panel: 'edit' })
  }

  const openDeleteModal = (project: AdminProjectRecord) => {
    setDeleteState({ status: 'idle', message: '' })
    setDeleteTarget(project)
  }

  React.useEffect(() => {
    if (!editModalOpen) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (repositoryDialogOpen) {
        setRepositoryDialogOpen(false)
        return
      }
      closeEditPanel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeEditPanel, editModalOpen, repositoryDialogOpen])


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
        <section className="admin-projects-workspace admin-projects-workspace--catalog admin-projects-workspace--list">
          <section className="admin-projects-catalog" aria-label={t('\u9879\u76ee\u5217\u8868', 'Projects list')}>
            <div className="admin-projects-actions" role="toolbar" aria-label={t('\u9879\u76ee\u64cd\u4f5c\u533a', 'Projects actions')}>
              <label className="admin-search-field admin-search-field--projects admin-projects-actions__search">
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

              <div className="admin-projects-actions__buttons">
                <button className="admin-primary-button" type="button" onClick={openCreatePanel}>
                  {t('\u65b0\u5efa\u9879\u76ee', 'New Project')}
                </button>
              </div>
            </div>

            {surfaceFeedback ? <div className="admin-surface-feedback"><p className="admin-feedback" data-tone={surfaceFeedbackTone}>{surfaceFeedback}</p></div> : null}

            <div className="admin-projects-results">
              {listStatus === 'loading' ? <div className="admin-state-card">{t('\u52a0\u8f7d\u4e2d...', 'Loading...')}</div> : null}
              {listStatus === 'error' ? <div className="admin-state-card admin-state-error"><p>{listMessage}</p><button className="admin-primary-button" type="button" onClick={() => setListNonce((prev) => prev + 1)}>{t('\u91cd\u8bd5', 'Retry')}</button></div> : null}
              {listStatus === 'empty' ? (
                <div className="admin-state-card">
                  <p>{t('\u5f53\u524d\u6ca1\u6709\u9879\u76ee\u3002\u8bf7\u901a\u8fc7\u201c\u65b0\u5efa\u9879\u76ee\u201d\u6765\u521b\u5efa\u3002', 'There are no projects yet. Use New Project to create your first one.')}</p>
                  <div className="admin-list-actions">
                    <button className="admin-primary-button" type="button" onClick={openCreatePanel}>{t('\u521b\u5efa\u9996\u4e2a\u9879\u76ee', 'Create First Project')}</button>
                  </div>
                </div>
              ) : null}
              {listStatus === 'ready' && filtered.length === 0 ? <div className="admin-state-card"><p>{t('\u6ca1\u6709\u5339\u914d\u7684\u9879\u76ee\u3002', 'No matching projects.')}</p><button className="admin-secondary-button" type="button" onClick={resetFilters}>{t('\u6e05\u7a7a\u7b5b\u9009', 'Clear Filters')}</button></div> : null}

              {listStatus === 'ready' && filtered.length > 0 ? (
                <ul className="admin-project-list">
                  {visibleProjects.map((item) => (
                    <li key={item.id} className="admin-project-list-item">
                      <div className="admin-project-list-item__main">
                        <div className="admin-project-row__identity">
                          <p className="name">{item.name || t('未命名项目', 'Untitled project')}</p>
                        </div>
                        <p className="meta">{item.summary || item.overview || t('暂无简介', 'No summary yet.')}</p>
                        <div className="admin-project-list-item__meta">
                          <p className="admin-project-row__stage" data-stage={item.stage || 'unknown'}>{item.stage || '--'}</p>
                          <p className="admin-project-list-item__updated">{formatTime(item.updated_at)}</p>
                        </div>
                      </div>
                      <div className="admin-project-list-item__actions">
                        <button className="admin-secondary-button" type="button" onClick={() => openEditPanel(item.id)}>{t('\u7f16\u8f91', 'Edit')}</button>
                        <button className="admin-danger-button" type="button" onClick={() => openDeleteModal(item)}>{t('\u5220\u9664', 'Delete')}</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
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
                <label className="admin-field">
                  <span className="admin-field-label">项目名称<span className="admin-field-required">*</span></span>
                  <input type="text" value={createForm.name} onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="My First Project" required />
                </label>
                <label className="admin-field">
                  <span className="admin-field-label">项目简介</span>
                  <textarea value={createForm.summary} onChange={(event) => setCreateForm((prev) => ({ ...prev, summary: event.target.value }))} placeholder={t('一句话概述（可选）', 'One-line summary (optional)')} />
                </label>
                <div className="admin-editor-grid admin-editor-grid--create-project-controls">
                  <AdminFormSelect
                    label={<>{'阶段'}<span className="admin-field-required">*</span></>}
                    onChange={(value) => setCreateForm((prev) => ({ ...prev, stage: value }))}
                    options={STAGE_OPTIONS}
                    t={t}
                    value={createForm.stage}
                  />
                  <AdminFormSelect
                    label={<>{'类型'}<span className="admin-field-required">*</span></>}
                    onChange={(value) => setCreateForm((prev) => ({ ...prev, project_type: value }))}
                    options={PROJECT_TYPE_OPTIONS}
                    t={t}
                    value={createForm.project_type}
                  />
                  <AdminFormSelect
                    label={<>{'可见性'}<span className="admin-field-required">*</span></>}
                    onChange={(value) => setCreateForm((prev) => ({ ...prev, visibility: value }))}
                    options={VISIBILITY_OPTIONS}
                    t={t}
                    value={createForm.visibility}
                  />
                  <label className="admin-field">
                    <span className="admin-field-label">序号<span className="admin-field-required">*</span></span>
                    <input className="admin-number-input" type="number" min={1} max={99} value={createForm.sort_order} onChange={(event) => setCreateForm((prev) => ({ ...prev, sort_order: event.target.value }))} required />
                  </label>
                </div>
                {createState.message ? <p className="admin-feedback" data-tone={createState.status === 'success' ? 'success' : createState.status === 'error' ? 'error' : 'info'}>{createState.message}</p> : null}
              </div>
              <div className="admin-project-modal__footer">
                <button className="admin-primary-button" type="submit" disabled={createState.status === 'running'}>{createState.status === 'running' ? t('创建中...', 'Creating...') : t('创建项目', 'Create Project')}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {editModalOpen ? (
        <div className="admin-project-modal-backdrop">
          <section className="admin-projects-detail-panel admin-project-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="admin-project-modal__head">
              <div className="admin-project-modal__titleblock">
                <h2>{t('\u7f16\u8f91\u9879\u76ee', 'Edit Project')}</h2>
                <p className="admin-project-modal__project-name">{selectedProjectName || t('项目详情', 'Project detail')}</p>
              </div>
              <button className="admin-modal-close" type="button" onClick={closeEditPanel} aria-label={t('\u5173\u95ed', 'Close')}>{'\u00d7'}</button>
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
              <form className="admin-project-modal__content" onSubmit={(event) => { event.preventDefault(); void saveProject(false) }}>
                <div className="admin-project-modal__body admin-editor-form admin-editor-form--modal">
                  <div className="admin-field-row">
                    <label className="admin-field admin-field-row__primary">
                      <span className="admin-field-label">{'\u9879\u76ee\u540d\u79f0'}<span className="admin-field-required">*</span></span>
                      <input type="text" value={form.name} onChange={(event) => setForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))} required />
                    </label>
                    <div className="admin-field admin-field-row__aside">
                      <span className="admin-field-label">{'\u5173\u8054\u4ed3\u5e93'}</span>
                      <button
                        aria-expanded={repositoryDialogOpen}
                        aria-haspopup="dialog"
                        className="admin-input-like-button"
                        onClick={() => setRepositoryDialogOpen(true)}
                        type="button"
                      >
                        <span className="admin-input-like-button__label">{repositoryDialogButtonLabel}</span>
                      </button>
                      {repoLinkPreview ? (
                        <div className="admin-project-link-semantics">
                          <div className="admin-project-link-semantics__head">
                            <span className="admin-project-link-semantics__title">{t('\u516c\u5f00 Repo \u94fe\u63a5', 'Public Repo Link')}</span>
                            <span className="admin-project-link-semantics__badge" data-source={repoLinkPreview.sourceKind}>{repoLinkPreviewSourceLabel}</span>
                          </div>
                          <p className="admin-project-link-semantics__url" data-empty={repoLinkPreview.pendingEffectiveRepoLink ? 'false' : 'true'}>
                            {repoLinkPreview.pendingEffectiveRepoLink ? (
                              <a href={repoLinkPreview.pendingEffectiveRepoLink} rel="noreferrer" target="_blank">{repoLinkPreview.pendingEffectiveRepoLink}</a>
                            ) : (
                              t('\u5f53\u524d\u4e0d\u4f1a\u8f93\u51fa Repo \u94fe\u63a5', 'No public Repo link currently')
                            )}
                          </p>
                          <p className="admin-field-note">{repoLinkPreviewMessage}</p>
                          <label className="admin-field admin-project-link-semantics__field">
                            <span className="admin-field-label">{t('\u663e\u5f0f Repo Link\uff08\u53ef\u9009\uff09', 'Explicit Repo Link (optional)')}</span>
                            <input
                              type="url"
                              value={form.explicit_repo_link}
                              onChange={(event) => setForm((prev) => (prev ? { ...prev, explicit_repo_link: event.target.value } : prev))}
                              placeholder={t('\u7559\u7a7a\u5219\u8ddf\u968f\u4e3b\u4ed3\u6d3e\u751f', 'Leave empty to follow the primary repository')}
                            />
                          </label>
                          <p className="admin-field-note">{t('\u8fd9\u91cc\u53ea\u4f1a\u5199\u5165 stored_links.repo\uff1b\u7559\u7a7a\u4e0d\u4f1a\u8986\u76d6\u5176\u4ed6 links \u5b57\u6bb5\u3002', 'This only writes stored_links.repo. Leaving it empty will not overwrite the other links fields.')}</p>
                          <div className="admin-project-link-semantics__actions">
                            <button
                              className="admin-secondary-button inline"
                              type="button"
                              onClick={() => setForm((prev) => (prev ? { ...prev, explicit_repo_link: '' } : prev))}
                              disabled={!form.explicit_repo_link.trim()}
                            >
                              {t('\u6e05\u7a7a\u663e\u5f0f\u503c', 'Clear explicit value')}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <label className="admin-field">
                    <span className="admin-field-label">{'\u9879\u76ee\u7b80\u4ecb'}</span>
                    <textarea value={form.summary} onChange={(event) => setForm((prev) => (prev ? { ...prev, summary: event.target.value } : prev))} placeholder={t('\u4e00\u53e5\u8bdd\u6982\u8ff0\uff08\u53ef\u9009\uff09', 'One-line summary (optional)')} />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">{'\u9879\u76ee\u6982\u89c8'}</span>
                    <textarea value={form.overview} onChange={(event) => setForm((prev) => (prev ? { ...prev, overview: event.target.value } : prev))} placeholder={t('\u8865\u5145\u66f4\u5b8c\u6574\u7684\u9879\u76ee\u8bf4\u660e\uff08\u53ef\u9009\uff09', 'Add a fuller project overview (optional)')} />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">{'\u72b6\u6001\u5907\u6ce8'}</span>
                    <textarea value={form.status_note} onChange={(event) => setForm((prev) => (prev ? { ...prev, status_note: event.target.value } : prev))} placeholder={t('\u4f8b\u5982\uff1a\u6682\u505c\u66f4\u65b0\u3001\u4ec5\u5185\u90e8\u8bd5\u9a8c\uff08\u53ef\u9009\uff09', 'For example: paused, internal-only experiment (optional)')} />
                  </label>

                  <div className="admin-editor-grid three-col">
                    <AdminFormSelect
                      label={<>{'\u9636\u6bb5'}<span className="admin-field-required">*</span></>}
                      onChange={(value) => setForm((prev) => (prev ? { ...prev, stage: value } : prev))}
                      options={STAGE_OPTIONS}
                      t={t}
                      value={form.stage}
                    />
                    <AdminFormSelect
                      label={<>{'\u7c7b\u578b'}<span className="admin-field-required">*</span></>}
                      onChange={(value) => setForm((prev) => (prev ? { ...prev, project_type: value } : prev))}
                      options={PROJECT_TYPE_OPTIONS}
                      t={t}
                      value={form.project_type}
                    />
                    <AdminFormSelect
                      label={<>{'\u53ef\u89c1\u6027'}<span className="admin-field-required">*</span></>}
                      onChange={(value) => setForm((prev) => (prev ? { ...prev, visibility: value } : prev))}
                      options={VISIBILITY_OPTIONS}
                      t={t}
                      value={form.visibility}
                    />
                  </div>

                  <div className="admin-editor-grid admin-editor-grid--project-flags">
                    <label className="admin-field">
                      <span className="admin-field-label">{'\u5e8f\u53f7'}<span className="admin-field-required">*</span></span>
                      <input className="admin-number-input" type="number" min={1} max={99} value={form.sort_order} onChange={(event) => setForm((prev) => (prev ? { ...prev, sort_order: event.target.value } : prev))} required />
                    </label>
                    <label className="admin-field admin-field--inline-toggle">
                      <span className="admin-field-label admin-field-label--ghost" aria-hidden="true">&nbsp;</span>
                      <span className="admin-checkbox-row admin-checkbox-row--field">
                        <input type="checkbox" checked={form.is_featured} onChange={(event) => setForm((prev) => (prev ? { ...prev, is_featured: event.target.checked, featured_rank: event.target.checked ? prev.featured_rank : '' } : prev))} />
                        <span>{t('\u7cbe\u9009', 'Featured')}</span>
                      </span>
                    </label>
                    {form.is_featured ? (
                      <label className="admin-field">
                        <span className="admin-field-label">featured_rank</span>
                        <input className="admin-number-input" type="number" min={1} value={form.featured_rank} onChange={(event) => setForm((prev) => (prev ? { ...prev, featured_rank: event.target.value } : prev))} />
                      </label>
                    ) : <span aria-hidden="true" />}
                  </div>
                </div>
                <div className="admin-project-modal__footer">
                  <div className="admin-project-modal__footer-feedback-slot" aria-live="polite">
                    {saveState.status !== 'idle' && saveState.message ? <p className="admin-feedback admin-project-modal__footer-feedback" data-tone={saveState.status === 'success' ? 'success' : saveState.status === 'error' ? 'error' : 'info'}>{saveState.message}</p> : <span className="admin-project-modal__footer-feedback-placeholder" aria-hidden="true" />}
                  </div>
                  <div className="admin-project-modal__footer-actions">
                    <button className="admin-secondary-button" type="submit" disabled={saveState.status === 'running'}>{saveState.status === 'running' ? t('\u4fdd\u5b58\u4e2d...', 'Saving...') : t('\u4fdd\u5b58', 'Save')}</button>
                    <button className="admin-primary-button" type="button" onClick={() => void saveProject(true)} disabled={saveState.status === 'running'}>{saveState.status === 'running' ? t('\u4fdd\u5b58\u4e2d...', 'Saving...') : t('\u4fdd\u5b58\u5e76\u5173\u95ed', 'Save & Close')}</button>
                  </div>
                </div>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}
      {editModalOpen && detailStatus === 'ready' && form && detailProject && repositoryDialogOpen ? (
        <div className="admin-project-modal-backdrop admin-project-modal-backdrop--nested">
          <section className="admin-projects-detail-panel admin-project-modal admin-project-modal--repository" role="dialog" aria-modal="true" aria-label={t('\u5173\u8054\u4ed3\u5e93', 'Link Repositories')} onClick={(event) => event.stopPropagation()}>
            <div className="admin-project-modal__head admin-project-modal__head--repository">
              <div className="admin-project-modal__titleblock">
                <h3>{t('\u5173\u8054\u4ed3\u5e93', 'Link Repositories')}</h3>
                <p className="admin-project-modal__project-name">{t('\u4ece\u5df2\u5bfc\u5165\u7684 GitHub \u4ed3\u5e93\u4e2d\u52fe\u9009\uff0c\u53ef\u591a\u9009\uff1b\u5df2\u9009\u4ed3\u5e93\u4e2d\u9700\u6307\u5b9a 1 \u4e2a\u4e3b\u4ed3\u3002', 'Choose from imported GitHub repositories. Multiple selections are supported, and one selected repository must be marked as primary.')}</p>
              </div>
              <button className="admin-modal-close" type="button" onClick={() => setRepositoryDialogOpen(false)} aria-label={t('\u5173\u95ed', 'Close')}>{'\u00d7'}</button>
            </div>
            <div className="admin-project-modal__content">
              <div className="admin-project-modal__body admin-project-modal__body--repository">
                {repoLinkPreview ? (
                  <div className="admin-project-link-semantics">
                    <div className="admin-project-link-semantics__head">
                      <span className="admin-project-link-semantics__title">{t('公开 Repo 链接预览', 'Public Repo Link Preview')}</span>
                      <span className="admin-project-link-semantics__badge" data-source={repoLinkPreview.sourceKind}>{repoLinkPreviewSourceLabel}</span>
                    </div>
                    <p className="admin-project-link-semantics__url" data-empty={repoLinkPreview.pendingEffectiveRepoLink ? 'false' : 'true'}>
                      {repoLinkPreview.pendingEffectiveRepoLink ? (
                        <a href={repoLinkPreview.pendingEffectiveRepoLink} rel="noreferrer" target="_blank">{repoLinkPreview.pendingEffectiveRepoLink}</a>
                      ) : (
                        t('当前不会输出 Repo 链接', 'No public Repo link currently')
                      )}
                    </p>
                    <p className="admin-field-note">{repoLinkPreviewMessage}</p>
                  </div>
                ) : null}
                {repositoryOptions.length > 0 || repositoryDialogOptions.length > 0 ? (
                  <div className="admin-repository-dialog__list">
                    {repositoryDialogOptions.map((repository) => {
                      const normalizedKey = normalizeRepositoryBindingKey(repository.repo_full_name)
                      const isSelected = form.repository_full_names.some(
                        (value) => normalizeRepositoryBindingKey(value) === normalizedKey,
                      )
                      const isPrimary = isSelected && normalizeRepositoryBindingKey(primaryRepositoryLabel) === normalizedKey

                      return (
                        <div
                          className={`admin-repository-dialog__item ${isSelected ? 'is-selected' : ''} ${repository.missing ? 'is-missing' : ''}`.trim()}
                          data-visibility={repository.visibility || 'unknown'}
                          key={repository.repo_full_name}
                        >
                          <button
                            className="admin-repository-dialog__copy admin-repository-dialog__copy-button"
                            onClick={() => toggleRepositorySelection(repository.repo_full_name)}
                            type="button"
                          >
                            <span className="admin-repository-dialog__name-row">
                              <span className="admin-repository-dialog__name">{repository.repo_name}</span>
                              {isPrimary ? <span className="admin-repository-dialog__primary-badge">{t('\u4e3b\u4ed3', 'Primary')}</span> : null}
                            </span>
                            <span className="admin-repository-dialog__description">{repository.description}</span>
                          </button>
                          <div className="admin-repository-dialog__controls">
                            {isSelected ? (
                              <button
                                className="admin-repository-dialog__primary-toggle"
                                data-active={isPrimary ? 'true' : 'false'}
                                onClick={() => setPrimaryRepository(repository.repo_full_name)}
                                type="button"
                              >
                                {isPrimary ? t('\u5f53\u524d\u4e3b\u4ed3', 'Current primary') : t('\u8bbe\u4e3a\u4e3b\u4ed3', 'Set primary')}
                              </button>
                            ) : null}
                            <input
                              aria-label={t(`\u9009\u62e9\u4ed3\u5e93 ${repository.repo_full_name}`, `Select repository ${repository.repo_full_name}`)}
                              checked={isSelected}
                              onChange={() => toggleRepositorySelection(repository.repo_full_name)}
                              type="checkbox"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="admin-state-card">
                    <p>
                      {repositoryOptionsStatus === 'loading'
                        ? t('\u6b63\u5728\u52a0\u8f7d\u4ed3\u5e93...', 'Loading repositories...')
                        : repositoryOptionsStatus === 'error'
                          ? repositoryOptionsMessage || t('\u4ed3\u5e93\u5217\u8868\u52a0\u8f7d\u5931\u8d25\u3002', 'Failed to load repositories.')
                          : t('\u5f53\u524d\u6ca1\u6709\u53ef\u5173\u8054\u7684\u5df2\u5bfc\u5165\u4ed3\u5e93\u3002', 'No imported repositories are available.')}
                    </p>
                    {repositoryOptionsStatus === 'error' ? (
                      <button className="admin-secondary-button inline" type="button" onClick={() => void loadRepositoryOptions()}>{t('\u91cd\u8bd5\u52a0\u8f7d', 'Retry')}</button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
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


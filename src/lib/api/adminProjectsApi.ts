export type AdminProjectErrorCode =
  | 'unauthorized'
  | 'project_not_found'
  | 'project_slug_conflict'
  | 'invalid_stage'
  | 'invalid_project_type'
  | 'invalid_visibility'
  | 'invalid_link_type'
  | 'repository_conflict'
  | 'sync_failed'
  | 'unknown'

export interface AdminProjectRecord {
  id: string
  slug: string
  name: string
  headline: string
  summary: string
  overview: string
  status_note: string | null
  stage: string
  project_type: string
  visibility: string
  is_featured: boolean
  featured_rank: number | null
  sort_order: number | null
  accent: string | null
  synced_at: string | null
  updated_at: string | null
}

export interface AdminProjectsListResult {
  projects: AdminProjectRecord[]
  total: number
  page: number
  page_size: number
}

export interface AdminProjectsQuery {
  q?: string
  stage?: string
  visibility?: string
  page?: number
  page_size?: number
}

export interface AdminProjectUpdateInput {
  slug?: string
  name?: string
  headline?: string
  summary?: string
  overview?: string
  status_note?: string | null
  stage?: string
  project_type?: string
  visibility?: string
  is_featured?: boolean
  featured_rank?: number | null
  sort_order?: number | null
  accent?: string | null
}

export class AdminProjectsApiError extends Error {
  status?: number
  code: AdminProjectErrorCode
  details: unknown

  constructor(message: string, options?: { status?: number; code?: AdminProjectErrorCode; details?: unknown }) {
    super(message)
    this.name = 'AdminProjectsApiError'
    this.status = options?.status
    this.code = options?.code ?? 'unknown'
    this.details = options?.details ?? null
  }
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toIdentifierText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  return ''
}


function toNullableText(value: unknown): string | null {
  const text = toText(value)
  return text || null
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

function toPositiveInteger(value: unknown, fallback: number): number {
  const parsed = toFiniteNumber(value)
  if (parsed === null || parsed <= 0) {
    return fallback
  }

  return Math.max(1, Math.round(parsed))
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value > 0
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes'
  }

  return false
}

function normalizeErrorCode(value: unknown): AdminProjectErrorCode {
  const code = toText(value).toLowerCase()
  if (
    code === 'unauthorized' ||
    code === 'project_not_found' ||
    code === 'project_slug_conflict' ||
    code === 'invalid_stage' ||
    code === 'invalid_project_type' ||
    code === 'invalid_visibility' ||
    code === 'invalid_link_type' ||
    code === 'repository_conflict' ||
    code === 'sync_failed'
  ) {
    return code
  }

  return 'unknown'
}

function normalizeProjectId(project: Record<string, unknown>): string {
  const primaryId = toIdentifierText(project.id) || toIdentifierText(project.project_id)
  if (primaryId) {
    return primaryId
  }

  const fallbackFields = [project.project_key, project.slug, project.uuid]
  for (const field of fallbackFields) {
    const value = toIdentifierText(field)
    if (value) {
      return value
    }
  }

  return ''
}

function normalizeProjectRecord(value: unknown): AdminProjectRecord | null {
  const project = toRecord(value)
  if (!project) {
    return null
  }

  const id = normalizeProjectId(project)
  if (!id) {
    return null
  }

  return {
    id,
    slug: toText(project.slug),
    name: toText(project.name),
    headline: toText(project.headline),
    summary: toText(project.summary),
    overview: toText(project.overview),
    status_note: toNullableText(project.status_note),
    stage: toText(project.stage),
    project_type: toText(project.project_type),
    visibility: toText(project.visibility),
    is_featured: toBoolean(project.is_featured),
    featured_rank: toFiniteNumber(project.featured_rank),
    sort_order: toFiniteNumber(project.sort_order),
    accent: toNullableText(project.accent),
    synced_at: toNullableText(project.synced_at),
    updated_at: toNullableText(project.updated_at),
  }
}

function normalizeProjectsList(value: unknown): AdminProjectsListResult {
  const payload = toRecord(value)
  const rawProjects =
    (Array.isArray(value) ? value : null) ??
    (Array.isArray(payload?.projects) ? payload?.projects : null) ??
    (Array.isArray(payload?.items) ? payload?.items : null) ??
    []

  const projects = rawProjects
    .map((entry) => normalizeProjectRecord(entry))
    .filter((entry): entry is AdminProjectRecord => Boolean(entry))
  const pagination = toRecord(payload?.pagination)
  const total = toPositiveInteger(payload?.total ?? payload?.count ?? pagination?.total ?? projects.length, projects.length)
  const page = toPositiveInteger(payload?.page ?? pagination?.page ?? 1, 1)
  const rawPageSize = payload?.page_size ?? payload?.pageSize ?? pagination?.page_size ?? projects.length
  const pageSize = toPositiveInteger(rawPageSize, 20)

  return {
    projects,
    total,
    page,
    page_size: pageSize,
  }
}

function normalizeProjectDetail(value: unknown): AdminProjectRecord {
  const payload = toRecord(value)
  const project =
    normalizeProjectRecord(payload?.project) ??
    normalizeProjectRecord(payload?.item) ??
    normalizeProjectRecord(payload)

  if (!project) {
    throw new AdminProjectsApiError('Project detail payload is invalid.')
  }

  return project
}

function getRuntimeConfig(): { API_BASE?: string; REQUEST_TIMEOUT_MS?: number } | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.__APP_CONFIG__
}

function getRuntimeApiBase(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const configuredBase = toText(getRuntimeConfig()?.API_BASE)
  const origin = window.location.origin

  if (!configuredBase) {
    return origin
  }

  return configuredBase.endsWith('/') ? configuredBase.slice(0, -1) : configuredBase
}

function getTimeoutMs(): number {
  const timeoutMs = getRuntimeConfig()?.REQUEST_TIMEOUT_MS
  if (typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return Math.floor(timeoutMs)
  }

  return 4000
}

function buildAdminUrl(pathname: string, query?: AdminProjectsQuery): string {
  const base = `${getRuntimeApiBase()}${pathname}`
  if (!query) {
    return base
  }

  const searchParams = new URLSearchParams()

  if (toText(query.q)) {
    searchParams.set('q', toText(query.q))
  }
  if (toText(query.stage)) {
    searchParams.set('stage', toText(query.stage))
  }
  if (toText(query.visibility)) {
    searchParams.set('visibility', toText(query.visibility))
  }
  if (typeof query.page === 'number' && Number.isFinite(query.page) && query.page > 0) {
    searchParams.set('page', String(Math.round(query.page)))
  }
  if (typeof query.page_size === 'number' && Number.isFinite(query.page_size) && query.page_size > 0) {
    searchParams.set('page_size', String(Math.round(query.page_size)))
  }

  const suffix = searchParams.toString()
  return suffix ? `${base}?${suffix}` : base
}

function mapUnauthorized(status: number | undefined, code: AdminProjectErrorCode): AdminProjectErrorCode {
  if (status === 401 || code === 'unauthorized') {
    return 'unauthorized'
  }

  return code
}

async function parseErrorFromResponse(response: Response): Promise<AdminProjectsApiError> {
  let message = ''
  let code: AdminProjectErrorCode = 'unknown'
  let details: unknown = null

  try {
    const body = (await response.json()) as {
      detail?: unknown
      error?: {
        code?: unknown
        message?: unknown
        details?: unknown
      } | null
    }

    const errorObject = toRecord(body.error)
    code = normalizeErrorCode(errorObject?.code)
    message = toText(errorObject?.message) || toText(body.detail)
    details = errorObject?.details ?? null
  } catch {
    message = ''
  }

  const normalizedCode = mapUnauthorized(response.status, code)
  const fallbackMessage = normalizedCode === 'unauthorized' ? 'unauthorized' : `HTTP_${response.status}`

  return new AdminProjectsApiError(message || fallbackMessage, {
    status: response.status,
    code: normalizedCode,
    details,
  })
}

async function requestJson<T>(
  pathname: string,
  options: {
    token: string
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT'
    body?: Record<string, unknown>
    signal?: AbortSignal
    query?: AdminProjectsQuery
  },
): Promise<T> {
  const timeoutMs = getTimeoutMs()
  const timeoutController = typeof AbortController === 'function' ? new AbortController() : null
  const timerId =
    timeoutController &&
    globalThis.setTimeout(() => {
      timeoutController.abort()
    }, timeoutMs)

  try {
    const response = await fetch(buildAdminUrl(pathname, options.query), {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Admin-Token': options.token,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal ?? timeoutController?.signal,
    })

    if (!response.ok) {
      throw await parseErrorFromResponse(response)
    }

    if (response.status === 204) {
      return {} as T
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof AdminProjectsApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AdminProjectsApiError('Admin request timed out.', { code: 'unknown' })
    }

    if (error instanceof Error) {
      throw new AdminProjectsApiError(error.message, { code: 'unknown' })
    }

    throw new AdminProjectsApiError('Unknown admin request error.', { code: 'unknown' })
  } finally {
    if (timerId) {
      globalThis.clearTimeout(timerId)
    }
  }
}

function cleanUpdatePayload(input: AdminProjectUpdateInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  const fieldNames: Array<keyof AdminProjectUpdateInput> = [
    'slug',
    'name',
    'headline',
    'summary',
    'overview',
    'status_note',
    'stage',
    'project_type',
    'visibility',
    'is_featured',
    'featured_rank',
    'sort_order',
    'accent',
  ]

  for (const field of fieldNames) {
    const value = input[field]
    if (value === undefined) {
      continue
    }
    payload[field] = value
  }

  return payload
}

export async function verifyAdminToken(token: string, signal?: AbortSignal): Promise<void> {
  const normalizedToken = toText(token)
  if (!normalizedToken) {
    throw new AdminProjectsApiError('Admin token is required.', { code: 'unauthorized' })
  }

  await requestJson('/admin/auth/verify', {
    token: normalizedToken,
    method: 'GET',
    signal,
  })
}

export async function fetchAdminProjects(token: string, query?: AdminProjectsQuery, signal?: AbortSignal): Promise<AdminProjectsListResult> {
  const payload = await requestJson<unknown>('/admin/projects', {
    token: toText(token),
    method: 'GET',
    signal,
    query,
  })

  return normalizeProjectsList(payload)
}

export async function fetchAdminProjectById(
  token: string,
  projectId: string,
  signal?: AbortSignal,
): Promise<AdminProjectRecord> {
  const normalizedProjectId = toIdentifierText(projectId)
  if (!normalizedProjectId) {
    throw new AdminProjectsApiError('Project id is required.')
  }

  const payload = await requestJson<unknown>(`/admin/projects/${encodeURIComponent(normalizedProjectId)}`, {
    token: toText(token),
    method: 'GET',
    signal,
  })

  return normalizeProjectDetail(payload)
}

export async function updateAdminProjectById(
  token: string,
  projectId: string,
  input: AdminProjectUpdateInput,
  signal?: AbortSignal,
): Promise<AdminProjectRecord> {
  const normalizedProjectId = toIdentifierText(projectId)
  if (!normalizedProjectId) {
    throw new AdminProjectsApiError('Project id is required.')
  }

  const payload = await requestJson<unknown>(`/admin/projects/${encodeURIComponent(normalizedProjectId)}`, {
    token: toText(token),
    method: 'PATCH',
    body: cleanUpdatePayload(input),
    signal,
  })

  return normalizeProjectDetail(payload)
}

export async function syncAdminProjectRepositories(token: string, projectId: string, signal?: AbortSignal): Promise<AdminProjectRecord> {
  const normalizedProjectId = toIdentifierText(projectId)
  if (!normalizedProjectId) {
    throw new AdminProjectsApiError('Project id is required.')
  }

  const payload = await requestJson<unknown>(`/admin/projects/${encodeURIComponent(normalizedProjectId)}/sync-repositories`, {
    token: toText(token),
    method: 'POST',
    signal,
  })

  return normalizeProjectDetail(payload)
}





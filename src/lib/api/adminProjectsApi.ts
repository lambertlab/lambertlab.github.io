export type AdminProjectErrorCode =
  | 'unauthorized'
  | 'validation_failed'
  | 'project_not_found'
  | 'project_slug_conflict'
  | 'invalid_stage'
  | 'invalid_project_type'
  | 'invalid_visibility'
  | 'invalid_link_type'
  | 'invalid_primary_repository'
  | 'repository_conflict'
  | 'sync_job_not_found'
  | 'sync_job_state_invalid'
  | 'sync_rate_limited'
  | 'sync_failed'
  | 'internal_error'
  | 'request_timeout'
  | 'network_failed'
  | 'unknown'

export interface AdminProjectLinkedRepositoryRecord {
  id: string
  repo_full_name: string
  repo_name: string
  repo_url: string
  visibility: string | null
  is_primary: boolean
  source: string
  description: string
  language: string
  stargazers_count: number
  forks_count: number
}

export interface AdminProjectLinksRecord {
  primary: string | null
  repo: string | null
  demo: string | null
  docs: string | null
  notes: string | null
}

export interface AdminProjectSourceRefsRecord {
  repo_full_name: string | null
  repo_url: string | null
  visibility: string | null
}

export interface AdminProjectRecord {
  id: string
  slug: string
  name: string
  summary: string
  overview: string
  status_note: string | null
  stage: string
  project_type: string
  visibility: string
  is_featured: boolean
  featured_rank: number | null
  sort_order: number | null
  links: AdminProjectLinksRecord
  stored_links: AdminProjectLinksRecord
  source_refs: AdminProjectSourceRefsRecord
  repositories: AdminProjectLinkedRepositoryRecord[]
  synced_at: string | null
  updated_at: string | null
}

export interface AdminRepositoryRecord {
  id: string
  repo_full_name: string
  repo_owner: string
  repo_name: string
  repo_url: string
  github_username: string | null
  description: string
  language: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  visibility: string
  archived: boolean
  fork: boolean
  source: string
  is_active: boolean
  mapped_projects_count: number
  pushed_at: string | null
  repo_created_at: string | null
  repo_updated_at: string | null
  synced_at: string | null
  updated_at: string | null
}

export interface AdminRepositoriesListResult {
  repositories: AdminRepositoryRecord[]
  total: number
  page: number
  page_size: number
}

export interface AdminRepositoriesQuery {
  q?: string
  page?: number
  page_size?: number
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
  name?: string
  summary?: string
  overview?: string
  status_note?: string | null
  stage?: string
  project_type?: string
  visibility?: string
  is_featured?: boolean
  featured_rank?: number | null
  sort_order?: number | null
}

export interface CreateAdminProjectInput {
  name: string
  summary?: string
  stage: string
  project_type: string
  visibility: string
  sort_order: number
  overview?: string
  status_note?: string | null
  is_featured?: boolean
  featured_rank?: number | null
}

export interface AdminProjectRepositoryBindingInput {
  repo_full_name: string
  repo_url: string
  is_primary?: boolean
  source?: string
}

export interface AdminOverviewFailure {
  job_id: string
  project_id: string | null
  project_name: string
  reason: string
  failed_at: string | null
}

export interface AdminOverviewSummary {
  projects_total: number
  projects_public: number
  projects_draft: number
  sync_recent_success: number
  sync_recent_failed: number
  latest_failures: AdminOverviewFailure[]
}

export interface CreateAdminSyncJobInput {
  mode: 'project' | 'github_user'
  project_id?: string | number | bigint
  github_username?: string
}

export interface AdminSyncResultSummary {
  project_id: string | null
  fetched: number
  created: number
  updated: number
  deactivated: number
  synced: number
  failed: number
  synced_at: string | null
}

export interface CreateAdminSyncJobResult {
  job_id: string
  state: string
  created_at: string | null
  result: AdminSyncResultSummary | null
}

export interface AdminSyncJobRecord {
  job_id: string
  state: string
  mode: string
  project_id: string | null
  github_username: string | null
  created_at: string | null
  updated_at: string | null
  finished_at: string | null
  error_code: string | null
  error_message: string | null
  result: AdminSyncResultSummary | null
}

export interface AdminSyncJobStep {
  name: string
  state: string
  message: string
  at: string | null
}

export interface AdminSyncJobDetail extends AdminSyncJobRecord {
  steps: AdminSyncJobStep[]
  error_details: unknown
}

export interface AdminSyncJobsQuery {
  state?: string
  mode?: string
  page?: number
  page_size?: number
}

export interface AdminSyncJobsListResult {
  jobs: AdminSyncJobRecord[]
  total: number
  page: number
  page_size: number
}

export interface AdminLogsQuery {
  project_id?: string
  action?: string
  from?: string
  to?: string
  page?: number
  page_size?: number
}

export interface AdminLogRecord {
  id: string
  created_at: string | null
  action: string
  project_id: string | null
  project_name: string
  result: string
  operator_source: string
  message: string
}

export interface AdminLogsListResult {
  logs: AdminLogRecord[]
  total: number
  page: number
  page_size: number
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

function toNonNegativeInteger(value: unknown, fallback: number): number {
  const parsed = toFiniteNumber(value)
  if (parsed === null || parsed < 0) {
    return fallback
  }

  return Math.max(0, Math.round(parsed))
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

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function normalizeErrorCode(value: unknown): AdminProjectErrorCode {
  const code = toText(value).toLowerCase()
  if (
    code === 'unauthorized' ||
    code === 'validation_failed' ||
    code === 'project_not_found' ||
    code === 'project_slug_conflict' ||
    code === 'invalid_stage' ||
    code === 'invalid_project_type' ||
    code === 'invalid_visibility' ||
    code === 'invalid_link_type' ||
    code === 'invalid_primary_repository' ||
    code === 'repository_conflict' ||
    code === 'sync_job_not_found' ||
    code === 'sync_job_state_invalid' ||
    code === 'sync_rate_limited' ||
    code === 'sync_failed' ||
    code === 'internal_error' ||
    code === 'request_timeout' ||
    code === 'network_failed'
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

  const fallbackFields = [project.slug, project.uuid]
  for (const field of fallbackFields) {
    const value = toIdentifierText(field)
    if (value) {
      return value
    }
  }

  return ''
}

function normalizeProjectLinkedRepositoryRecord(value: unknown): AdminProjectLinkedRepositoryRecord | null {
  const payload = toRecord(value)
  if (!payload) {
    return null
  }

  const id = toIdentifierText(payload.id) || toIdentifierText(payload.project_repository_id)
  const repoFullName = toText(payload.repo_full_name) || toText(payload.full_name)
  if (!id || !repoFullName) {
    return null
  }

  return {
    id,
    repo_full_name: repoFullName,
    repo_name: toText(payload.repo_name) || repoFullName.split('/').slice(1).join('/') || repoFullName,
    repo_url: toText(payload.repo_url) || toText(payload.url) || toText(payload.html_url),
    visibility: toNullableText(payload.visibility),
    is_primary: toBoolean(payload.is_primary ?? payload.primary),
    source: toText(payload.source) || 'manual',
    description: toText(payload.description),
    language: toText(payload.language),
    stargazers_count: toNonNegativeInteger(payload.stargazers_count, 0),
    forks_count: toNonNegativeInteger(payload.forks_count, 0),
  }
}

function normalizeProjectLinksRecord(value: unknown): AdminProjectLinksRecord {
  const payload = toRecord(value)
  return {
    primary: toNullableText(payload?.primary),
    repo: toNullableText(payload?.repo),
    demo: toNullableText(payload?.demo),
    docs: toNullableText(payload?.docs),
    notes: toNullableText(payload?.notes),
  }
}

function normalizeProjectSourceRefsRecord(value: unknown): AdminProjectSourceRefsRecord {
  const payload = toRecord(value)
  return {
    repo_full_name: toNullableText(payload?.repo_full_name),
    repo_url: toNullableText(payload?.repo_url),
    visibility: toNullableText(payload?.visibility),
  }
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
    summary: toText(project.summary),
    overview: toText(project.overview),
    status_note: toNullableText(project.status_note),
    stage: toText(project.stage),
    project_type: toText(project.project_type),
    visibility: toText(project.visibility),
    is_featured: toBoolean(project.is_featured),
    featured_rank: toFiniteNumber(project.featured_rank ?? project.featuredRank),
    sort_order: toFiniteNumber(project.sort_order ?? project.sortOrder),
    links: normalizeProjectLinksRecord(project.links),
    stored_links: normalizeProjectLinksRecord(project.stored_links),
    source_refs: normalizeProjectSourceRefsRecord(project.source_refs),
    repositories: toArray(project.repositories)
      .map((entry) => normalizeProjectLinkedRepositoryRecord(entry))
      .filter((entry): entry is AdminProjectLinkedRepositoryRecord => Boolean(entry)),
    synced_at: toNullableText(project.synced_at),
    updated_at: toNullableText(project.updated_at),
  }
}

function normalizeRepositoryRecord(value: unknown): AdminRepositoryRecord | null {
  const payload = toRecord(value)
  if (!payload) {
    return null
  }

  const id = toIdentifierText(payload.id)
  const repoFullName = toText(payload.repo_full_name) || toText(payload.full_name)
  if (!id || !repoFullName) {
    return null
  }

  return {
    id,
    repo_full_name: repoFullName,
    repo_owner: toText(payload.repo_owner) || repoFullName.split('/')[0] || '',
    repo_name: toText(payload.repo_name) || repoFullName.split('/').slice(1).join('/') || '',
    repo_url: toText(payload.repo_url) || toText(payload.html_url),
    github_username: toNullableText(payload.github_username),
    description: toText(payload.description),
    language: toText(payload.language),
    stargazers_count: toNonNegativeInteger(payload.stargazers_count, 0),
    forks_count: toNonNegativeInteger(payload.forks_count, 0),
    open_issues_count: toNonNegativeInteger(payload.open_issues_count, 0),
    visibility: toText(payload.visibility),
    archived: toBoolean(payload.archived),
    fork: toBoolean(payload.fork),
    source: toText(payload.source),
    is_active: !Object.prototype.hasOwnProperty.call(payload, 'is_active') || toBoolean(payload.is_active),
    mapped_projects_count: toNonNegativeInteger(payload.mapped_projects_count, 0),
    pushed_at: toNullableText(payload.pushed_at),
    repo_created_at: toNullableText(payload.repo_created_at),
    repo_updated_at: toNullableText(payload.repo_updated_at),
    synced_at: toNullableText(payload.synced_at),
    updated_at: toNullableText(payload.updated_at),
  }
}

function normalizeRepositoriesList(value: unknown): AdminRepositoriesListResult {
  const payload = toRecord(value)
  const rawRepositories =
    (Array.isArray(value) ? value : null) ??
    (Array.isArray(payload?.repositories) ? payload?.repositories : null) ??
    (Array.isArray(payload?.items) ? payload?.items : null) ??
    []

  const repositories = rawRepositories
    .map((entry) => normalizeRepositoryRecord(entry))
    .filter((entry): entry is AdminRepositoryRecord => Boolean(entry))

  const pagination = toRecord(payload?.pagination)
  const total = toPositiveInteger(payload?.total ?? payload?.count ?? pagination?.total ?? repositories.length, repositories.length)
  const page = toPositiveInteger(payload?.page ?? pagination?.page ?? 1, 1)
  const rawPageSize = payload?.page_size ?? payload?.pageSize ?? pagination?.page_size ?? repositories.length
  const pageSize = toPositiveInteger(rawPageSize, 20)

  return {
    repositories,
    total,
    page,
    page_size: pageSize,
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

function normalizeOverviewFailure(value: unknown): AdminOverviewFailure | null {
  const payload = toRecord(value)
  if (!payload) {
    return null
  }

  const jobId = toIdentifierText(payload.job_id) || toIdentifierText(payload.id)
  const projectId = toIdentifierText(payload.project_id) || null
  const projectName = toText(payload.project_name) || toText(payload.project_slug) || toText(payload.project)
  const reason = toText(payload.reason) || toText(payload.error_message) || toText(payload.message)
  const failedAt = toNullableText(payload.failed_at) || toNullableText(payload.timestamp) || toNullableText(payload.created_at)

  if (!jobId && !projectName && !reason && !failedAt) {
    return null
  }

  return {
    job_id: jobId || '--',
    project_id: projectId,
    project_name: projectName,
    reason,
    failed_at: failedAt,
  }
}

function normalizeOverviewSummary(value: unknown): AdminOverviewSummary {
  const payload = toRecord(value)
  const failuresRaw = toArray(payload?.latest_failures ?? payload?.failures)

  return {
    projects_total: toNonNegativeInteger(payload?.projects_total, 0),
    projects_public: toNonNegativeInteger(payload?.projects_public, 0),
    projects_draft: toNonNegativeInteger(payload?.projects_draft, 0),
    sync_recent_success: toNonNegativeInteger(payload?.sync_recent_success, 0),
    sync_recent_failed: toNonNegativeInteger(payload?.sync_recent_failed, 0),
    latest_failures: failuresRaw
      .map((entry) => normalizeOverviewFailure(entry))
      .filter((entry): entry is AdminOverviewFailure => Boolean(entry)),
  }
}

function normalizeSyncResultSummary(value: unknown): AdminSyncResultSummary | null {
  const payload = toRecord(value)
  if (!payload) {
    return null
  }

  const projectId = toIdentifierText(payload.project_id) || null
  const fetched = toNonNegativeInteger(payload.fetched, 0)
  const created = toNonNegativeInteger(payload.created, 0)
  const updated = toNonNegativeInteger(payload.updated, 0)
  const deactivated = toNonNegativeInteger(payload.deactivated, 0)
  const synced = toNonNegativeInteger(payload.synced, 0)
  const failed = toNonNegativeInteger(payload.failed, 0)
  const syncedAt = toNullableText(payload.synced_at) || toNullableText(payload.syncedAt)

  const hasAnyValue =
    Boolean(projectId) ||
    fetched > 0 ||
    created > 0 ||
    updated > 0 ||
    deactivated > 0 ||
    synced > 0 ||
    failed > 0 ||
    Boolean(syncedAt)
  if (!hasAnyValue) {
    return null
  }

  return {
    project_id: projectId,
    fetched,
    created,
    updated,
    deactivated,
    synced,
    failed,
    synced_at: syncedAt,
  }
}

function normalizeSyncJobRecord(value: unknown): AdminSyncJobRecord | null {
  const payload = toRecord(value)
  if (!payload) {
    return null
  }

  const jobId = toIdentifierText(payload.job_id) || toIdentifierText(payload.id)
  if (!jobId) {
    return null
  }

  return {
    job_id: jobId,
    state: toText(payload.state).toLowerCase() || toText(payload.status).toLowerCase() || 'unknown',
    mode: toText(payload.mode).toLowerCase() || 'unknown',
    project_id: toIdentifierText(payload.project_id) || null,
    github_username: toNullableText(payload.github_username),
    created_at: toNullableText(payload.created_at),
    updated_at: toNullableText(payload.updated_at),
    finished_at: toNullableText(payload.finished_at) || toNullableText(payload.completed_at),
    error_code: toNullableText(payload.error_code),
    error_message: toNullableText(payload.error_message),
    result: normalizeSyncResultSummary(payload.result ?? payload.summary),
  }
}

function normalizeSyncJobsList(value: unknown): AdminSyncJobsListResult {
  const payload = toRecord(value)
  const rawJobs =
    (Array.isArray(value) ? value : null) ??
    (Array.isArray(payload?.jobs) ? payload?.jobs : null) ??
    (Array.isArray(payload?.items) ? payload?.items : null) ??
    []

  const jobs = rawJobs
    .map((entry) => normalizeSyncJobRecord(entry))
    .filter((entry): entry is AdminSyncJobRecord => Boolean(entry))

  const pagination = toRecord(payload?.pagination)
  const total = toPositiveInteger(payload?.total ?? payload?.count ?? pagination?.total ?? jobs.length, jobs.length)
  const page = toPositiveInteger(payload?.page ?? pagination?.page ?? 1, 1)
  const rawPageSize = payload?.page_size ?? payload?.pageSize ?? pagination?.page_size ?? 20
  const pageSize = toPositiveInteger(rawPageSize, 20)

  return {
    jobs,
    total,
    page,
    page_size: pageSize,
  }
}

function normalizeSyncJobStep(value: unknown): AdminSyncJobStep | null {
  const payload = toRecord(value)
  if (!payload) {
    return null
  }

  const name = toText(payload.name) || toText(payload.step) || toText(payload.action)
  const state = toText(payload.state).toLowerCase() || toText(payload.status).toLowerCase()
  const message = toText(payload.message) || toText(payload.detail)
  const at = toNullableText(payload.at) || toNullableText(payload.timestamp) || toNullableText(payload.created_at)

  if (!name && !state && !message && !at) {
    return null
  }

  return {
    name: name || 'step',
    state: state || 'unknown',
    message,
    at,
  }
}

function normalizeSyncJobDetail(value: unknown): AdminSyncJobDetail {
  const payload = toRecord(value)
  const base =
    normalizeSyncJobRecord(payload?.job) ??
    normalizeSyncJobRecord(payload?.item) ??
    normalizeSyncJobRecord(payload)

  if (!base) {
    throw new AdminProjectsApiError('Sync job detail payload is invalid.')
  }

  const rawSteps = toArray(payload?.steps ?? payload?.logs ?? payload?.events)
  const steps = rawSteps
    .map((entry) => normalizeSyncJobStep(entry))
    .filter((entry): entry is AdminSyncJobStep => Boolean(entry))

  return {
    ...base,
    steps,
    error_details: payload?.error_details ?? payload?.details ?? null,
  }
}

function normalizeCreateSyncJobResult(value: unknown): CreateAdminSyncJobResult {
  const payload = toRecord(value)
  const jobPayload = toRecord(payload?.job) ?? payload
  const record = normalizeSyncJobRecord(jobPayload)
  const jobId = toIdentifierText(payload?.job_id) || record?.job_id

  if (!jobId) {
    throw new AdminProjectsApiError('Sync job create payload is invalid.')
  }

  return {
    job_id: jobId,
    state: toText(payload?.state) || record?.state || 'queued',
    created_at: toNullableText(payload?.created_at) || record?.created_at || null,
    result: record?.result ?? normalizeSyncResultSummary(payload?.result ?? payload?.summary),
  }
}

function normalizeLogRecord(value: unknown): AdminLogRecord | null {
  const payload = toRecord(value)
  if (!payload) {
    return null
  }

  const createdAt = toNullableText(payload.created_at) || toNullableText(payload.timestamp) || toNullableText(payload.at)
  const action = toText(payload.action)
  const projectId = toIdentifierText(payload.project_id) || null
  const projectName = toText(payload.project_name) || toText(payload.project_slug) || ''
  const result = toText(payload.result) || toText(payload.status)
  const operatorSource = toText(payload.operator_source) || toText(payload.source) || toText(payload.operator)
  const message = toText(payload.message) || toText(payload.detail)
  const id =
    toIdentifierText(payload.id) ||
    toIdentifierText(payload.log_id) ||
    [createdAt || 'log', action || 'unknown', projectId || 'na'].join(':')

  if (!createdAt && !action && !projectId && !message && !result) {
    return null
  }

  return {
    id,
    created_at: createdAt,
    action,
    project_id: projectId,
    project_name: projectName,
    result,
    operator_source: operatorSource,
    message,
  }
}

function normalizeLogsList(value: unknown): AdminLogsListResult {
  const payload = toRecord(value)
  const rawLogs =
    (Array.isArray(value) ? value : null) ??
    (Array.isArray(payload?.logs) ? payload?.logs : null) ??
    (Array.isArray(payload?.items) ? payload?.items : null) ??
    []

  const logs = rawLogs
    .map((entry) => normalizeLogRecord(entry))
    .filter((entry): entry is AdminLogRecord => Boolean(entry))

  const pagination = toRecord(payload?.pagination)
  const total = toPositiveInteger(payload?.total ?? payload?.count ?? pagination?.total ?? logs.length, logs.length)
  const page = toPositiveInteger(payload?.page ?? pagination?.page ?? 1, 1)
  const rawPageSize = payload?.page_size ?? payload?.pageSize ?? pagination?.page_size ?? 20
  const pageSize = toPositiveInteger(rawPageSize, 20)

  return {
    logs,
    total,
    page,
    page_size: pageSize,
  }
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

function getTimeoutMs(overrideMs?: number): number {
  if (typeof overrideMs === 'number' && Number.isFinite(overrideMs) && overrideMs > 0) {
    return Math.floor(overrideMs)
  }

  const timeoutMs = getRuntimeConfig()?.REQUEST_TIMEOUT_MS
  if (typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return Math.floor(timeoutMs)
  }

  return 4000
}

function buildAdminUrl(pathname: string, query?: object): string {
  const base = `${getRuntimeApiBase()}${pathname}`
  if (!query) {
    return base
  }

  const searchParams = new URLSearchParams()

  for (const [key, rawValue] of Object.entries(query as Record<string, unknown>)) {
    if (rawValue === undefined || rawValue === null) {
      continue
    }

    if (typeof rawValue === 'string') {
      const text = rawValue.trim()
      if (text) {
        searchParams.set(key, text)
      }
      continue
    }

    if (typeof rawValue === 'number') {
      if (Number.isFinite(rawValue)) {
        searchParams.set(key, String(rawValue))
      }
      continue
    }

    if (typeof rawValue === 'boolean') {
      searchParams.set(key, rawValue ? 'true' : 'false')
      continue
    }

    if (typeof rawValue === 'bigint') {
      searchParams.set(key, rawValue.toString())
    }
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

type AdminRequestMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
type AdminRequestFailurePhase = 'main_request' | 'main_response_parse' | 'preflight_or_network' | 'timeout' | 'unknown'

interface AdminRequestFailureDetails {
  request_url: string
  method: AdminRequestMethod
  status: number | null
  phase: AdminRequestFailurePhase
  cause?: string
  preflight_hint?: string
}

function withRequestFailureDetails(
  error: AdminProjectsApiError,
  details: AdminRequestFailureDetails,
): AdminProjectsApiError {
  const existing = toRecord(error.details)
  const next: Record<string, unknown> = {
    ...(existing ?? {}),
    request_url: details.request_url,
    method: details.method,
    status: details.status,
    phase: details.phase,
  }

  if (details.cause) {
    next.cause = details.cause
  }
  if (details.preflight_hint) {
    next.preflight_hint = details.preflight_hint
  }

  error.details = next
  if (typeof details.status === 'number') {
    error.status = details.status
  }

  return error
}

function mergeAbortSignals(primary?: AbortSignal, secondary?: AbortSignal): AbortSignal | undefined {
  if (!primary) {
    return secondary
  }

  if (!secondary) {
    return primary
  }

  if (primary.aborted) {
    return primary
  }

  if (secondary.aborted) {
    return secondary
  }

  const controller = new AbortController()
  const abort = () => controller.abort()

  primary.addEventListener('abort', abort, { once: true })
  secondary.addEventListener('abort', abort, { once: true })

  return controller.signal
}

async function parseErrorFromResponse(response: Response): Promise<AdminProjectsApiError> {
  let message = ''
  let code: AdminProjectErrorCode = 'unknown'
  let details: unknown = null

  try {
    const body = (await response.json()) as {
      detail?: unknown
      message?: unknown
      error?: {
        code?: unknown
        message?: unknown
        details?: unknown
      } | null
    }

    const detailObject = toRecord(body.detail)
    const topLevelErrorObject = toRecord(body.error)
    const nestedErrorObject = toRecord(detailObject?.error)
    const errorObject = nestedErrorObject ?? topLevelErrorObject

    code = normalizeErrorCode(errorObject?.code ?? detailObject?.code)
    message =
      toText(errorObject?.message) ||
      toText(detailObject?.message) ||
      toText(body.message) ||
      toText(body.detail)
    details = errorObject?.details ?? detailObject?.details ?? null
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
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    body?: Record<string, unknown>
    signal?: AbortSignal
    query?: object
    timeoutMs?: number
  },
): Promise<T> {
  const method: AdminRequestMethod = options.method ?? 'GET'
  const requestUrl = buildAdminUrl(pathname, options.query)
  const timeoutMs = getTimeoutMs(options.timeoutMs)
  const timeoutController = typeof AbortController === 'function' ? new AbortController() : null
  const timerId =
    timeoutController &&
    globalThis.setTimeout(() => {
      timeoutController.abort()
    }, timeoutMs)

  try {
    const response = await fetch(requestUrl, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Admin-Token': options.token,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: mergeAbortSignals(options.signal, timeoutController?.signal),
    })

    if (!response.ok) {
      throw withRequestFailureDetails(await parseErrorFromResponse(response), {
        request_url: requestUrl,
        method,
        status: response.status,
        phase: 'main_request',
      })
    }

    if (response.status === 204) {
      return {} as T
    }

    try {
      return (await response.json()) as T
    } catch (error) {
      const cause = error instanceof Error ? toText(error.message) : ''
      throw withRequestFailureDetails(
        new AdminProjectsApiError('Admin response payload is not valid JSON.', {
          code: 'unknown',
          status: response.status,
        }),
        {
          request_url: requestUrl,
          method,
          status: response.status,
          phase: 'main_response_parse',
          cause,
        },
      )
    }
  } catch (error) {
    if (error instanceof AdminProjectsApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw withRequestFailureDetails(new AdminProjectsApiError('Admin request timed out.', { code: 'request_timeout' }), {
        request_url: requestUrl,
        method,
        status: null,
        phase: 'timeout',
      })
    }

    if (error instanceof TypeError) {
      const normalizedMessage = toText(error.message).toLowerCase()
      const isFailedToFetch = normalizedMessage.includes('failed to fetch') || normalizedMessage.includes('networkerror') || normalizedMessage.includes('load failed')
      if (isFailedToFetch) {
        throw withRequestFailureDetails(new AdminProjectsApiError('Network request failed.', { code: 'network_failed' }), {
          request_url: requestUrl,
          method,
          status: null,
          phase: 'preflight_or_network',
          cause: toText(error.message),
          preflight_hint: 'Check OPTIONS preflight response and CORS allow headers.',
        })
      }
    }

    if (error instanceof Error) {
      throw withRequestFailureDetails(new AdminProjectsApiError(error.message, { code: 'unknown' }), {
        request_url: requestUrl,
        method,
        status: null,
        phase: 'unknown',
        cause: toText(error.message),
      })
    }

    throw withRequestFailureDetails(new AdminProjectsApiError('Unknown admin request error.', { code: 'unknown' }), {
      request_url: requestUrl,
      method,
      status: null,
      phase: 'unknown',
    })
  } finally {
    if (timerId) {
      globalThis.clearTimeout(timerId)
    }
  }
}
function cleanUpdatePayload(input: AdminProjectUpdateInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  const fieldNames: Array<keyof AdminProjectUpdateInput> = [
    'name',
    'summary',
    'overview',
    'status_note',
    'stage',
    'project_type',
    'visibility',
    'is_featured',
    'featured_rank',
    'sort_order',
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

function cleanCreatePayload(input: CreateAdminProjectInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: input.name,
    summary: input.summary ?? '',
    stage: input.stage,
    project_type: input.project_type,
    visibility: input.visibility,
    sort_order: input.sort_order,
  }

  if (input.overview !== undefined) payload.overview = input.overview
  if (input.status_note !== undefined) payload.status_note = input.status_note
  if (input.is_featured !== undefined) payload.is_featured = input.is_featured
  if (input.featured_rank !== undefined) payload.featured_rank = input.featured_rank

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

export async function fetchAdminRepositories(
  token: string,
  query?: AdminRepositoriesQuery,
  signal?: AbortSignal,
): Promise<AdminRepositoriesListResult> {
  const payload = await requestJson<unknown>('/admin/repositories', {
    token: toText(token),
    method: 'GET',
    signal,
    query,
  })

  return normalizeRepositoriesList(payload)
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

export async function replaceAdminProjectLinks(
  token: string,
  projectId: string,
  links: AdminProjectLinksRecord,
  signal?: AbortSignal,
): Promise<AdminProjectRecord> {
  const normalizedProjectId = toIdentifierText(projectId)
  if (!normalizedProjectId) {
    throw new AdminProjectsApiError('Project id is required.')
  }

  const payload = await requestJson<unknown>(`/admin/projects/${encodeURIComponent(normalizedProjectId)}/links`, {
    token: toText(token),
    method: 'PUT',
    body: {
      links: {
        primary: links.primary,
        repo: links.repo,
        demo: links.demo,
        docs: links.docs,
        notes: links.notes,
      },
    },
    signal,
  })

  return normalizeProjectDetail(payload)
}

export async function replaceAdminProjectRepositories(
  token: string,
  projectId: string,
  repositories: AdminProjectRepositoryBindingInput[],
  signal?: AbortSignal,
): Promise<AdminProjectRecord> {
  const normalizedProjectId = toIdentifierText(projectId)
  if (!normalizedProjectId) {
    throw new AdminProjectsApiError('Project id is required.')
  }

  const payload = await requestJson<unknown>(`/admin/projects/${encodeURIComponent(normalizedProjectId)}/repositories`, {
    token: toText(token),
    method: 'PUT',
    body: {
      repositories: repositories.map((repository) => ({
        repo_full_name: toText(repository.repo_full_name),
        repo_url: toText(repository.repo_url),
        is_primary: repository.is_primary === true,
        source: toText(repository.source) || 'manual',
      })),
    },
    signal,
  })

  return normalizeProjectDetail(payload)
}

export async function deleteAdminProjectById(token: string, projectId: string, signal?: AbortSignal): Promise<void> {
  const normalizedProjectId = toIdentifierText(projectId)
  if (!normalizedProjectId) {
    throw new AdminProjectsApiError('Project id is required.')
  }

  await requestJson(`/admin/projects/${encodeURIComponent(normalizedProjectId)}`, {
    token: toText(token),
    method: 'DELETE',
    signal,
  })
}

export async function createAdminProject(
  token: string,
  input: CreateAdminProjectInput,
  signal?: AbortSignal,
): Promise<AdminProjectRecord> {
  const name = toText(input.name)
  const summary = toText(input.summary)
  const stage = toText(input.stage).toLowerCase()
  const projectType = toText(input.project_type).toLowerCase()
  const visibility = toText(input.visibility).toLowerCase()
  const sortOrder = toFiniteNumber(input.sort_order)

  if (!name || !stage || !projectType || !visibility || sortOrder === null || sortOrder < 1 || sortOrder > 99) {
    throw new AdminProjectsApiError('Create project payload is invalid.', { code: 'validation_failed' })
  }

  const payload = await requestJson<unknown>('/admin/projects', {
    token: toText(token),
    method: 'POST',
    body: cleanCreatePayload({
      ...input,
      name,
      summary,
      stage,
      project_type: projectType,
      visibility,
      sort_order: Math.round(sortOrder),
    }),
    signal,
    timeoutMs: 12000,
  })

  return normalizeProjectDetail(payload)
}

export async function fetchAdminOverview(token: string, signal?: AbortSignal): Promise<AdminOverviewSummary> {
  const payload = await requestJson<unknown>('/admin/overview', {
    token: toText(token),
    method: 'GET',
    signal,
  })

  return normalizeOverviewSummary(payload)
}

export async function createAdminSyncJob(
  token: string,
  input: CreateAdminSyncJobInput,
  signal?: AbortSignal,
): Promise<CreateAdminSyncJobResult> {
  const mode = toText(input.mode).toLowerCase()
  if (mode !== 'project' && mode !== 'github_user') {
    throw new AdminProjectsApiError('Sync mode is invalid.', { code: 'validation_failed' })
  }

  const body: Record<string, unknown> = { mode }

  if (mode === 'project') {
    const projectId = toIdentifierText(input.project_id)
    if (!projectId) {
      throw new AdminProjectsApiError('Project id is required for project mode.', { code: 'validation_failed' })
    }
    body.project_id = projectId
  } else {
    const githubUsername = toText(input.github_username)
    if (!githubUsername) {
      throw new AdminProjectsApiError('github_username is required for github_user mode.', { code: 'validation_failed' })
    }
    body.github_username = githubUsername
  }

  const payload = await requestJson<unknown>('/admin/sync/jobs', {
    token: toText(token),
    method: 'POST',
    body,
    signal,
    timeoutMs: 12000,
  })

  return normalizeCreateSyncJobResult(payload)
}

export async function fetchAdminSyncJobs(
  token: string,
  query?: AdminSyncJobsQuery,
  signal?: AbortSignal,
): Promise<AdminSyncJobsListResult> {
  const payload = await requestJson<unknown>('/admin/sync/jobs', {
    token: toText(token),
    method: 'GET',
    query,
    signal,
  })

  return normalizeSyncJobsList(payload)
}

export async function fetchAdminSyncJobById(token: string, jobId: string, signal?: AbortSignal): Promise<AdminSyncJobDetail> {
  const normalizedJobId = toIdentifierText(jobId)
  if (!normalizedJobId) {
    throw new AdminProjectsApiError('Job id is required.', { code: 'validation_failed' })
  }

  const payload = await requestJson<unknown>(`/admin/sync/jobs/${encodeURIComponent(normalizedJobId)}`, {
    token: toText(token),
    method: 'GET',
    signal,
  })

  return normalizeSyncJobDetail(payload)
}

export async function retryAdminSyncJob(token: string, jobId: string, signal?: AbortSignal): Promise<AdminSyncJobDetail> {
  const normalizedJobId = toIdentifierText(jobId)
  if (!normalizedJobId) {
    throw new AdminProjectsApiError('Job id is required.', { code: 'validation_failed' })
  }

  const payload = await requestJson<unknown>(`/admin/sync/jobs/${encodeURIComponent(normalizedJobId)}/retry`, {
    token: toText(token),
    method: 'POST',
    signal,
  })

  return normalizeSyncJobDetail(payload)
}

export async function fetchAdminLogs(token: string, query?: AdminLogsQuery, signal?: AbortSignal): Promise<AdminLogsListResult> {
  const payload = await requestJson<unknown>('/admin/logs', {
    token: toText(token),
    method: 'GET',
    query,
    signal,
  })

  return normalizeLogsList(payload)
}

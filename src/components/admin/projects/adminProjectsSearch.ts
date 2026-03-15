export interface AdminProjectsSearchState {
  q: string
  stage: string
  visibility: string
  page: number
  pageSize: number
  projectId: string
}

export const DEFAULT_ADMIN_PROJECTS_SEARCH_STATE: AdminProjectsSearchState = {
  q: '',
  stage: '',
  visibility: '',
  page: 1,
  pageSize: 10,
  projectId: '',
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toPositiveInteger(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return Math.max(1, Math.round(parsed))
}

function normalizePageSize(value: unknown): number {
  const candidate = toPositiveInteger(value, DEFAULT_ADMIN_PROJECTS_SEARCH_STATE.pageSize)
  if (candidate <= 10) return 10
  if (candidate <= 20) return 20
  if (candidate <= 50) return 50
  return 100
}

export function normalizeAdminProjectsSearchState(value: Record<string, unknown>): AdminProjectsSearchState {
  return {
    q: toText(value.q),
    stage: toText(value.stage).toLowerCase(),
    visibility: toText(value.visibility).toLowerCase(),
    page: toPositiveInteger(value.page, DEFAULT_ADMIN_PROJECTS_SEARCH_STATE.page),
    pageSize: normalizePageSize(value.pageSize),
    projectId: toText(value.projectId),
  }
}

export function toAdminProjectsRouteSearch(state: AdminProjectsSearchState): AdminProjectsSearchState {
  return {
    q: state.q,
    stage: state.stage,
    visibility: state.visibility,
    page: state.page,
    pageSize: state.pageSize,
    projectId: state.projectId,
  }
}

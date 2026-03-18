export interface AdminProjectSyncSearchState {
  projectId: string
}

export const DEFAULT_ADMIN_PROJECT_SYNC_SEARCH_STATE: AdminProjectSyncSearchState = {
  projectId: '',
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeAdminProjectSyncSearchState(value: Record<string, unknown>): AdminProjectSyncSearchState {
  return {
    projectId: toText(value.projectId),
  }
}

export function toAdminProjectSyncRouteSearch(state: AdminProjectSyncSearchState): AdminProjectSyncSearchState {
  return {
    projectId: state.projectId,
  }
}

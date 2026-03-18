import type { AdminProjectSyncSearchState } from './adminProjectSyncSearch'
import { AdminSyncConsolePage } from './AdminSyncConsolePage'

type AdminSyncRoutePageProps = {
  searchState?: AdminProjectSyncSearchState
}

export function AdminSyncRoutePage({ searchState }: AdminSyncRoutePageProps) {
  return <AdminSyncConsolePage searchState={searchState} />
}

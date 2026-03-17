import type { ReactNode } from 'react'
import { useAdminCompatPathNormalization } from '~/lib/adminCompatPathNormalization'

type AdminCompatRouteAdapterProps = {
  children: ReactNode
}

export function AdminCompatRouteAdapter({ children }: AdminCompatRouteAdapterProps) {
  useAdminCompatPathNormalization()
  return <>{children}</>
}

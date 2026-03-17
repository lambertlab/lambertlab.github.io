import type { ReactNode } from 'react'
import { usePublicCompatPathNormalization } from '~/lib/publicCompatPathNormalization'

type PublicCompatRouteAdapterProps = {
  children: ReactNode
}

export function PublicCompatRouteAdapter({ children }: PublicCompatRouteAdapterProps) {
  usePublicCompatPathNormalization()
  return <>{children}</>
}

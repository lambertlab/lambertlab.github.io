import type { ReactNode } from 'react'
import { useProjectsCompatPathNormalization } from '~/lib/projectsCompatPathNormalization'

type ProjectsCompatRouteAdapterProps = {
  children: ReactNode
}

export function ProjectsCompatRouteAdapter({ children }: ProjectsCompatRouteAdapterProps) {
  useProjectsCompatPathNormalization()
  return <>{children}</>
}

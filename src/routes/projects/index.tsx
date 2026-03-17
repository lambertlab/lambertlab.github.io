import { createFileRoute } from '@tanstack/react-router'
import { ProjectsCatalogRoutePage } from '~/components/projects/ProjectsCatalogRoutePage'
import { buildProjectsCatalogHead } from '~/components/projects/projectsCatalogHead'

export const Route = createFileRoute('/projects/')({
  head: () => buildProjectsCatalogHead(),
  component: ProjectsCatalogRoutePage,
})

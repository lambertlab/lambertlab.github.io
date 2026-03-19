import { createFileRoute } from '@tanstack/react-router'
import { ProjectsCatalogRoutePage } from '~/components/projects/ProjectsCatalogRoutePage'
import { buildProjectsCatalogHead } from '~/components/projects/projectsCatalogHead'
import { preloadProjectsCatalogPageData } from '~/lib/pageDataCache'

export const Route = createFileRoute('/projects/')({
  head: () => buildProjectsCatalogHead(),
  loader: () => preloadProjectsCatalogPageData(),
  component: ProjectsCatalogRoutePage,
})

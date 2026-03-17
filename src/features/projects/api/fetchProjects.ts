import { fetchProjectsList } from '~/lib/projectsApi'
import type { FetchProjectsListOptions, ProjectCatalogRecord } from '../model/projectTypes'

export type { FetchProjectsListOptions }

export async function fetchProjectsCatalog(options: FetchProjectsListOptions = {}): Promise<ProjectCatalogRecord[]> {
  const response = await fetchProjectsList(options)
  return response.projects
}

export async function fetchFeaturedProjects(
  options: Omit<FetchProjectsListOptions, 'featuredOnly'> = {},
): Promise<ProjectCatalogRecord[]> {
  return fetchProjectsCatalog({
    ...options,
    featuredOnly: true,
  })
}


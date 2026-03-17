import { ProjectDetailPage } from './ProjectDetailPage'

type ProjectDetailRoutePageProps = {
  slug: string
}

export function ProjectDetailRoutePage({ slug }: ProjectDetailRoutePageProps) {
  return <ProjectDetailPage slug={slug} />
}

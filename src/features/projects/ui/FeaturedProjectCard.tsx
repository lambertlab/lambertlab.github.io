import { Link } from '@tanstack/react-router'
import type { ProjectCatalogRecord } from '../model/projectTypes'

interface FeaturedProjectCardProps {
  project: ProjectCatalogRecord
  rankLabel?: string
}

export function FeaturedProjectCard({ project, rankLabel }: FeaturedProjectCardProps) {
  return (
    <Link className="featured-project-card bento-card" preload="intent" to={project.canonical_path}>
      <span className="accent-label text-slate-400">{rankLabel ?? 'Featured Project'}</span>
      <h3 className="font-bold mt-1">{project.name}</h3>
      <p className="text-xs text-slate-500 mt-2">{project.summary || project.description || 'Pending summary.'}</p>
      <div className="featured-chip-row">
        <span className="card-meta">{project.stage || 'pending'}</span>
        <span className="card-meta" data-meta-tone="neutral">
          {project.project_type || 'pending'}
        </span>
      </div>
    </Link>
  )
}


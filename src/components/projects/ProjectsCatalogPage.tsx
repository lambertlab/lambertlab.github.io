import { useProjectsCatalog } from '~/features/projects/hooks/useProjectsCatalog'
import { ProjectsCatalogFilters } from '~/features/projects/ui/ProjectsCatalogFilters'
import { ProjectsCatalogGrid } from '~/features/projects/ui/ProjectsCatalogGrid'
import { ProjectsCatalogMetrics } from '~/features/projects/ui/ProjectsCatalogMetrics'
import { ProjectsCatalogState } from '~/features/projects/ui/ProjectsCatalogState'
import { legacyPageMetadata } from '~/lib/siteCopy'
import { useDocumentMetadata, useUiLocale } from '~/lib/uiLocale'

const PAGE_COPY = {
  'zh-CN': {
    emptyCatalog: '目录为空（中性空态）。可在 /admin/projects 创建首条项目，或前往 /admin/sync 执行 github_user=lambertlab 导入。',
    emptyFiltered: '当前筛选条件无匹配项。可以放宽关键词或重置筛选。',
  },
  en: {
    emptyCatalog: 'Catalog is empty (neutral state). Create your first project in /admin/projects, or run github_user=lambertlab import in /admin/sync.',
    emptyFiltered: 'No projects match the current filters. Try loosening the query or clearing filters.',
  },
} as const

export function ProjectsCatalogPage() {
  const { locale } = useUiLocale()
  const catalog = useProjectsCatalog()
  const copy = PAGE_COPY[locale]

  useDocumentMetadata(legacyPageMetadata.projects.title[locale], legacyPageMetadata.projects.description[locale])

  const isFilteredEmpty = catalog.status === 'ready' && catalog.visibleProjects.length === 0
  const showEmpty = catalog.status === 'empty' || isFilteredEmpty
  const showGrid = catalog.status === 'ready' && catalog.visibleProjects.length > 0
  const emptyMessage = catalog.status === 'empty' ? copy.emptyCatalog : copy.emptyFiltered

  return (
    <main id="main-content" data-project-catalog>
      <section className="page-hero" aria-label={locale === 'zh-CN' ? '项目概览' : 'Projects overview'}>
        <ProjectsCatalogMetrics metrics={catalog.metrics} status={catalog.status} locale={locale} />
      </section>

      <ProjectsCatalogFilters
        query={catalog.query}
        onChange={catalog.updateQuery}
        onReset={catalog.resetQuery}
        locale={locale}
      />

      <section className="catalog-layout" aria-label="Project catalog">
        <ProjectsCatalogState
          status={catalog.status}
          message={catalog.message}
          emptyMessage={emptyMessage}
          showEmpty={showEmpty}
          onRetry={catalog.retry}
          locale={locale}
        />
        <ProjectsCatalogGrid projects={catalog.visibleProjects} locale={locale} hidden={!showGrid} />
      </section>
    </main>
  )
}

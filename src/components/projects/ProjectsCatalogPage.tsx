import { useProjectsCatalog } from '~/features/projects/hooks/useProjectsCatalog'
import { ProjectsCatalogFilters } from '~/features/projects/ui/ProjectsCatalogFilters'
import { ProjectsCatalogGrid } from '~/features/projects/ui/ProjectsCatalogGrid'
import { ProjectsCatalogMetrics } from '~/features/projects/ui/ProjectsCatalogMetrics'
import { ProjectsCatalogState } from '~/features/projects/ui/ProjectsCatalogState'
import { legacyPageMetadata } from '~/lib/siteCopy'
import { useDocumentMetadata, useUiLocale } from '~/lib/uiLocale'
const PAGE_COPY = {
  'zh-CN': {
    emptyCatalog: '\u76ee\u5f55\u4e3a\u7a7a\uff08\u4e2d\u6027\u7a7a\u6001\uff09\u3002\u53ef\u5728 /admin/projects \u521b\u5efa\u9996\u6761\u9879\u76ee\u3002',
    emptyFiltered: '当前筛选条件无匹配项。可以放宽关键词或重置筛选。',
  },
  en: {
    emptyCatalog: 'Catalog is empty (neutral state). Create your first project in /admin/projects.',
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

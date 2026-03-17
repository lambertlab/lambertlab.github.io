import { useProjectsCatalog } from '~/features/projects/hooks/useProjectsCatalog'
import { ProjectsCatalogFilters } from '~/features/projects/ui/ProjectsCatalogFilters'
import { ProjectsCatalogGrid } from '~/features/projects/ui/ProjectsCatalogGrid'
import { ProjectsCatalogMetrics } from '~/features/projects/ui/ProjectsCatalogMetrics'
import { ProjectsCatalogState } from '~/features/projects/ui/ProjectsCatalogState'
import { legacyPageMetadata } from '~/lib/siteCopy'
import { useDocumentMetadata, useUiLocale } from '~/lib/uiLocale'

const PAGE_COPY = {
  'zh-CN': {
    heroDesc: '浏览所有项目，按阶段、来源与类型快速筛选和发现。支持搜索、排序与 URL 分享。',
    chipStage: '阶段筛选',
    chipSource: '来源类型',
    chipType: '项目类型',
    chipReplay: 'URL Replay',
    emptyCatalog: '目录为空（中性空态）。可在 /admin/projects 创建首条项目，或前往 /admin/sync 执行 github_user=lambertlab 导入。',
    emptyFiltered: '当前筛选条件无匹配项。可以放宽关键词或重置筛选。',
    statusLoading: '正在读取目录数据...',
    statusReady: '目录加载成功。',
    statusReadyEmpty: '目录加载成功。当前暂无项目，但可继续执行创建或导入。',
    statusReadyFiltered: '目录加载成功，筛选后无匹配项。',
    statusError: '目录读取失败，可点击重试。',
    resultsMeta: (visible: number, total: number) => `显示 ${visible} / ${total} 个项目`,
  },
  en: {
    heroDesc: 'Browse every project with fast filters for stage, source, and type. Supports search, sorting, and URL replay.',
    chipStage: 'Stage Filter',
    chipSource: 'Source Type',
    chipType: 'Project Type',
    chipReplay: 'URL Replay',
    emptyCatalog: 'Catalog is empty (neutral state). Create your first project in /admin/projects, or run github_user=lambertlab import in /admin/sync.',
    emptyFiltered: 'No projects match the current filters. Try loosening the query or clearing filters.',
    statusLoading: 'Fetching the latest catalog data...',
    statusReady: 'Catalog loaded successfully.',
    statusReadyEmpty: 'Catalog loaded successfully. No projects yet, and intake actions are available.',
    statusReadyFiltered: 'Catalog loaded successfully, but no entries match the current filters.',
    statusError: 'Catalog loading failed. Click Retry to try again.',
    resultsMeta: (visible: number, total: number) => `Showing ${visible} / ${total} projects`,
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
  const fetchStatus = catalog.status === 'loading'
    ? copy.statusLoading
    : catalog.status === 'error'
      ? copy.statusError
      : catalog.status === 'empty'
        ? copy.statusReadyEmpty
        : isFilteredEmpty
          ? copy.statusReadyFiltered
          : copy.statusReady

  return (
    <main id="main-content" data-project-catalog>
      <section className="page-hero" aria-label="Projects intro">
        <div className="hero-grid">
          <div>
            <p className="hero-kicker">Project Catalog</p>
            <h1 className="hero-title">Explore the Project Catalog</h1>
            <p className="hero-desc">{copy.heroDesc}</p>
            <div className="hero-chip-row">
              <span className="chip">{copy.chipStage}</span>
              <span className="chip">{copy.chipSource}</span>
              <span className="chip">{copy.chipType}</span>
              <span className="chip">{copy.chipReplay}</span>
            </div>
          </div>
          <ProjectsCatalogMetrics metrics={catalog.metrics} status={catalog.status} locale={locale} />
        </div>
      </section>

      <ProjectsCatalogFilters
        query={catalog.query}
        onChange={catalog.updateQuery}
        onReset={catalog.resetQuery}
        tagCloud={catalog.tagCloud}
        fetchStatus={fetchStatus}
        resultsMeta={copy.resultsMeta(catalog.visibleProjects.length, catalog.projects.length)}
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

      <footer className="footer">
        <span>© 2026 LAMBERTLAB · PROJECTS</span>
        <span>
          <a href="https://github.com/lambertlab" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </span>
      </footer>
    </main>
  )
}
import { legacyPageMetadata } from '~/lib/siteCopy'
import { useRuntimeScripts } from '~/lib/useRuntimeScripts'
import { useDocumentMetadata, useUiLocale } from '~/lib/uiLocale'

const PROJECTS_RUNTIME_SCRIPTS = ['/js/projects-runtime.js', '/js/projects-catalog.js'] as const

export function ProjectsCatalogPage() {
  const { locale } = useUiLocale()

  useRuntimeScripts(PROJECTS_RUNTIME_SCRIPTS)
  useDocumentMetadata(legacyPageMetadata.projects.title[locale], legacyPageMetadata.projects.description[locale])

  return (
    <main id="main-content" data-project-catalog>
      <section className="page-hero" aria-label="Projects intro">
        <div className="hero-grid">
          <div>
            <p className="hero-kicker">Project Catalog</p>
            <h1 className="hero-title">Explore the Project Catalog</h1>
            <p className="hero-desc">浏览所有项目，按阶段、来源与类型快速筛选和发现。支持搜索、排序与 URL 分享。</p>
            <div className="hero-chip-row">
              <span className="chip">Stage Filter</span>
              <span className="chip">Source Type</span>
              <span className="chip">Project Type</span>
              <span className="chip">URL Replay</span>
            </div>
          </div>
          <div className="hero-metrics" aria-label="catalog metrics">
            <article className="metric">
              <p className="label">Projects</p>
              <p className="value" data-total-items>
                --
              </p>
              <p className="desc">目录项目总数</p>
            </article>
            <article className="metric">
              <p className="label">Active</p>
              <p className="value" data-live-items>
                --
              </p>
              <p className="desc">当前活跃项目数量</p>
            </article>
            <article className="metric">
              <p className="label">Last Updated</p>
              <p className="value" data-last-sync>
                Pending
              </p>
              <p className="desc">目录最近更新时间</p>
            </article>
            <article className="metric">
              <p className="label">Sources</p>
              <p className="value" data-source-count>
                --
              </p>
              <p className="desc">项目来源类型数量</p>
            </article>
          </div>
        </div>
      </section>

      <section className="control-strip" aria-label="Project controls">
        <div className="field">
          <label className="field-label" htmlFor="project-search">
            Search
          </label>
          <input className="field-input" id="project-search" type="search" placeholder="Search by name, summary, tags, stack" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="sort-by">
            Sort
          </label>
          <select className="field-select" id="sort-by">
            <option value="recent">Most Recent</option>
            <option value="stars">Stars</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="stage-filter">
            Stage
          </label>
          <select className="field-select" id="stage-filter">
            <option value="all">All</option>
            <option value="building">Building</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="research">Research</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="source-filter">
            Source
          </label>
          <select className="field-select" id="source-filter">
            <option value="all">All</option>
            <option value="github">GitHub</option>
            <option value="local">Local</option>
            <option value="private">Private</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="type-filter">
            Type
          </label>
          <select className="field-select" id="type-filter">
            <option value="all">All</option>
            <option value="website">Website</option>
            <option value="backend">Backend</option>
            <option value="tooling">Tooling</option>
            <option value="infra">Infra</option>
            <option value="research">Research</option>
            <option value="agent">Agent</option>
            <option value="data">Data</option>
            <option value="library">Library</option>
          </select>
        </div>
        <button className="ghost-btn" type="button" id="clear-filters">
          Clear
        </button>
      </section>

      <section className="catalog-layout" aria-label="Project catalog">
        <aside className="filter-panel" aria-label="Catalog filters">
          <section className="filter-group">
            <h2 className="filter-title">Highlight</h2>
            <div className="check-list">
              <label className="check-item">
                <input type="checkbox" id="featured-only" /> Featured only
              </label>
            </div>
          </section>

          <section className="filter-group">
            <h2 className="filter-title">Tags</h2>
            <div className="tag-cloud" data-tag-cloud>
              <span className="tag">Waiting</span>
            </div>
          </section>

          <section className="filter-group">
            <h2 className="filter-title">Status</h2>
            <p className="catalog-note" data-fetch-status>
              准备加载目录数据。
            </p>
          </section>
        </aside>

        <div className="results-panel">
          <div className="results-head">
            <div>
              <h2 className="results-title">Project Directory</h2>
              <p className="results-meta" data-results-meta>
                Loading projects...
              </p>
            </div>
            <div className="view-toggle" role="group" aria-label="View mode">
              <button className="view-btn active" data-view-mode="grid" type="button">
                Grid
              </button>
              <button className="view-btn" data-view-mode="list" type="button">
                List
              </button>
            </div>
          </div>

          <div className="catalog-state" data-loading-state role="status" aria-live="polite">
            正在加载项目目录...
          </div>
          <div className="catalog-state catalog-state-error" data-error-state hidden>
            <p className="catalog-state-title">目录加载失败</p>
            <p className="catalog-state-detail" data-error-detail>
              请求失败，请检查后端连接状态。
            </p>
            <button className="ghost-btn" type="button" id="retry-fetch">
              Retry
            </button>
          </div>

          <div className="projects-grid" data-project-grid data-view="grid" hidden></div>
          <p className="empty-state" data-empty-state hidden>
            未找到符合条件的项目。可以放宽关键词，或重置筛选后再试。
          </p>

          <div className="list-footer">
            <span>项目目录</span>
            <span>筛选状态自动同步到 URL，可刷新与分享回放。</span>
          </div>
        </div>
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

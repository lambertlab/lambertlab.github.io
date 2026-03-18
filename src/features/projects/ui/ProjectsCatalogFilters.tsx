import type { UiLocale } from '~/lib/uiLocale'
import {
  PROJECT_CATALOG_SORT_VALUES,
  PROJECT_CATALOG_SOURCE_VALUES,
  PROJECT_CATALOG_STAGE_VALUES,
  PROJECT_CATALOG_TYPE_VALUES,
  type ProjectCatalogQueryState,
} from '../model/projectTypes'

interface ProjectsCatalogFiltersProps {
  query: ProjectCatalogQueryState
  onChange: (patch: Partial<ProjectCatalogQueryState>) => void
  onReset?: () => void
  locale: UiLocale
}

const FILTER_COPY = {
  'zh-CN': {
    searchLabel: '搜索',
    searchPlaceholder: '按名称、摘要、标签、技术栈搜索',
    sortLabel: '排序',
    stageLabel: '阶段',
    sourceLabel: '来源',
    typeLabel: '类型',
    clearLabel: '重置',
    featuredOnly: '仅看精选',
    sort: { recent: '最近更新', stars: 'Stars', name: '名称 (A-Z)' },
    stage: { all: '全部阶段', building: '建设中', active: '活跃', maintenance: '维护中', research: '研究中', archived: '已归档' },
    source: { all: '全部来源', github: 'GitHub', local: '本地', private: '私有', hybrid: '混合' },
    type: { all: '全部类型', website: '站点', backend: '后端', tooling: '工具', infra: '基础设施', research: '研究', agent: '智能体', data: '数据', library: '库' },
  },
  en: {
    searchLabel: 'Search',
    searchPlaceholder: 'Search by name, summary, tags, stack',
    sortLabel: 'Sort',
    stageLabel: 'Stage',
    sourceLabel: 'Source',
    typeLabel: 'Type',
    clearLabel: 'Clear',
    featuredOnly: 'Featured only',
    sort: { recent: 'Most Recent', stars: 'Stars', name: 'Name (A-Z)' },
    stage: { all: 'All Stages', building: 'Building', active: 'Active', maintenance: 'Maintenance', research: 'Research', archived: 'Archived' },
    source: { all: 'All Sources', github: 'GitHub', local: 'Local', private: 'Private', hybrid: 'Hybrid' },
    type: { all: 'All Types', website: 'Website', backend: 'Backend', tooling: 'Tooling', infra: 'Infrastructure', research: 'Research', agent: 'Agent', data: 'Data', library: 'Library' },
  },
} as const

export function ProjectsCatalogFilters({ query, onChange, onReset, locale }: ProjectsCatalogFiltersProps) {
  const copy = FILTER_COPY[locale]

  return (
    <section className="control-strip" aria-label="Project controls">
      <div className="field">
        <label className="field-label sr-only" htmlFor="project-search" id="project-search-label">
          {copy.searchLabel}
        </label>
        <input
          className="field-input"
          id="project-search"
          type="search"
          placeholder={copy.searchPlaceholder}
          value={query.search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
      </div>

      <div className="field">
        <label className="field-label sr-only" htmlFor="sort-by" id="sort-by-label">
          {copy.sortLabel}
        </label>
        <select className="field-select" id="sort-by" value={query.sort} onChange={(event) => onChange({ sort: event.target.value as ProjectCatalogQueryState['sort'] })}>
          {PROJECT_CATALOG_SORT_VALUES.map((value) => (
            <option key={value} value={value}>{copy.sort[value]}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label sr-only" htmlFor="stage-filter" id="stage-filter-label">
          {copy.stageLabel}
        </label>
        <select className="field-select" id="stage-filter" value={query.stage} onChange={(event) => onChange({ stage: event.target.value as ProjectCatalogQueryState['stage'] })}>
          {PROJECT_CATALOG_STAGE_VALUES.map((value) => (
            <option key={value} value={value}>{copy.stage[value]}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label sr-only" htmlFor="source-filter" id="source-filter-label">
          {copy.sourceLabel}
        </label>
        <select className="field-select" id="source-filter" value={query.source} onChange={(event) => onChange({ source: event.target.value as ProjectCatalogQueryState['source'] })}>
          {PROJECT_CATALOG_SOURCE_VALUES.map((value) => (
            <option key={value} value={value}>{copy.source[value]}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label sr-only" htmlFor="type-filter" id="type-filter-label">
          {copy.typeLabel}
        </label>
        <select className="field-select" id="type-filter" value={query.type} onChange={(event) => onChange({ type: event.target.value as ProjectCatalogQueryState['type'] })}>
          {PROJECT_CATALOG_TYPE_VALUES.map((value) => (
            <option key={value} value={value}>{copy.type[value]}</option>
          ))}
        </select>
      </div>

      <label className="featured-only-control" htmlFor="featured-only">
        <input type="checkbox" id="featured-only" checked={query.featuredOnly} onChange={(event) => onChange({ featuredOnly: event.target.checked })} />
        <span>{copy.featuredOnly}</span>
      </label>

      {onReset ? (
        <button className="ghost-btn" type="button" id="clear-filters" onClick={onReset}>
          {copy.clearLabel}
        </button>
      ) : null}
    </section>
  )
}

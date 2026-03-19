import type { UiLocale } from '~/lib/uiLocale'
import type { ProjectCatalogRecord, ProjectsLoadStatus } from '../model/projectTypes'
interface FeaturedProjectsSectionProps {
  status: ProjectsLoadStatus
  projects: ProjectCatalogRecord[]
  message?: string | null
  onRetry?: () => void
  locale: UiLocale
  directoryHref?: string
}
interface FeaturedCopy {
  loadingTitle: string
  loadingSummaries: [string, string, string]
  loadingRank: string
  featuredLabel: string
  featuredHashLabel: string
  untitledProject: string
  missingSummary: string
  pendingLabel: string
  pendingType: string
  pendingSource: string
  emptyRank: string
  emptyTitle: string
  emptySummary: string
  emptyStage: string
  emptyType: string
  emptySource: string
  errorRank: string
  errorTitle: string
  errorSummary: string
  errorStage: string
  errorType: string
  errorSource: string
  idleRank: string
  idleTitle: string
  idleSummary: string
  idleStage: string
  idleType: string
  idleSource: string
  directoryLabel: string
  directoryTitle: string
  directorySummary: string
  directoryMeta: string
  retryLabel: string
}
interface FeaturedSlotModel {
  href: string
  state: 'loading' | 'ready' | 'empty' | 'error' | 'idle'
  rank: string
  title: string
  summary: string
  stage: string
  type: string
  source?: string | null
  busy?: boolean
}
const FEATURED_COPY: Record<UiLocale, FeaturedCopy> = {
  'zh-CN': {
    loadingTitle: 'Loading featured project',
    loadingSummaries: [
      '正在从统一 Projects 真相源加载首页精选。',
      '目录精选会与首页卡片保持同一字段口径。',
      '主动作将统一进入详情主路径。',
    ],
    loadingRank: 'Featured Projects',
    featuredLabel: '精选项目',
    featuredHashLabel: '精选 #',
    untitledProject: '未命名项目',
    missingSummary: '暂未提供摘要。',
    pendingLabel: '待补充',
    pendingType: '类型待补充',
    pendingSource: '来源待补充',
    emptyRank: '项目目录',
    emptyTitle: '暂无项目',
    emptySummary: '\u5f53\u524d\u4e3a\u4e2d\u6027\u7a7a\u6001\u3002\u53ef\u524d\u5f80 /admin/projects \u521b\u5efa\u9996\u6761\u9879\u76ee\u3002',
    emptyStage: '目录为空',
    emptyType: '可继续操作',
    emptySource: '可用收录通道',
    errorRank: '精选项目',
    errorTitle: '精选项目暂时不可用',
    errorSummary: '打开项目目录继续浏览。',
    errorStage: '目录',
    errorType: '兜底',
    errorSource: '稍后重试',
    idleRank: '项目目录',
    idleTitle: '浏览完整目录',
    idleSummary: '更多项目可在目录页查看，并统一进入详情主路径。',
    idleStage: '目录',
    idleType: '查看全部',
    idleSource: '项目',
    directoryLabel: 'Project Directory',
    directoryTitle: 'Browse All Projects',
    directorySummary: '打开完整目录，继续使用搜索、筛选、URL Replay 与详情入口。',
    directoryMeta: 'entry · catalog',
    retryLabel: '重试',
  },
  en: {
    loadingTitle: 'Loading featured project',
    loadingSummaries: [
      'Loading featured projects from the unified Projects source of truth.',
      'Home featured cards stay aligned with the catalog field contract.',
      'Primary actions continue through the shared detail path.',
    ],
    loadingRank: 'Featured Projects',
    featuredLabel: 'Featured Project',
    featuredHashLabel: 'Featured #',
    untitledProject: 'Untitled Project',
    missingSummary: 'No summary provided.',
    pendingLabel: 'Pending',
    pendingType: 'Type pending',
    pendingSource: 'Source pending',
    emptyRank: 'Project Directory',
    emptyTitle: 'No projects yet',
    emptySummary: 'This is a neutral empty state. Create in /admin/projects.',
    emptyStage: 'Empty catalog',
    emptyType: 'Action available',
    emptySource: 'Intake channels',
    errorRank: 'Featured Projects',
    errorTitle: 'Featured projects are temporarily unavailable',
    errorSummary: 'Open the Projects directory to continue browsing.',
    errorStage: 'Catalog',
    errorType: 'Fallback',
    errorSource: 'Retry later',
    idleRank: 'Project Directory',
    idleTitle: 'Browse the full catalog',
    idleSummary: 'More projects are available in the directory, with a shared detail entry path.',
    idleStage: 'Catalog',
    idleType: 'Browse all',
    idleSource: 'Projects',
    directoryLabel: 'Project Directory',
    directoryTitle: 'Browse All Projects',
    directorySummary: 'Open the full catalog to continue with search, filters, URL replay, and detail entry.',
    directoryMeta: 'entry · catalog',
    retryLabel: 'Retry',
  },
}
function buildLoadingSlot(index: number, copy: FeaturedCopy): FeaturedSlotModel {
  return {
    href: '/projects/',
    state: 'loading',
    rank: copy.loadingRank,
    title: index === 1 ? 'Loading next featured project' : copy.loadingTitle,
    summary: copy.loadingSummaries[index] ?? copy.loadingSummaries[0],
    stage: 'Loading',
    type: copy.pendingType,
    source: copy.pendingSource,
    busy: true,
  }
}
function buildEmptySlot(copy: FeaturedCopy): FeaturedSlotModel {
  return {
    href: '/projects/',
    state: 'empty',
    rank: copy.emptyRank,
    title: copy.emptyTitle,
    summary: copy.emptySummary,
    stage: copy.emptyStage,
    type: copy.emptyType,
    source: copy.emptySource,
  }
}
function buildErrorSlot(copy: FeaturedCopy, message?: string | null): FeaturedSlotModel {
  return {
    href: '/projects/',
    state: 'error',
    rank: copy.errorRank,
    title: copy.errorTitle,
    summary: message?.trim() || copy.errorSummary,
    stage: copy.errorStage,
    type: copy.errorType,
    source: copy.errorSource,
  }
}
function buildIdleSlot(copy: FeaturedCopy): FeaturedSlotModel {
  return {
    href: '/projects/',
    state: 'idle',
    rank: copy.idleRank,
    title: copy.idleTitle,
    summary: copy.idleSummary,
    stage: copy.idleStage,
    type: copy.idleType,
    source: copy.idleSource,
  }
}
function buildReadySlot(project: ProjectCatalogRecord, index: number, copy: FeaturedCopy): FeaturedSlotModel {
  return {
    href: project.canonical_path,
    state: 'ready',
    rank: project.featured_rank ? `${copy.featuredHashLabel}${project.featured_rank}` : copy.featuredLabel,
    title: project.name || copy.untitledProject,
    summary: project.summary || project.description || copy.missingSummary,
    stage: project.stage || copy.pendingLabel,
    type: project.project_type || copy.pendingType,
    source: project.source_type || copy.pendingSource,
    busy: false,
  }
}
function renderArrow() {
  return (
    <div className="featured-project-arrow" aria-hidden="true">
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
      </svg>
    </div>
  )
}
function renderSlot(index: number, slot: FeaturedSlotModel) {
  const isHero = index === 0
  const className = isHero
    ? 'bento-card col-span-2 flex justify-between items-center group featured-project-card featured-project-card-hero'
    : 'bento-card featured-project-card'
  return (
    <a
      key={index}
      className={className}
      data-home-featured-slot={String(index)}
      data-featured-state={slot.state}
      href={slot.href}
      aria-busy={slot.busy ? 'true' : undefined}
    >
      {isHero ? (
        <>
          <div className="featured-project-copy">
            <span className="accent-label text-blue-600" data-project-rank>
              {slot.rank}
            </span>
            <h3 className="font-bold text-lg" data-project-name>
              {slot.title}
            </h3>
            <p className="text-xs text-slate-500 mt-2" data-project-summary>
              {slot.summary}
            </p>
            <div className="featured-chip-row">
              <span className="card-meta" data-project-stage>
                {slot.stage}
              </span>
              <span className="card-meta" data-meta-tone="neutral" data-project-type>
                {slot.type}
              </span>
              <span className="card-meta" data-meta-tone="neutral" data-project-source>
                {slot.source}
              </span>
            </div>
          </div>
          {renderArrow()}
        </>
      ) : (
        <>
          <span className="accent-label text-slate-400" data-project-rank>
            {slot.rank}
          </span>
          <h3 className="font-bold mt-1" data-project-name>
            {slot.title}
          </h3>
          <p className="text-xs text-slate-500 mt-2" data-project-summary>
            {slot.summary}
          </p>
          <div className="featured-chip-row">
            <span className="card-meta" data-project-stage>
              {slot.stage}
            </span>
            <span className="card-meta" data-meta-tone="neutral" data-project-type>
              {slot.type}
            </span>
          </div>
        </>
      )}
    </a>
  )
}
export function FeaturedProjectsSection({
  status,
  projects,
  message = null,
  onRetry,
  locale,
  directoryHref = '/projects/',
}: FeaturedProjectsSectionProps) {
  const copy = FEATURED_COPY[locale]
  const slots = Array.from({ length: 3 }, (_, index) => {
    if (status === 'loading') {
      return buildLoadingSlot(index, copy)
    }
    if (status === 'error') {
      return buildErrorSlot(copy, message)
    }
    if (status === 'empty') {
      return buildEmptySlot(copy)
    }
    const project = projects[index]
    return project ? buildReadySlot(project, index, copy) : buildIdleSlot(copy)
  })
  return (
    <>
      <div className="panel-content-grid grid grid-cols-2 gap-4 flex-grow relative z-10" data-home-featured-projects>
        {slots.map((slot, index) => renderSlot(index, slot))}
        <a className="bento-card col-span-2 featured-directory-card" href={directoryHref}>
          <span className="accent-label text-slate-400">{copy.directoryLabel}</span>
          <h3 className="font-bold mt-1">{copy.directoryTitle}</h3>
          <p className="text-xs text-slate-500 mt-2">{copy.directorySummary}</p>
          <span className="card-meta" data-meta-tone="neutral">
            {copy.directoryMeta}
          </span>
        </a>
      </div>
      {status === 'error' && onRetry ? (
        <div className="catalog-note mt-4 flex items-center gap-3" role="status" aria-live="polite">
          <span>{message?.trim() || copy.errorSummary}</span>
          <button className="ghost-btn" type="button" onClick={onRetry}>
            {copy.retryLabel}
          </button>
        </div>
      ) : null}
    </>
  )
}

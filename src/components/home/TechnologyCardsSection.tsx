import type { HomeCard } from '~/lib/homeApi'
import type { UiLocale } from '~/lib/uiLocale'
import type { HomeCardsStatus } from './hooks/useHomeSnapshot'

interface TechnologyCardsSectionProps {
  status: HomeCardsStatus
  cards: HomeCard[]
  message?: string | null
  onRetry?: () => void
  locale: UiLocale
  directoryHref?: string
}

interface TechnologyCopy {
  defaultAccent: string
  loadingTitle: string
  loadingSummaries: [string, string, string]
  loadingMeta: string
  emptyTitle: string
  emptySummary: string
  emptyMeta: string
  errorTitle: string
  errorSummary: string
  errorMeta: string
  idleTitle: string
  idleSummary: string
  idleMeta: string
  untitledCard: string
  openInternal: string
  openExternal: string
  directoryLabel: string
  directoryTitle: string
  directorySummary: string
  directoryMeta: string
  retryLabel: string
}

interface TechnologySlotModel {
  accent: string
  title: string
  description: string
  href: string
  external: boolean
  state: 'loading' | 'ready' | 'empty' | 'error' | 'idle'
  meta: string
  busy?: boolean
}

const TECHNOLOGY_COPY: Record<UiLocale, TechnologyCopy> = {
  'zh-CN': {
    defaultAccent: 'Technology',
    loadingTitle: '正在加载 Technology 卡片',
    loadingSummaries: [
      '正在从统一 Home 快照读取首页精选技术内容。',
      'Technology 与 Life 会共享同一个首页公开读模型。',
      '请求完成后会替换为真实精选卡片。',
    ],
    loadingMeta: 'loading - home',
    emptyTitle: '暂无精选技术内容',
    emptySummary: '当前 Home 快照中还没有可展示的 Technology 卡片。',
    emptyMeta: 'empty - home',
    errorTitle: 'Technology 面板暂时不可用',
    errorSummary: '当前无法读取首页 Home 快照，请稍后重试。',
    errorMeta: 'error - retry',
    idleTitle: '更多技术内容即将加入',
    idleSummary: '当前精选位未占满，可继续前往 Projects 目录查看完整技术内容。',
    idleMeta: 'home feed',
    untitledCard: '未命名卡片',
    openInternal: '打开',
    openExternal: '打开外部链接',
    directoryLabel: 'Project Directory',
    directoryTitle: 'Browse All Projects',
    directorySummary: '打开完整项目目录，继续查看当前技术内容的主要来源。',
    directoryMeta: 'entry · catalog',
    retryLabel: '重试',
  },
  en: {
    defaultAccent: 'Technology',
    loadingTitle: 'Loading technology cards',
    loadingSummaries: [
      'Loading the homepage technology feed from the unified Home snapshot.',
      'Technology and Life now share one public homepage read model.',
      'Live featured cards replace these placeholders once the request finishes.',
    ],
    loadingMeta: 'loading - home',
    emptyTitle: 'No technology highlights yet',
    emptySummary: 'There are no technology cards in the Home snapshot right now.',
    emptyMeta: 'empty - home',
    errorTitle: 'Technology panel is temporarily unavailable',
    errorSummary: 'Unable to read the homepage Home snapshot right now. Please retry.',
    errorMeta: 'error - retry',
    idleTitle: 'More technology is on the way',
    idleSummary: 'The featured slots are not full yet. Open the Projects directory to browse the current source.',
    idleMeta: 'home feed',
    untitledCard: 'Untitled Card',
    openInternal: 'Open',
    openExternal: 'Open external link',
    directoryLabel: 'Project Directory',
    directoryTitle: 'Browse All Projects',
    directorySummary: 'Open the full project directory to continue browsing the current technology source.',
    directoryMeta: 'entry · catalog',
    retryLabel: 'Retry',
  },
}

function buildLoadingSlot(index: number, copy: TechnologyCopy): TechnologySlotModel {
  return {
    accent: copy.defaultAccent,
    title: index === 0 ? copy.loadingTitle : 'Loading next technology card',
    description: copy.loadingSummaries[index] ?? copy.loadingSummaries[0],
    href: '',
    external: false,
    state: 'loading',
    meta: copy.loadingMeta,
    busy: true,
  }
}

function buildReadySlot(card: HomeCard, copy: TechnologyCopy): TechnologySlotModel {
  return {
    accent: card.accent || copy.defaultAccent,
    title: card.title || copy.untitledCard,
    description: card.description,
    href: card.href,
    external: card.external,
    state: 'ready',
    meta: card.href ? (card.external ? copy.openExternal : copy.openInternal) : copy.directoryMeta,
  }
}

function buildEmptySlot(copy: TechnologyCopy): TechnologySlotModel {
  return {
    accent: copy.defaultAccent,
    title: copy.emptyTitle,
    description: copy.emptySummary,
    href: '',
    external: false,
    state: 'empty',
    meta: copy.emptyMeta,
  }
}

function buildErrorSlot(copy: TechnologyCopy, message?: string | null): TechnologySlotModel {
  return {
    accent: copy.defaultAccent,
    title: copy.errorTitle,
    description: message?.trim() || copy.errorSummary,
    href: '',
    external: false,
    state: 'error',
    meta: copy.errorMeta,
  }
}

function buildIdleSlot(copy: TechnologyCopy): TechnologySlotModel {
  return {
    accent: copy.defaultAccent,
    title: copy.idleTitle,
    description: copy.idleSummary,
    href: '',
    external: false,
    state: 'idle',
    meta: copy.idleMeta,
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

function renderSlot(index: number, slot: TechnologySlotModel) {
  const isHero = index === 0
  const className = isHero
    ? 'bento-card col-span-2 flex justify-between items-center group featured-project-card featured-project-card-hero'
    : 'bento-card featured-project-card'
  const content = isHero ? (
    <>
      <div className="featured-project-copy">
        <span className="accent-label text-blue-600">{slot.accent}</span>
        <h3 className="font-bold text-lg" data-technology-card-title>
          {slot.title}
        </h3>
        <p className="text-xs text-slate-500 mt-2">{slot.description}</p>
        <div className="featured-chip-row">
          <span className="card-meta" data-meta-tone={slot.state === 'error' ? 'neutral' : undefined}>
            {slot.meta}
          </span>
        </div>
      </div>
      {renderArrow()}
    </>
  ) : (
    <>
      <span className="accent-label text-slate-400">{slot.accent}</span>
      <h3 className="font-bold mt-1" data-technology-card-title>
        {slot.title}
      </h3>
      <p className="text-xs text-slate-500 mt-2">{slot.description}</p>
      <div className="featured-chip-row">
        <span className="card-meta" data-meta-tone={slot.state === 'error' ? 'neutral' : undefined}>
          {slot.meta}
        </span>
      </div>
    </>
  )

  if (!slot.href) {
    return (
      <article
        key={`technology-slot-${index}`}
        className={className}
        data-home-technology-slot={String(index)}
        data-technology-state={slot.state}
        aria-busy={slot.busy ? 'true' : undefined}
      >
        {content}
      </article>
    )
  }

  return (
    <a
      key={`technology-slot-${index}`}
      className={className}
      data-home-technology-slot={String(index)}
      data-technology-state={slot.state}
      href={slot.href}
      target={slot.external ? '_blank' : undefined}
      rel={slot.external ? 'noreferrer' : undefined}
      aria-busy={slot.busy ? 'true' : undefined}
    >
      {content}
    </a>
  )
}

export function TechnologyCardsSection({
  status,
  cards,
  message = null,
  onRetry,
  locale,
  directoryHref = '/projects/',
}: TechnologyCardsSectionProps) {
  const copy = TECHNOLOGY_COPY[locale]
  const slots = Array.from({ length: 3 }, (_, index) => {
    if (status === 'loading') {
      return buildLoadingSlot(index, copy)
    }

    if (status === 'error') {
      return buildErrorSlot(copy, message)
    }

    if (status === 'empty') {
      return index === 0 ? buildEmptySlot(copy) : buildIdleSlot(copy)
    }

    const card = cards[index]
    return card ? buildReadySlot(card, copy) : buildIdleSlot(copy)
  })

  return (
    <>
      <div className="panel-content-grid grid grid-cols-2 gap-4 flex-grow relative z-10" data-home-technology-cards>
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
          <button className="ghost-btn" id="retry-home-technology" type="button" onClick={onRetry}>
            {copy.retryLabel}
          </button>
        </div>
      ) : null}
    </>
  )
}

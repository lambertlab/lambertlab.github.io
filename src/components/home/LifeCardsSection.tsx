import type { HomeCard } from '~/lib/homeApi'
import type { UiLocale } from '~/lib/uiLocale'
import type { HomeCardsStatus } from './hooks/useHomeSnapshot'

interface LifeCardsSectionProps {
  status: HomeCardsStatus
  cards: HomeCard[]
  message?: string | null
  onRetry?: () => void
  locale: UiLocale
}

interface LifeCopy {
  loadingAccent: string
  loadingTitle: string
  loadingSummaries: [string, string, string]
  loadingMeta: string
  emptyAccent: string
  emptyTitle: string
  emptySummary: string
  emptyMeta: string
  errorAccent: string
  errorTitle: string
  errorSummary: string
  errorMeta: string
  openInternal: string
  openExternal: string
  databaseMeta: string
  retryLabel: string
  untitledCard: string
}

interface LifeSlotModel {
  accent: string
  title: string
  description: string
  href: string
  external: boolean
  state: 'loading' | 'ready' | 'empty' | 'error'
  meta: string
  busy?: boolean
}

const LIFE_COPY: Record<UiLocale, LifeCopy> = {
  'zh-CN': {
    loadingAccent: 'Life',
    loadingTitle: '\u6b63\u5728\u52a0\u8f7d Life \u5361\u7247',
    loadingSummaries: [
      '\u6b63\u5728\u4ece\u6570\u636e\u5e93\u8bfb\u53d6\u9996\u9875 Life \u9762\u677f\u3002',
      '\u5c55\u793a\u5185\u5bb9\u4f1a\u76f4\u63a5\u4e0e\u540e\u53f0\u5b58\u50a8\u4fdd\u6301\u4e00\u81f4\u3002',
      '\u8bf7\u6c42\u5b8c\u6210\u540e\u4f1a\u66ff\u6362\u4e3a\u5b9e\u65f6\u5361\u7247\u3002',
    ],
    loadingMeta: 'loading - database',
    emptyAccent: 'Life',
    emptyTitle: '\u6682\u65e0 Life \u5361\u7247',
    emptySummary: '\u5f53\u524d\u6570\u636e\u5e93\u4e2d\u8fd8\u6ca1\u6709\u53ef\u5c55\u793a\u7684 Life \u9762\u677f\u5185\u5bb9\u3002',
    emptyMeta: 'empty - database',
    errorAccent: 'Life',
    errorTitle: 'Life \u9762\u677f\u6682\u65f6\u4e0d\u53ef\u7528',
    errorSummary: '\u5f53\u524d\u65e0\u6cd5\u8bfb\u53d6\u6570\u636e\u5e93\u4e2d\u7684 Life \u5361\u7247\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002',
    errorMeta: 'error - retry',
    openInternal: '\u6253\u5f00',
    openExternal: '\u6253\u5f00\u5916\u90e8\u94fe\u63a5',
    databaseMeta: 'database',
    retryLabel: '\u91cd\u8bd5',
    untitledCard: '\u672a\u547d\u540d\u5361\u7247',
  },
  en: {
    loadingAccent: 'Life',
    loadingTitle: 'Loading life cards',
    loadingSummaries: [
      'Loading the homepage life panel from the database.',
      'Rendered content stays aligned with stored home cards.',
      'Live cards replace these placeholders once the request finishes.',
    ],
    loadingMeta: 'loading - database',
    emptyAccent: 'Life',
    emptyTitle: 'No life cards yet',
    emptySummary: 'There are no active life cards stored in the database right now.',
    emptyMeta: 'empty - database',
    errorAccent: 'Life',
    errorTitle: 'Life panel is temporarily unavailable',
    errorSummary: 'Unable to read the life cards from the database right now. Please retry.',
    errorMeta: 'error - retry',
    openInternal: 'Open',
    openExternal: 'Open external link',
    databaseMeta: 'database',
    retryLabel: 'Retry',
    untitledCard: 'Untitled Card',
  },
}

function getCardClassName(index: number): string {
  if (index === 0) {
    return 'bento-card col-span-2 border-orange-100'
  }

  if (index % 2 === 1) {
    return 'bento-card border-emerald-100'
  }

  return 'bento-card border-slate-200'
}

function getAccentClassName(index: number): string {
  if (index === 0) {
    return 'accent-label text-orange-600'
  }

  if (index % 2 === 1) {
    return 'accent-label text-emerald-600'
  }

  return 'accent-label text-slate-600'
}

function buildLoadingSlot(index: number, copy: LifeCopy): LifeSlotModel {
  return {
    accent: copy.loadingAccent,
    title: copy.loadingTitle,
    description: copy.loadingSummaries[index] ?? copy.loadingSummaries[0],
    href: '',
    external: false,
    state: 'loading',
    meta: copy.loadingMeta,
    busy: true,
  }
}

function buildEmptySlot(copy: LifeCopy): LifeSlotModel {
  return {
    accent: copy.emptyAccent,
    title: copy.emptyTitle,
    description: copy.emptySummary,
    href: '',
    external: false,
    state: 'empty',
    meta: copy.emptyMeta,
  }
}

function buildErrorSlot(copy: LifeCopy, message?: string | null): LifeSlotModel {
  return {
    accent: copy.errorAccent,
    title: copy.errorTitle,
    description: message?.trim() || copy.errorSummary,
    href: '',
    external: false,
    state: 'error',
    meta: copy.errorMeta,
  }
}

function buildReadySlot(card: HomeCard, copy: LifeCopy): LifeSlotModel {
  return {
    accent: card.accent || copy.emptyAccent,
    title: card.title || copy.untitledCard,
    description: card.description,
    href: card.href,
    external: card.external,
    state: 'ready',
    meta: card.href ? (card.external ? copy.openExternal : copy.openInternal) : copy.databaseMeta,
  }
}

function renderCard(index: number, slot: LifeSlotModel) {
  const className = getCardClassName(index)
  const accentClassName = getAccentClassName(index)
  const description = slot.description.trim()
  const content = (
    <>
      <span className={accentClassName}>{slot.accent}</span>
      <h3 className="font-bold mt-1" data-life-card-title>
        {slot.title}
      </h3>
      {description ? <p className="text-xs text-slate-500 mt-2">{description}</p> : null}
      <span className="card-meta" data-meta-tone={slot.state === 'error' ? 'neutral' : undefined}>
        {slot.meta}
      </span>
    </>
  )

  if (!slot.href) {
    return (
      <article
        key={`life-slot-${index}`}
        className={className}
        data-home-life-slot={String(index)}
        data-life-state={slot.state}
        aria-busy={slot.busy ? 'true' : undefined}
      >
        {content}
      </article>
    )
  }

  return (
    <a
      key={`life-slot-${index}`}
      className={className}
      data-home-life-slot={String(index)}
      data-life-state={slot.state}
      href={slot.href}
      target={slot.external ? '_blank' : undefined}
      rel={slot.external ? 'noreferrer' : undefined}
      aria-busy={slot.busy ? 'true' : undefined}
    >
      {content}
    </a>
  )
}

export function LifeCardsSection({ status, cards, message = null, onRetry, locale }: LifeCardsSectionProps) {
  const copy = LIFE_COPY[locale]
  const slots =
    status === 'loading'
      ? Array.from({ length: 3 }, (_, index) => buildLoadingSlot(index, copy))
      : status === 'error'
        ? [buildErrorSlot(copy, message)]
        : status === 'empty'
          ? [buildEmptySlot(copy)]
          : cards.map((card) => buildReadySlot(card, copy))

  return (
    <>
      <div className="panel-content-grid grid grid-cols-2 gap-4 flex-grow relative z-10" data-home-life-cards>
        {slots.map((slot, index) => renderCard(index, slot))}
      </div>

      {status === 'error' && onRetry ? (
        <div className="catalog-note mt-4 flex items-center gap-3" role="status" aria-live="polite">
          <span>{message?.trim() || copy.errorSummary}</span>
          <button className="ghost-btn" id="retry-home-life" type="button" onClick={onRetry}>
            {copy.retryLabel}
          </button>
        </div>
      ) : null}
    </>
  )
}

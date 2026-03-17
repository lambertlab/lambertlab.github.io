import type { UiLocale } from '~/lib/uiLocale'
import type { ProjectsLoadStatus } from '../model/projectTypes'

interface ProjectsCatalogStateProps {
  status: ProjectsLoadStatus
  message?: string | null
  emptyMessage: string
  showEmpty: boolean
  onRetry?: () => void
  locale: UiLocale
}

const STATE_COPY = {
  'zh-CN': {
    loading: '正在加载项目目录...',
    errorTitle: '目录加载失败',
    errorDetail: '请求失败，请检查后端连接状态。',
    retry: '重试',
  },
  en: {
    loading: 'Loading catalog data...',
    errorTitle: 'Catalog load failed',
    errorDetail: 'Request failed. Please check backend availability.',
    retry: 'Retry',
  },
} as const

export function ProjectsCatalogState({ status, message = null, emptyMessage, showEmpty, onRetry, locale }: ProjectsCatalogStateProps) {
  const copy = STATE_COPY[locale]

  return (
    <>
      <div className="catalog-state" data-loading-state role="status" aria-live="polite" hidden={status !== 'loading'}>
        {copy.loading}
      </div>
      <div className="catalog-state catalog-state-error" data-error-state hidden={status !== 'error'}>
        <p className="catalog-state-title">{copy.errorTitle}</p>
        <p className="catalog-state-detail" data-error-detail>
          {message ?? copy.errorDetail}
        </p>
        {onRetry ? (
          <button className="ghost-btn" type="button" id="retry-fetch" onClick={onRetry}>
            {copy.retry}
          </button>
        ) : null}
      </div>
      <p className="empty-state" data-empty-state hidden={!showEmpty}>
        {emptyMessage}
      </p>
    </>
  )
}
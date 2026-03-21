import * as React from 'react'
import {
  deactivateAdminHomeLifeCard,
  fetchAdminHomeLifePanel,
  upsertAdminHomeLifeCard,
  type AdminHomeLifeCardRecord,
  type AdminHomeLifePanelResult,
} from '~/lib/api/adminConsoleApi'
import { useUiLocale } from '~/lib/uiLocale'
import { AdminConsoleShell, useAdminConsoleAuth } from './AdminConsoleShell'
import { formatAdminTime, mapAdminError } from './adminConsoleUtils'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'
type MutationState = 'idle' | 'running' | 'success' | 'error'

type DraftState = {
  sortOrder: string
  accent: string
  title: string
  description: string
  href: string
  external: boolean
  isActive: boolean
}

const EMPTY_DRAFT: DraftState = {
  sortOrder: '',
  accent: '',
  title: '',
  description: '',
  href: '',
  external: false,
  isActive: true,
}

function toDraft(card: AdminHomeLifeCardRecord): DraftState {
  return {
    sortOrder: String(card.sort_order),
    accent: card.accent,
    title: card.title,
    description: card.description,
    href: card.href,
    external: card.external,
    isActive: card.is_active,
  }
}

function nextSortOrder(cards: AdminHomeLifeCardRecord[]): string {
  const maxSortOrder = cards.reduce((current, card) => Math.max(current, card.sort_order), 0)
  return String(maxSortOrder + 1)
}

function HomeLifeContent() {
  const { token, invalidate } = useAdminConsoleAuth()
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])
  const [includeInactive, setIncludeInactive] = React.useState(false)
  const [status, setStatus] = React.useState<LoadStatus>('idle')
  const [message, setMessage] = React.useState('')
  const [panel, setPanel] = React.useState<AdminHomeLifePanelResult | null>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [isCreateMode, setIsCreateMode] = React.useState(false)
  const [draft, setDraft] = React.useState<DraftState>(EMPTY_DRAFT)
  const [nonce, setNonce] = React.useState(0)
  const [saveState, setSaveState] = React.useState<{ status: MutationState; message: string }>({ status: 'idle', message: '' })
  const [deleteState, setDeleteState] = React.useState<{ status: MutationState; message: string }>({ status: 'idle', message: '' })

  React.useEffect(() => {
    const controller = new AbortController()

    const run = async () => {
      setStatus('loading')
      setMessage('')

      try {
        const result = await fetchAdminHomeLifePanel(token, { include_inactive: includeInactive }, controller.signal)
        if (controller.signal.aborted) return

        setPanel(result)
        if (result.cards.length === 0) {
          setStatus('empty')
          return
        }
        setStatus('ready')
      } catch (error) {
        if (controller.signal.aborted) return
        const mapped = mapAdminError(error)
        if (mapped.code === 'unauthorized') {
          invalidate(mapped.message)
          return
        }
        setStatus('error')
        setMessage(mapped.message)
      }
    }

    void run()
    return () => controller.abort()
  }, [includeInactive, invalidate, nonce, token])

  React.useEffect(() => {
    if (!panel || panel.cards.length === 0) {
      setSelectedId(null)
      setDraft({ ...EMPTY_DRAFT, sortOrder: '1' })
      return
    }

    if (isCreateMode) {
      return
    }

    const nextSelectedId = panel.cards.some((card) => card.id === selectedId) ? selectedId : panel.cards[0]?.id ?? null
    const selectedCard = panel.cards.find((card) => card.id === nextSelectedId) ?? panel.cards[0]

    setSelectedId(nextSelectedId)
    if (selectedCard) {
      setDraft(toDraft(selectedCard))
    }
  }, [isCreateMode, panel, selectedId])

  const cards = panel?.cards ?? []

  const beginCreate = React.useCallback(() => {
    setIsCreateMode(true)
    setSelectedId(null)
    setDraft({ ...EMPTY_DRAFT, sortOrder: nextSortOrder(cards) })
    setSaveState({ status: 'idle', message: '' })
    setDeleteState({ status: 'idle', message: '' })
  }, [cards])

  const selectCard = React.useCallback((card: AdminHomeLifeCardRecord) => {
    setIsCreateMode(false)
    setSelectedId(card.id)
    setDraft(toDraft(card))
    setSaveState({ status: 'idle', message: '' })
    setDeleteState({ status: 'idle', message: '' })
  }, [])

  const saveCard = React.useCallback(async () => {
    const normalizedSortOrder = Number(draft.sortOrder)
    if (!Number.isFinite(normalizedSortOrder) || normalizedSortOrder < 1) {
      setSaveState({ status: 'error', message: t('sort_order 必须大于等于 1。', 'sort_order must be greater than or equal to 1.') })
      return
    }
    if (!draft.title.trim()) {
      setSaveState({ status: 'error', message: t('标题不能为空。', 'Title is required.') })
      return
    }

    setSaveState({ status: 'running', message: t('保存中...', 'Saving...') })

    try {
      const result = await upsertAdminHomeLifeCard(token, normalizedSortOrder, {
        accent: draft.accent,
        title: draft.title,
        description: draft.description,
        href: draft.href,
        external: draft.external,
        is_active: draft.isActive,
      })

      setIsCreateMode(false)
      setSelectedId(result.card.id)
      setDraft(toDraft(result.card))
      setSaveState({ status: 'success', message: t(`已保存卡片 #${result.sort_order}。`, `Saved card #${result.sort_order}.`) })
      setDeleteState({ status: 'idle', message: '' })
      setNonce((prev) => prev + 1)
    } catch (error) {
      const mapped = mapAdminError(error)
      if (mapped.code === 'unauthorized') {
        invalidate(mapped.message)
        return
      }
      setSaveState({ status: 'error', message: mapped.message })
    }
  }, [draft, invalidate, t, token])

  const deactivateCard = React.useCallback(async () => {
    const normalizedSortOrder = Number(draft.sortOrder)
    if (!selectedId || !Number.isFinite(normalizedSortOrder) || normalizedSortOrder < 1) {
      setDeleteState({ status: 'error', message: t('请先选择一张已存在的卡片。', 'Select an existing card first.') })
      return
    }

    setDeleteState({ status: 'running', message: t('停用中...', 'Deactivating...') })

    try {
      const result = await deactivateAdminHomeLifeCard(token, normalizedSortOrder)
      setDeleteState({ status: 'success', message: t(`已停用卡片 #${result.sort_order}。`, `Deactivated card #${result.sort_order}.`) })
      setSaveState({ status: 'idle', message: '' })
      setNonce((prev) => prev + 1)
    } catch (error) {
      const mapped = mapAdminError(error)
      if (mapped.code === 'unauthorized') {
        invalidate(mapped.message)
        return
      }
      setDeleteState({ status: 'error', message: mapped.message })
    }
  }, [draft.sortOrder, invalidate, selectedId, t, token])

  return (
    <section className="admin-projects-workspace admin-projects-workspace--catalog admin-projects-workspace--list">
      <section className="admin-projects-list-panel">
        <div className="admin-section-head admin-section-head--projects">
          <div>
            <h2>{t('Life 卡片列表', 'Life Card List')}</h2>
            <p className="admin-detail-meta">{t('直接管理首页 life 面板的公开卡片。', 'Manage the public cards rendered in the homepage life panel.')}</p>
          </div>
          <div className="admin-section-head__actions">
            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(event) => setIncludeInactive(event.target.checked)}
              />
              <span>{t('显示已停用', 'Show inactive')}</span>
            </label>
            <button className="admin-secondary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>
              {t('刷新', 'Refresh')}
            </button>
            <button className="admin-primary-button" type="button" onClick={beginCreate}>
              {t('新建卡片', 'New Card')}
            </button>
          </div>
        </div>

        {status === 'loading' ? <div className="admin-state-card">{t('Life 面板加载中...', 'Loading home life panel...')}</div> : null}
        {status === 'error' ? <div className="admin-state-card admin-state-error"><p>{message}</p><button className="admin-primary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>{t('重试', 'Retry')}</button></div> : null}
        {status === 'empty' ? <div className="admin-state-card"><p>{t('当前还没有任何 Life 卡片。', 'There are no life cards yet.')}</p></div> : null}

        {status === 'ready' || status === 'empty' ? (
          <>
            {cards.length > 0 ? (
              <div className="admin-logs-table-wrap">
                <table className="admin-logs-table">
                  <thead>
                    <tr>
                      <th>{t('序号', 'Order')}</th>
                      <th>{t('标题', 'Title')}</th>
                      <th>href</th>
                      <th>{t('状态', 'State')}</th>
                      <th>{t('更新时间', 'Updated')}</th>
                      <th>{t('操作', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((card) => (
                      <tr key={card.id}>
                        <td>{card.sort_order}</td>
                        <td>{card.title || '--'}</td>
                        <td>{card.href || '--'}</td>
                        <td>{card.is_active ? t('启用', 'Active') : t('停用', 'Inactive')}</td>
                        <td>{formatAdminTime(card.updated_at)}</td>
                        <td>
                          <button className="admin-secondary-button" type="button" onClick={() => selectCard(card)}>
                            {t('编辑', 'Edit')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <p className="admin-list-summary">{t(`共 ${cards.length} 张卡片。`, `${cards.length} cards total.`)}</p>
          </>
        ) : null}
      </section>

      <section className="admin-project-detail-panel">
        <div className="admin-section-head admin-section-head--projects">
          <div>
            <h2>{selectedId ? t('编辑 Life 卡片', 'Edit Life Card') : t('新建 Life 卡片', 'Create Life Card')}</h2>
            <p className="admin-detail-meta">{t('保存后会直接影响首页 life 面板读模型。', 'Saved changes affect the homepage life panel read model directly.')}</p>
          </div>
        </div>

        <div className="admin-editor-grid two-col">
          <label className="admin-field">
            <span className="admin-field-label">sort_order</span>
            <input type="number" min="1" value={draft.sortOrder} onChange={(event) => setDraft((prev) => ({ ...prev, sortOrder: event.target.value }))} />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">{t('Accent', 'Accent')}</span>
            <input type="text" value={draft.accent} onChange={(event) => setDraft((prev) => ({ ...prev, accent: event.target.value }))} />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">{t('标题', 'Title')}<span className="admin-field-required">*</span></span>
            <input type="text" value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">{t('描述', 'Description')}</span>
            <textarea value={draft.description} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} rows={4} />
          </label>
          <label className="admin-field">
            <span className="admin-field-label">href</span>
            <input type="text" value={draft.href} onChange={(event) => setDraft((prev) => ({ ...prev, href: event.target.value }))} />
          </label>
          <label className="admin-checkbox-row admin-checkbox-row--field">
            <input type="checkbox" checked={draft.external} onChange={(event) => setDraft((prev) => ({ ...prev, external: event.target.checked }))} />
            <span>{t('外部链接', 'External link')}</span>
          </label>
          <label className="admin-checkbox-row admin-checkbox-row--field">
            <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))} />
            <span>{t('启用卡片', 'Card is active')}</span>
          </label>
        </div>

        <div className="admin-section-head__actions">
          <button className="admin-secondary-button" type="button" onClick={beginCreate}>
            {t('重置为新建', 'Reset to New')}
          </button>
          <button className="admin-secondary-button" type="button" onClick={() => setNonce((prev) => prev + 1)}>
            {t('回读最新', 'Reload')}
          </button>
          <button className="admin-primary-button" type="button" onClick={() => void saveCard()} disabled={saveState.status === 'running'}>
            {saveState.status === 'running' ? t('保存中...', 'Saving...') : t('保存卡片', 'Save Card')}
          </button>
          <button className="admin-secondary-button" type="button" onClick={() => void deactivateCard()} disabled={!selectedId || deleteState.status === 'running'}>
            {deleteState.status === 'running' ? t('停用中...', 'Deactivating...') : t('停用选中卡片', 'Deactivate Selected')}
          </button>
        </div>

        {saveState.message ? <p className="admin-feedback" data-tone={saveState.status === 'success' ? 'success' : saveState.status === 'error' ? 'error' : 'info'}>{saveState.message}</p> : null}
        {deleteState.message ? <p className="admin-feedback" data-tone={deleteState.status === 'success' ? 'success' : deleteState.status === 'error' ? 'error' : 'warn'}>{deleteState.message}</p> : null}
      </section>
    </section>
  )
}

export function AdminHomeLifeConsolePage() {
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])

  return (
    <AdminConsoleShell
      mode="home"
      title={t('Control Center · Home Life | lambertlab', 'Control Center · Home Life | lambertlab')}
      description={t('管理首页 Life 面板的卡片内容与启停状态。', 'Manage the homepage life panel cards and their active state.')}
    >
      <HomeLifeContent />
    </AdminConsoleShell>
  )
}

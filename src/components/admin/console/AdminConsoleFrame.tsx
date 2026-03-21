import * as React from 'react'
import { useUiLocale } from '~/lib/uiLocale'
import { AdminConsoleSidebar, type AdminSidebarMode } from './AdminConsoleSidebar'

type MirroredStatus = {
  state: string
  label: string
}

function useMirroredSystemStatus(locale: 'zh-CN' | 'en'): MirroredStatus {
  const [status, setStatus] = React.useState<MirroredStatus>(() => ({
    state: 'loading',
    label: locale === 'zh-CN' ? '系统状态检查中' : 'Checking system status',
  }))

  React.useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const source = document.querySelector('.ll-header [data-system-status]') as HTMLElement | null
    if (!source) {
      return
    }

    const sync = () => {
      const nextState = source.getAttribute('data-status-state') || 'loading'
      const nextLabel =
        source.getAttribute('title') ||
        source.getAttribute('aria-label') ||
        (locale === 'zh-CN' ? '系统状态检查中' : 'Checking system status')

      setStatus({ state: nextState, label: nextLabel })
    }

    sync()

    const observer = new MutationObserver(sync)
    observer.observe(source, {
      attributes: true,
      attributeFilter: ['data-status-state', 'title', 'aria-label'],
    })

    window.addEventListener('ll-ui-locale-change', sync)
    return () => {
      observer.disconnect()
      window.removeEventListener('ll-ui-locale-change', sync)
    }
  }, [locale])

  return status
}

function headerTitle(mode: AdminSidebarMode, locale: 'zh-CN' | 'en'): string {
  if (mode === 'overview') return locale === 'zh-CN' ? '系统概览' : 'Systems Overview'
  if (mode === 'projects') return locale === 'zh-CN' ? '项目管理' : 'Projects'
  if (mode === 'repositories') return locale === 'zh-CN' ? '仓库管理' : 'Repositories'
  if (mode === 'logs') return locale === 'zh-CN' ? '日志' : 'Logs'
  return locale === 'zh-CN' ? '首页 Life 面板' : 'Home Life Panel'
}

type Props = {
  mode: AdminSidebarMode
  children: React.ReactNode
}

export function AdminConsoleFrame({ mode, children }: Props) {
  const { locale, setLocale } = useUiLocale()
  const status = useMirroredSystemStatus(locale)
  const headerText = headerTitle(mode, locale)
  const nextLocale = locale === 'zh-CN' ? 'en' : 'zh-CN'

  return (
    <main className={`admin-reference-shell admin-reference-shell--${mode}`} id="main-content">
      <AdminConsoleSidebar activeMode={mode} />
      <section className={`admin-reference-main admin-reference-main--${mode}`}>
        <header className="admin-reference-header">
          <h1>{headerText}</h1>
          <div className="admin-reference-header__actions">
            <a
              className="system-health-nav admin-reference-system-health"
              data-system-status
              data-status-state={status.state}
              href="/status/"
              aria-live="polite"
              aria-label={status.label}
              title={status.label}
            >
              <span className="traffic-signal" aria-hidden="true">
                <span className="traffic-lamp" data-light="red"></span>
                <span className="traffic-lamp" data-light="yellow"></span>
                <span className="traffic-lamp" data-light="green"></span>
              </span>
              <span className="ll-sr-only">{status.label}</span>
            </a>
            <button
              type="button"
              className="ll-locale-switch admin-reference-locale-switch"
              data-ui-locale-switch
              data-active-locale={locale}
              aria-label={locale === 'zh-CN' ? '切换到 English' : 'Switch to Chinese'}
              title={locale === 'zh-CN' ? '切换到 English' : 'Switch to Chinese'}
              onClick={() => setLocale(nextLocale)}
            >
              <span className="ll-sr-only">{locale === 'zh-CN' ? '语言切换' : 'Language switch'}</span>
              <span className="ll-locale-emblem" aria-hidden="true">
                <span className="ll-locale-glyph ll-locale-glyph-zh">{'文'}</span>
                <span className="ll-locale-glyph ll-locale-glyph-en">A</span>
              </span>
            </button>
          </div>
        </header>
        <div className={`admin-reference-body admin-reference-body--${mode}`}>{children}</div>
      </section>
    </main>
  )
}

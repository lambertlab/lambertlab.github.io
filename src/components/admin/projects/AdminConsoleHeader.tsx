import { Link } from '@tanstack/react-router'
import * as React from 'react'
import { useUiLocale } from '~/lib/uiLocale'
import { DEFAULT_ADMIN_PROJECTS_SEARCH_STATE } from './adminProjectsSearch'

type AdminHeaderPrimary = 'overview' | 'projects'

type AdminConsoleHeaderProps = {
  activePrimary?: AdminHeaderPrimary
  heading: string
  description: string
  kicker?: string
}

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

export function AdminConsoleHeader({ activePrimary, heading, description, kicker }: AdminConsoleHeaderProps) {
  const { locale, setLocale } = useUiLocale()
  const status = useMirroredSystemStatus(locale)
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])

  return (
    <section className="admin-console-header">
      <div className="admin-console-topbar">
        <div className="admin-console-topbar__left">
          <Link className="admin-console-home" to="/">
            {t('Home', 'Home')}
          </Link>
          <div className="admin-console-brand" aria-label="Lambert Lab Admin">
            <span className="admin-console-brand__mark">L</span>
            <span className="admin-console-brand__text">Lambert Lab Admin</span>
          </div>
        </div>

        <nav className="admin-console-primary-nav" aria-label={t('后台主导航', 'Admin primary navigation')}>
          <Link to="/admin/overview" className={activePrimary === 'overview' ? 'is-active' : ''}>
            {t('Overview', 'Overview')}
          </Link>
          <Link
            to="/admin/projects"
            search={DEFAULT_ADMIN_PROJECTS_SEARCH_STATE}
            className={activePrimary === 'projects' ? 'is-active' : ''}
          >
            {t('Projects', 'Projects')}
          </Link>
        </nav>

        <div className="admin-console-topbar__right">
          <a className="admin-console-status" href="/status/" data-status-state={status.state} aria-label={status.label} title={status.label}>
            <span className="admin-console-status__dot" aria-hidden="true"></span>
            <span className="admin-console-status__label">{t('状态灯', 'Status')}</span>
          </a>

          <div className="admin-console-locale" role="group" aria-label={t('语言切换', 'Language switch')}>
            <button
              type="button"
              className={locale === 'zh-CN' ? 'is-active' : ''}
              aria-pressed={locale === 'zh-CN'}
              onClick={() => setLocale('zh-CN')}
            >
              中文
            </button>
            <button
              type="button"
              className={locale === 'en' ? 'is-active' : ''}
              aria-pressed={locale === 'en'}
              onClick={() => setLocale('en')}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      <div className="admin-console-intro">
        <div>
          <p className="admin-projects-kicker">{kicker ? `${kicker} \u00b7 Control Center` : 'Control Center'}</p>
          <h1>{heading}</h1>
          <p>{description}</p>
        </div>
      </div>
    </section>
  )
}

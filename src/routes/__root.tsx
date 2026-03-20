/// <reference types="vite/client" />
import {
  HeadContent,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import * as React from 'react'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { NotFound } from '~/components/NotFound'
import { getLegacyCompatBootstrapScript } from '~/lib/legacyCompatPaths'
import { rootMetadata, shellCopy } from '~/lib/siteCopy'
import { getUiLocaleBootstrapScript, type UiLocale, UiLocaleProvider, useUiLocale } from '~/lib/uiLocale'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: rootMetadata.title['zh-CN'],
      },
      {
        name: 'description',
        content: rootMetadata.description['zh-CN'],
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: '/css/font-themes.css' },
      { rel: 'stylesheet', href: '/css/shared-header.css' },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
    scripts: [
      {
        children: getLegacyCompatBootstrapScript(),
      },
      {
        children: getUiLocaleBootstrapScript(),
      },
      {
        children:
          "(function(){try{var mode='light';var raw=localStorage.getItem('ll-color-mode-v1');if(raw==='light'||raw==='dark'){mode=raw;}else if(raw==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){mode='dark';}else{var legacy=localStorage.getItem('theme');if(legacy==='light'||legacy==='dark'){mode=legacy;}}var root=document.documentElement;root.setAttribute('data-color-mode',mode);root.setAttribute('data-resolved-theme',mode);if(mode==='dark'){root.classList.add('dark');}else{root.classList.remove('dark');}}catch(_){}})();",
      },
      {
        src: '/js/font-theme.js',
        type: 'text/javascript',
      },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
})

function ThemeSwitchSkeleton({ locale }: { locale: UiLocale }) {
  return (
    <button
      type="button"
      className="ll-theme-switch ll-theme-toggle"
      data-theme-mode-switch
      data-theme-mode="light"
      aria-label={shellCopy.theme.toggleToDark[locale]}
      title={shellCopy.theme.toggleToDark[locale]}
    >
      <span className="ll-sr-only" data-theme-toggle-copy>
        {shellCopy.theme.label[locale]} / {shellCopy.theme.toggleToDark[locale]}
      </span>
      <span className="ll-theme-emblem" aria-hidden="true">
        <svg className="ll-theme-icon ll-theme-icon-light" viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="3.5"></circle>
          <line x1="12" y1="2.5" x2="12" y2="5"></line>
          <line x1="12" y1="19" x2="12" y2="21.5"></line>
          <line x1="2.5" y1="12" x2="5" y2="12"></line>
          <line x1="19" y1="12" x2="21.5" y2="12"></line>
          <line x1="5.3" y1="5.3" x2="7.1" y2="7.1"></line>
          <line x1="16.9" y1="16.9" x2="18.7" y2="18.7"></line>
          <line x1="16.9" y1="7.1" x2="18.7" y2="5.3"></line>
          <line x1="5.3" y1="18.7" x2="7.1" y2="16.9"></line>
        </svg>
        <svg className="ll-theme-icon ll-theme-icon-dark" viewBox="0 0 24 24" focusable="false">
          <path d="M20.5 14.5A7.5 7.5 0 1 1 9.5 3.5 6.2 6.2 0 0 0 20.5 14.5Z"></path>
        </svg>
      </span>
    </button>
  )
}

function LocaleSwitch() {
  const { locale, setLocale } = useUiLocale()
  const nextLocale = locale === 'zh-CN' ? 'en' : 'zh-CN'

  return (
    <button
      type="button"
      className="ll-locale-switch"
      data-ui-locale-switch
      data-active-locale={locale}
      aria-label={shellCopy.localeSwitch.toggle[locale]}
      title={shellCopy.localeSwitch.toggle[locale]}
      onClick={() => setLocale(nextLocale)}
    >
      <span className="ll-sr-only">
        {shellCopy.localeSwitch.label[locale]} / {shellCopy.localeSwitch.toggle[locale]}
      </span>
      <span className="ll-locale-emblem" aria-hidden="true">
        <span className="ll-locale-glyph ll-locale-glyph-zh">{'\u6587'}</span>
        <span className="ll-locale-glyph ll-locale-glyph-en">A</span>
      </span>
    </button>
  )
}

function ensureRuntimeScript(scriptId: string, src: string) {
  if (typeof document === 'undefined' || document.getElementById(scriptId)) {
    return
  }

  const runtimeScript = document.createElement('script')
  runtimeScript.id = scriptId
  runtimeScript.src = src
  runtimeScript.async = false
  document.body.appendChild(runtimeScript)
}

function RootShell({ children }: { children: React.ReactNode }) {
  const { locale } = useUiLocale()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isAdminRoute = pathname === '/admin' || pathname === '/admin/' || pathname.startsWith('/admin/')
  const isHomeRoute = pathname === '/'
  const isProjectsRoute = pathname === '/projects' || pathname === '/projects/' || pathname.startsWith('/projects/')
  const isJournalRoute = pathname === '/journal' || pathname === '/journal/' || pathname.startsWith('/journal/')
  const isAboutRoute = pathname === '/about' || pathname === '/about/'
  const isContactRoute = pathname === '/contact' || pathname === '/contact/'
  const isStatusRoute = pathname === '/status' || pathname === '/status/'
  const useRuntimeScripts = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect
  const statusTitle = shellCopy.systemStatus.loadingTitle[locale]
  const statusDescription = shellCopy.systemStatus.loadingDescription[locale]
  const statusSummary = locale === 'zh-CN' ? statusTitle + '：' + statusDescription : statusTitle + ': ' + statusDescription
  const publicFooterCopy = (() => {
    if (isHomeRoute) {
      return locale === 'zh-CN' ? '© 2026 LAMBERTLAB · 首页' : '© 2026 LAMBERTLAB'
    }
    if (isProjectsRoute) {
      return locale === 'zh-CN' ? '© 2026 LAMBERTLAB · 项目' : '© 2026 LAMBERTLAB · PROJECTS'
    }
    if (isJournalRoute) {
      return locale === 'zh-CN' ? '© 2026 LAMBERTLAB · 日志' : '© 2026 LAMBERTLAB · JOURNAL'
    }
    if (isAboutRoute) {
      return locale === 'zh-CN' ? '© 2026 LAMBERTLAB · 关于' : '© 2026 LAMBERTLAB · ABOUT'
    }
    if (isContactRoute) {
      return locale === 'zh-CN' ? '© 2026 LAMBERTLAB · 联系' : '© 2026 LAMBERTLAB · CONTACT'
    }
    if (isStatusRoute) {
      return locale === 'zh-CN' ? '© 2026 LAMBERTLAB · 状态' : '© 2026 LAMBERTLAB · STATUS'
    }
    return '© 2026 LAMBERTLAB'
  })()

  useRuntimeScripts(() => {
    ensureRuntimeScript('ll-system-status-runtime', '/js/system-status.js')

    if (!isAdminRoute) {
      ensureRuntimeScript('ll-theme-runtime', '/js/theme-runtime.js')
    }
  }, [isAdminRoute])

  return (
    <>

      <header className={isAdminRoute ? 'll-header ll-header-admin' : 'll-header'}>
        <nav className="ll-header-inner">
          <a className="ll-brand" href="/">
            <span className="ll-brand-mark">L</span>
            <span className="ll-brand-text">lambertlab</span>
          </a>
          <div className={isAdminRoute ? 'll-nav ll-nav-admin' : 'll-nav'}>
            {isAdminRoute ? null : (
              <>
                <a className={isProjectsRoute ? 'll-nav-link ll-nav-link-projects is-active' : 'll-nav-link ll-nav-link-projects'} href="/projects/">
                  {shellCopy.nav.projects[locale]}
                </a>
                <a className={isJournalRoute ? 'll-nav-link ll-nav-link-journal is-active' : 'll-nav-link ll-nav-link-journal'} href="/journal/">
                  {shellCopy.nav.journal[locale]}
                </a>
                <a className={isAboutRoute ? 'll-nav-link ll-nav-link-about is-active' : 'll-nav-link ll-nav-link-about'} href="/about/">
                  {shellCopy.nav.about[locale]}
                </a>
                <a className="ll-cta" href="/contact/">
                  {shellCopy.nav.contact[locale]}
                </a>
              </>
            )}
            <LocaleSwitch />
            {isAdminRoute ? null : <ThemeSwitchSkeleton locale={locale} />}
            <a
              className="system-health-nav"
              data-system-status
              data-status-state="loading"
              href="/status/"
              aria-live="polite"
              aria-label={statusSummary}
              title={statusSummary}
            >
              <span className="traffic-signal" aria-hidden="true">
                <span className="traffic-lamp" data-light="red"></span>
                <span className="traffic-lamp" data-light="yellow"></span>
                <span className="traffic-lamp" data-light="green"></span>
              </span>
              <span className="ll-sr-only" data-system-status-title>
                {statusTitle}
              </span>
              <span className="ll-sr-only" data-system-status-description>
                {statusDescription}
              </span>
            </a>
          </div>
        </nav>
      </header>

      {isAdminRoute ? (
        <div className="ll-admin-shell">
          {children}
          <footer className="ll-site-footer ll-site-footer-admin">
            <div className="ll-site-footer-inner">
              <div className="ll-site-footer-copy">
                <span>{'\u00a9 2026 lambertlab'}</span>
                <span>{locale === 'zh-CN' ? 'Admin Console' : 'Admin Console'}</span>
              </div>
              <div className="ll-site-footer-links">
                <a className="ll-site-footer-link" href="/admin/overview/">
                  Overview
                </a>
                <a className="ll-site-footer-link" href="/admin/projects/">
                  Projects
                </a>
                <a className="ll-site-footer-link" href="/admin/repo/">
                  GitHub Repo
                </a>
                <a className="ll-site-footer-link" href="/status/">
                  {shellCopy.footer.status[locale]}
                </a>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        <div className={isProjectsRoute ? 'll-public-shell ll-public-shell-projects' : 'll-public-shell'}>
          {children}
          <footer className="ll-site-footer" data-fixed-footer="true" data-projects-footer={isProjectsRoute ? 'true' : 'false'}>
            <div className="ll-site-footer-inner">
              <div className="ll-site-footer-copy">
                <span>{publicFooterCopy}</span>
              </div>
              <div className="ll-site-footer-links">
                {isProjectsRoute ? (
                  <>
                    <a className="ll-site-footer-link" href="https://github.com/lambertlab" target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                    <a className="ll-site-footer-link" href="/contact/">
                      {shellCopy.footer.contact[locale]}
                    </a>
                    <a className="ll-site-footer-link" href="/status/">
                      {shellCopy.footer.status[locale]}
                    </a>
                  </>
                ) : (
                  <>
                    <a className="ll-site-footer-link" href="/contact/">
                      {shellCopy.footer.contact[locale]}
                    </a>
                    <a className="ll-site-footer-link" href="/status/">
                      {shellCopy.footer.status[locale]}
                    </a>
                  </>
                )}
              </div>
            </div>
          </footer>
        </div>
      )}
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-ui-locale="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        <UiLocaleProvider>
          <RootShell>{children}</RootShell>
        </UiLocaleProvider>
        <script src="/js/config.js"></script>
        <Scripts />
      </body>
    </html>
  )
}

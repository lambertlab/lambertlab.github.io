/// <reference types="vite/client" />
import {
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import * as React from 'react'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { NotFound } from '~/components/NotFound'
import { rootMetadata, shellCopy } from '~/lib/siteCopy'
import { getUiLocaleBootstrapScript, type UiLocale, UiLocaleProvider, useUiLocale } from '~/lib/uiLocale'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

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
        children: getUiLocaleBootstrapScript(),
      },
      {
        children:
          "(function(){try{var mode='system';var raw=localStorage.getItem('ll-color-mode-v1');if(raw==='system'||raw==='light'||raw==='dark'){mode=raw;}else{var legacy=localStorage.getItem('theme');if(legacy==='light'||legacy==='dark'){mode=legacy;}}var isDark=false;if(mode==='dark'){isDark=true;}else if(mode==='system'&&window.matchMedia){isDark=window.matchMedia('(prefers-color-scheme: dark)').matches;}var resolved=isDark?'dark':'light';var root=document.documentElement;root.setAttribute('data-color-mode',mode);root.setAttribute('data-resolved-theme',resolved);if(isDark){root.classList.add('dark');}else{root.classList.remove('dark');}}catch(_){}})();",
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
    <div className="ll-theme-switch ll-theme-static-sync" data-theme-mode-switch data-theme-mode="system">
      <div className="ll-theme-segmented" role="group" aria-label={shellCopy.theme.label[locale]}>
        <span className="ll-theme-glider" aria-hidden="true"></span>
        <button
          type="button"
          className="ll-theme-option"
          data-theme-mode-option="system"
          aria-label={shellCopy.theme.system[locale]}
          aria-pressed="false"
        >
          <svg className="ll-theme-option-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="4" y="5" width="16" height="11" rx="2"></rect>
            <line x1="9" y1="20" x2="15" y2="20"></line>
            <line x1="12" y1="16" x2="12" y2="20"></line>
          </svg>
        </button>
        <button
          type="button"
          className="ll-theme-option"
          data-theme-mode-option="light"
          aria-label={shellCopy.theme.light[locale]}
          aria-pressed="false"
        >
          <svg className="ll-theme-option-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
        </button>
        <button
          type="button"
          className="ll-theme-option"
          data-theme-mode-option="dark"
          aria-label={shellCopy.theme.dark[locale]}
          aria-pressed="false"
        >
          <svg className="ll-theme-option-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M20.5 14.5A7.5 7.5 0 1 1 9.5 3.5 6.2 6.2 0 0 0 20.5 14.5Z"></path>
          </svg>
        </button>
      </div>
    </div>
  )
}

function LocaleSwitch() {
  const { locale, setLocale } = useUiLocale()

  return (
    <div className="ll-locale-switch" data-ui-locale-switch>
      <div className="ll-locale-segmented" role="group" aria-label={shellCopy.localeSwitch.label[locale]}>
        <span className="ll-locale-glider" aria-hidden="true"></span>
        <button
          type="button"
          className="ll-locale-option"
          data-ui-locale-option="zh-CN"
          aria-pressed={locale === 'zh-CN'}
          aria-label={shellCopy.localeSwitch.zh[locale]}
          onClick={() => setLocale('zh-CN')}
        >
          {shellCopy.localeSwitch.zh[locale]}
        </button>
        <button
          type="button"
          className="ll-locale-option"
          data-ui-locale-option="en"
          aria-pressed={locale === 'en'}
          aria-label={shellCopy.localeSwitch.en[locale]}
          onClick={() => setLocale('en')}
        >
          {shellCopy.localeSwitch.en[locale]}
        </button>
      </div>
    </div>
  )
}

function RootShell({ children }: { children: React.ReactNode }) {
  const { locale } = useUiLocale()
  const statusTitle = shellCopy.systemStatus.loadingTitle[locale]
  const statusDescription = shellCopy.systemStatus.loadingDescription[locale]
  const statusSummary = locale === 'zh-CN' ? `${statusTitle}：${statusDescription}` : `${statusTitle}: ${statusDescription}`

  return (
    <>
      <a className="skip-link" href="#main-content">
        {shellCopy.skipLink[locale]}
      </a>

      <header className="ll-header">
        <nav className="ll-header-inner">
          <a className="ll-brand" href="/">
            <span className="ll-brand-mark">L</span>
            <span className="ll-brand-text">lambertlab</span>
          </a>
          <div className="ll-nav">
            <a className="ll-nav-link" href="/projects/">
              {shellCopy.nav.projects[locale]}
            </a>
            <a className="ll-nav-link" href="/journal/">
              {shellCopy.nav.journal[locale]}
            </a>
            <a className="ll-nav-link" href="/about/">
              {shellCopy.nav.about[locale]}
            </a>
            <a className="ll-cta" href="/contact/">
              {shellCopy.nav.contact[locale]}
            </a>
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
            <LocaleSwitch />
            <ThemeSwitchSkeleton locale={locale} />
          </div>
        </nav>
      </header>

      {children}
      <footer className="ll-site-footer">
        <div className="ll-site-footer-inner">
          <div className="ll-site-footer-copy">
            <span>© 2026 lambertlab</span>
            <span>{shellCopy.footer.copy[locale]}</span>
          </div>
          <div className="ll-site-footer-links">
            <a className="ll-site-footer-link" href="/contact/">
              {shellCopy.footer.contact[locale]}
            </a>
            <a className="ll-site-footer-link" href="/status/">
              {shellCopy.footer.status[locale]}
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (document.getElementById('ll-main-runtime')) {
      return
    }

    const runtimeScript = document.createElement('script')
    runtimeScript.id = 'll-main-runtime'
    runtimeScript.src = '/js/main.js'
    runtimeScript.async = false
    document.body.appendChild(runtimeScript)
  }, [])

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

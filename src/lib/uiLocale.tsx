import * as React from 'react'

export type UiLocale = 'zh-CN' | 'en'

export interface LocalizedText {
  'zh-CN': string
  en: string
}

export interface LocalizedMetadata {
  title: LocalizedText
  description: LocalizedText
}

export const UI_LOCALE_STORAGE_KEY = 'll-ui-locale-v1'
export const DEFAULT_UI_LOCALE: UiLocale = 'zh-CN'

function isUiLocale(value: unknown): value is UiLocale {
  return value === 'zh-CN' || value === 'en'
}

export function normalizeUiLocale(value: unknown): UiLocale {
  return isUiLocale(value) ? value : DEFAULT_UI_LOCALE
}

export function pickLocalizedText(text: LocalizedText, locale: UiLocale): string {
  return text[locale]
}

function readStoredUiLocale(): UiLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_UI_LOCALE
  }

  try {
    return normalizeUiLocale(window.localStorage.getItem(UI_LOCALE_STORAGE_KEY))
  } catch {
    return DEFAULT_UI_LOCALE
  }
}

function readPreferredUiLocale(): UiLocale {
  if (typeof window !== 'undefined' && isUiLocale(window.__LL_UI_LOCALE__)) {
    return window.__LL_UI_LOCALE__
  }

  if (typeof document === 'undefined') {
    return DEFAULT_UI_LOCALE
  }

  const documentLocale = document.documentElement.getAttribute('data-ui-locale')
  if (isUiLocale(documentLocale)) {
    return documentLocale
  }

  return readStoredUiLocale()
}

function syncUiLocaleDocument(locale: UiLocale) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.lang = locale
  document.documentElement.setAttribute('data-ui-locale', locale)
}

const UiLocaleContext = React.createContext<{
  locale: UiLocale
  setLocale: (locale: UiLocale) => void
} | null>(null)

export function UiLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<UiLocale>(DEFAULT_UI_LOCALE)
  const hasMountedRef = React.useRef(false)

  React.useEffect(() => {
    const nextLocale = readPreferredUiLocale()
    setLocaleState((currentLocale) => (currentLocale === nextLocale ? currentLocale : nextLocale))
  }, [])

  React.useEffect(() => {
    syncUiLocaleDocument(locale)

    if (typeof window !== 'undefined') {
      window.__LL_UI_LOCALE__ = locale

      try {
        window.localStorage.setItem(UI_LOCALE_STORAGE_KEY, locale)
      } catch {
        // Ignore storage failures and keep the runtime locale in memory.
      }

      if (hasMountedRef.current) {
        window.dispatchEvent(new CustomEvent('ll-ui-locale-change', { detail: { locale } }))
      } else {
        hasMountedRef.current = true
      }
    }
  }, [locale])

  const setLocale = React.useCallback((nextLocale: UiLocale) => {
    const normalizedLocale = normalizeUiLocale(nextLocale)
    setLocaleState((currentLocale) => (currentLocale === normalizedLocale ? currentLocale : normalizedLocale))
  }, [])

  return <UiLocaleContext.Provider value={{ locale, setLocale }}>{children}</UiLocaleContext.Provider>
}

export function useUiLocale() {
  const context = React.useContext(UiLocaleContext)
  if (!context) {
    throw new Error('useUiLocale must be used within UiLocaleProvider')
  }
  return context
}

export function useDocumentMetadata(title: string, description: string) {
  React.useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.title = title

    let descriptionMeta = document.head.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta')
      descriptionMeta.name = 'description'
      document.head.appendChild(descriptionMeta)
    }

    descriptionMeta.content = description
  }, [description, title])
}

export function getUiLocaleBootstrapScript() {
  return `(function(){try{var key='${UI_LOCALE_STORAGE_KEY}';var raw=localStorage.getItem(key);window.__LL_UI_LOCALE__=raw==='en'||raw==='zh-CN'?raw:'${DEFAULT_UI_LOCALE}';}catch(_){window.__LL_UI_LOCALE__='${DEFAULT_UI_LOCALE}';}})();`
}

declare global {
  interface Window {
    __LL_UI_LOCALE__?: UiLocale
  }
}


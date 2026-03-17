import * as React from 'react'

const INDEX_HTML_SUFFIX = '/index.html'

const PUBLIC_COMPAT_PATHS = new Map<string, string>([
  ['/index.html', '/'],
  ['/about/index.html', '/about/'],
  ['/contact/index.html', '/contact/'],
  ['/journal/index.html', '/journal/'],
  ['/status/index.html', '/status/'],
])

export function resolvePublicCanonicalPath(pathname: string): string | null {
  const exactMatch = PUBLIC_COMPAT_PATHS.get(pathname)
  if (exactMatch) {
    return exactMatch
  }

  if (!pathname.startsWith('/journal/') || !pathname.endsWith(INDEX_HTML_SUFFIX)) {
    return null
  }

  const withoutSuffix = pathname.slice(0, -INDEX_HTML_SUFFIX.length)
  if (!withoutSuffix || withoutSuffix === '/journal') {
    return '/journal/'
  }

  return `${withoutSuffix}/`
}

export function usePublicCompatPathNormalization() {
  React.useEffect(() => {
    const canonicalPath = resolvePublicCanonicalPath(window.location.pathname)
    if (!canonicalPath || canonicalPath === window.location.pathname) {
      return
    }

    const target = `${canonicalPath}${window.location.search}${window.location.hash}`
    window.location.replace(target)
  }, [])
}

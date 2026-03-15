import * as React from 'react'

const ADMIN_INDEX_HTML_SUFFIX = '/index.html'

export function resolveAdminCanonicalPath(pathname: string): string | null {
  if (pathname === '/admin/index.html') {
    return '/admin/'
  }

  if (pathname === '/admin/projects/index.html') {
    return '/admin/projects/'
  }

  if (!pathname.startsWith('/admin/') || !pathname.endsWith(ADMIN_INDEX_HTML_SUFFIX)) {
    return null
  }

  const withoutSuffix = pathname.slice(0, -ADMIN_INDEX_HTML_SUFFIX.length)
  if (!withoutSuffix || withoutSuffix === '/admin') {
    return '/admin/'
  }

  return `${withoutSuffix}/`
}

export function useAdminCompatPathNormalization() {
  React.useEffect(() => {
    const canonicalPath = resolveAdminCanonicalPath(window.location.pathname)
    if (!canonicalPath || canonicalPath === window.location.pathname) {
      return
    }

    const target = `${canonicalPath}${window.location.search}${window.location.hash}`
    window.location.replace(target)
  }, [])
}

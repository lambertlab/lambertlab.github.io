import * as React from 'react'

const PROJECTS_INDEX_HTML_SUFFIX = '/index.html'

export function resolveProjectsCanonicalPath(pathname: string): string | null {
  if (pathname === '/projects/index.html') {
    return '/projects/'
  }

  if (!pathname.startsWith('/projects/') || !pathname.endsWith(PROJECTS_INDEX_HTML_SUFFIX)) {
    return null
  }

  const withoutSuffix = pathname.slice(0, -PROJECTS_INDEX_HTML_SUFFIX.length)
  if (!withoutSuffix || withoutSuffix === '/projects') {
    return '/projects/'
  }

  return `${withoutSuffix}/`
}

export function useProjectsCompatPathNormalization() {
  React.useEffect(() => {
    const canonicalPath = resolveProjectsCanonicalPath(window.location.pathname)
    if (!canonicalPath || canonicalPath === window.location.pathname) {
      return
    }

    const target = `${canonicalPath}${window.location.search}${window.location.hash}`
    window.location.replace(target)
  }, [])
}

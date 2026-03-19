const INDEX_HTML_SUFFIX = '/index.html'
const EXACT_LEGACY_PATHS = new Map<string, string>([
  ['/index.html', '/'],
  ['/about/index.html', '/about/'],
  ['/contact/index.html', '/contact/'],
  ['/status/index.html', '/status/'],
])
const LEGACY_NAMESPACE_PREFIXES = ['/journal/', '/projects/', '/admin/'] as const

export function resolveLegacyCanonicalPath(pathname: string): string | null {
  const exactMatch = EXACT_LEGACY_PATHS.get(pathname)
  if (exactMatch) {
    return exactMatch
  }

  for (const prefix of LEGACY_NAMESPACE_PREFIXES) {
    if (!pathname.startsWith(prefix) || !pathname.endsWith(INDEX_HTML_SUFFIX)) {
      continue
    }

    const withoutSuffix = pathname.slice(0, -INDEX_HTML_SUFFIX.length)
    if (!withoutSuffix || withoutSuffix === prefix.slice(0, -1)) {
      return prefix
    }

    return `${withoutSuffix}/`
  }

  return null
}

export function getLegacyCompatBootstrapScript() {
  return `(function(){try{var __llLegacyCompatRedirect__=true;var pathname=window.location.pathname;var exact={"/index.html":"/","/about/index.html":"/about/","/contact/index.html":"/contact/","/status/index.html":"/status/"};var suffix='/index.html';var prefixes=["/journal/","/projects/","/admin/"];var canonical=exact[pathname]||null;if(!canonical){for(var i=0;i<prefixes.length;i+=1){var prefix=prefixes[i];if(pathname.indexOf(prefix)===0&&pathname.slice(-suffix.length)===suffix){var withoutSuffix=pathname.slice(0,-suffix.length);canonical=!withoutSuffix||withoutSuffix===prefix.slice(0,-1)?prefix:withoutSuffix+'/';break;}}}if(canonical&&canonical!==pathname){window.location.replace(canonical+window.location.search+window.location.hash);}}catch(_){}})();`
}

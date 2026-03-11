import { useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import type { LegacyPage } from '~/legacy/pages'
import { useHomeSplitLayout } from '~/legacy/useHomeSplitLayout'

interface LegacyPageViewProps {
  page: LegacyPage
}

function useInternalAnchorNavigation(rootRef: React.RefObject<HTMLElement | null>) {
  const navigate = useNavigate()

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) {
      return
    }

    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target as Element | null
      const anchor = target ? target.closest('a[href]') : null
      if (!(anchor instanceof HTMLAnchorElement)) {
        return
      }

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return
      }
      if (anchor.target && anchor.target !== '_self') {
        return
      }
      if (anchor.hasAttribute('download')) {
        return
      }

      let targetUrl: URL
      try {
        targetUrl = new URL(anchor.href, window.location.href)
      } catch {
        return
      }

      if (targetUrl.origin !== window.location.origin) {
        return
      }

      event.preventDefault()
      const to = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
      navigate({ to })
    }

    root.addEventListener('click', onClick)
    return () => {
      root.removeEventListener('click', onClick)
    }
  }, [navigate, rootRef])
}

function useRuntimeScripts(scriptSources: string[]) {
  React.useEffect(() => {
    if (scriptSources.length === 0) {
      return
    }

    const mountedScripts: HTMLScriptElement[] = []
    let cancelled = false

    function loadScripts() {
      for (const scriptSrc of scriptSources) {
        if (cancelled) {
          break
        }
        const script = document.createElement('script')
        script.src = scriptSrc
        script.async = false
        mountedScripts.push(script)
        document.body.appendChild(script)
      }
    }

    loadScripts()

    return () => {
      cancelled = true
      for (const script of mountedScripts) {
        script.remove()
      }
    }
  }, [scriptSources])
}

export function LegacyPageView({ page }: LegacyPageViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  useInternalAnchorNavigation(containerRef)
  useRuntimeScripts(page.runtimeScripts ?? [])
  useHomeSplitLayout(page.enableHomeSplit === true)

  return (
    <>
      <div ref={containerRef} data-legacy-page={page.id} dangerouslySetInnerHTML={{ __html: page.bodyContentHtml }} />
    </>
  )
}

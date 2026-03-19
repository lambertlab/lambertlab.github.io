import * as React from 'react'

function syncCompactTitles(panel: Element) {
  panel.querySelectorAll('.panel-content-grid .bento-card').forEach((card) => {
    const titleElement = card.querySelector('h3')
    if (!titleElement || !titleElement.textContent) {
      return
    }

    const titleText = titleElement.textContent.trim()
    if (!titleText) {
      return
    }

    let compactTitle = card.querySelector('.compact-title')
    if (!compactTitle) {
      compactTitle = document.createElement('span')
      compactTitle.className = 'compact-title'
      compactTitle.setAttribute('aria-hidden', 'true')
      card.appendChild(compactTitle)
    }

    if (compactTitle.textContent !== titleText) {
      compactTitle.textContent = titleText
    }
  })
}

export function useHomeSplitLayout(enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) {
      return
    }

    const splitLayoutElement = document.querySelector('[data-split-layout]') as HTMLElement | null
    if (!splitLayoutElement) {
      return
    }
    const splitLayout = splitLayoutElement

    const techPanelElement = splitLayout.querySelector('[data-purpose="tech-panel"]') as HTMLElement | null
    const lifePanelElement = splitLayout.querySelector('[data-purpose="life-panel"]') as HTMLElement | null
    if (!techPanelElement || !lifePanelElement) {
      return
    }
    const techPanel = techPanelElement
    const lifePanel = lifePanelElement

    const listeners: Array<() => void> = []
    const observers: MutationObserver[] = []
    const resizeObservers: ResizeObserver[] = []

    let lastActive: 'tech' | 'life' = 'tech'
    let hoverSuppressedUntil = 0
    let boundaryX = window.innerWidth / 2
    let pointerClientX: number | null = null
    let pointerFrameId = 0
    let boundaryFrameId = 0

    const desktopMinWidth = 1024
    const hysteresis = 14
    const hoverResumeDelayMs = 120

    function on(
      target: EventTarget,
      eventName: string,
      handler: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions,
    ) {
      target.addEventListener(eventName, handler, options)
      listeners.push(() => {
        target.removeEventListener(eventName, handler, options)
      })
    }

    function isDesktopViewport() {
      return window.innerWidth > desktopMinWidth
    }

    function observeTitleChanges(panel: Element) {
      if (typeof MutationObserver !== 'function') {
        return
      }

      panel.querySelectorAll('.panel-content-grid h3').forEach((titleNode) => {
        const observer = new MutationObserver(() => {
          syncCompactTitles(panel)
        })
        observer.observe(titleNode, { childList: true, characterData: true, subtree: true })
        observers.push(observer)
      })
    }

    function refreshBoundary() {
      if (!isDesktopViewport()) {
        boundaryX = window.innerWidth / 2
        return
      }

      const techRect = techPanel.getBoundingClientRect()
      const lifeRect = lifePanel.getBoundingClientRect()
      boundaryX = (techRect.right + lifeRect.left) / 2
    }

    function scheduleBoundaryRefresh() {
      if (boundaryFrameId !== 0) {
        return
      }

      boundaryFrameId = window.requestAnimationFrame(() => {
        boundaryFrameId = 0
        refreshBoundary()
      })
    }

    function setActive(active: 'tech' | 'life') {
      if (splitLayout.getAttribute('data-active') === active) {
        lastActive = active
        return
      }

      splitLayout.setAttribute('data-active', active)
      lastActive = active
      scheduleBoundaryRefresh()
    }

    function clearActive() {
      if (!splitLayout.hasAttribute('data-active')) {
        return
      }

      splitLayout.removeAttribute('data-active')
      scheduleBoundaryRefresh()
    }

    function pickActive(clientX: number) {
      if (lastActive === 'tech' && clientX <= boundaryX + hysteresis) {
        return 'tech' as const
      }
      if (lastActive === 'life' && clientX >= boundaryX - hysteresis) {
        return 'life' as const
      }
      return clientX <= boundaryX ? 'tech' : 'life'
    }

    function handlePointer(clientX: number) {
      if (!isDesktopViewport()) {
        clearActive()
        return
      }
      if (Date.now() < hoverSuppressedUntil) {
        return
      }
      setActive(pickActive(clientX))
    }

    function schedulePointer(clientX: number) {
      pointerClientX = clientX
      if (pointerFrameId !== 0) {
        return
      }

      pointerFrameId = window.requestAnimationFrame(() => {
        pointerFrameId = 0
        if (pointerClientX === null) {
          return
        }

        handlePointer(pointerClientX)
      })
    }

    function suppressHoverAfterScroll() {
      hoverSuppressedUntil = Date.now() + hoverResumeDelayMs
    }

    syncCompactTitles(techPanel)
    syncCompactTitles(lifePanel)
    observeTitleChanges(techPanel)
    observeTitleChanges(lifePanel)
    refreshBoundary()

    if (typeof ResizeObserver === 'function') {
      const resizeObserver = new ResizeObserver(() => {
        scheduleBoundaryRefresh()
      })
      resizeObserver.observe(splitLayout)
      resizeObserver.observe(techPanel)
      resizeObserver.observe(lifePanel)
      resizeObservers.push(resizeObserver)
    }

    on(splitLayout, 'pointermove', (event) => {
      const pointerEvent = event as PointerEvent
      schedulePointer(pointerEvent.clientX)
    }, { passive: true })

    on(techPanel, 'pointerenter', () => {
      if (!isDesktopViewport() || Date.now() < hoverSuppressedUntil) {
        return
      }
      setActive('tech')
    }, { passive: true })

    on(lifePanel, 'pointerenter', () => {
      if (!isDesktopViewport() || Date.now() < hoverSuppressedUntil) {
        return
      }
      setActive('life')
    }, { passive: true })

    on(splitLayout, 'mouseleave', () => {
      clearActive()
    })

    on(splitLayout, 'focusin', (event) => {
      if (!isDesktopViewport()) {
        return
      }
      const target = event.target as Node
      const inTech = techPanel.contains(target)
      setActive(inTech ? 'tech' : 'life')
    })

    on(window, 'resize', () => {
      scheduleBoundaryRefresh()
      if (!isDesktopViewport()) {
        clearActive()
      }
    })

    on(window, 'wheel', suppressHoverAfterScroll, { passive: true })
    on(window, 'touchmove', suppressHoverAfterScroll, { passive: true })
    on(window, 'scroll', suppressHoverAfterScroll, { passive: true })

    return () => {
      if (pointerFrameId !== 0) {
        window.cancelAnimationFrame(pointerFrameId)
      }
      if (boundaryFrameId !== 0) {
        window.cancelAnimationFrame(boundaryFrameId)
      }
      for (const teardown of listeners) {
        teardown()
      }
      for (const observer of observers) {
        observer.disconnect()
      }
      for (const resizeObserver of resizeObservers) {
        resizeObserver.disconnect()
      }
    }
  }, [enabled])
}

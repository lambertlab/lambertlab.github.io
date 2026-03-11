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
    let lastActive = 'tech'
    let hoverSuppressedUntil = 0

    const hysteresis = 1
    const transitionDurationMs = 320
    const transitionEasing = 'cubic-bezier(0.22, 1, 0.36, 1)'
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

    function forEachCard(callback: (card: Element) => void) {
      splitLayout.querySelectorAll('.panel-content-grid .bento-card').forEach(callback)
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

    function captureCardRects() {
      const rects = new Map<Element, DOMRect>()
      forEachCard((card) => {
        rects.set(card, card.getBoundingClientRect())
      })
      return rects
    }

    function animateLayoutMutation(mutate: () => void) {
      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (prefersReducedMotion) {
        mutate()
        return
      }

      const firstRects = captureCardRects()
      mutate()
      syncCompactTitles(techPanel)
      syncCompactTitles(lifePanel)
      splitLayout.getBoundingClientRect()

      forEachCard((card) => {
        const first = firstRects.get(card)
        if (!first) {
          return
        }

        const last = card.getBoundingClientRect()
        const deltaX = first.left - last.left
        const deltaY = first.top - last.top
        const scaleX = last.width > 0 ? first.width / last.width : 1
        const scaleY = last.height > 0 ? first.height / last.height : 1
        const noMovement =
          Math.abs(deltaX) < 0.5 &&
          Math.abs(deltaY) < 0.5 &&
          Math.abs(scaleX - 1) < 0.01 &&
          Math.abs(scaleY - 1) < 0.01

        if (noMovement || typeof (card as HTMLElement).animate !== 'function') {
          return
        }

        ;(card as HTMLElement).animate(
          [
            {
              transformOrigin: 'top left',
              transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
            },
            {
              transformOrigin: 'top left',
              transform: 'translate(0, 0) scale(1, 1)',
            },
          ],
          {
            duration: transitionDurationMs,
            easing: transitionEasing,
            fill: 'both',
          },
        )
      })
    }

    function setActive(active: string) {
      if (!active) {
        return
      }
      if (splitLayout.getAttribute('data-active') === active) {
        lastActive = active
        return
      }

      animateLayoutMutation(() => {
        splitLayout.setAttribute('data-active', active)
      })
      lastActive = active
    }

    function clearActive(animate: boolean) {
      if (!splitLayout.hasAttribute('data-active')) {
        return
      }

      if (!animate) {
        splitLayout.removeAttribute('data-active')
        return
      }

      animateLayoutMutation(() => {
        splitLayout.removeAttribute('data-active')
      })
    }

    function pickActive(clientX: number) {
      const techRect = techPanel.getBoundingClientRect()
      const lifeRect = lifePanel.getBoundingClientRect()
      const boundaryX = (techRect.right + lifeRect.left) / 2

      if (lastActive === 'tech' && clientX <= boundaryX + hysteresis) {
        return 'tech'
      }
      if (lastActive === 'life' && clientX >= boundaryX - hysteresis) {
        return 'life'
      }
      return clientX <= boundaryX ? 'tech' : 'life'
    }

    function handlePointer(clientX: number) {
      if (window.innerWidth <= 1024) {
        clearActive(false)
        return
      }
      if (Date.now() < hoverSuppressedUntil) {
        return
      }
      setActive(pickActive(clientX))
    }

    function suppressHoverAfterScroll() {
      hoverSuppressedUntil = Date.now() + hoverResumeDelayMs
    }

    syncCompactTitles(techPanel)
    syncCompactTitles(lifePanel)
    observeTitleChanges(techPanel)
    observeTitleChanges(lifePanel)

    on(splitLayout, 'mousemove', (event) => {
      const pointerEvent = event as MouseEvent
      handlePointer(pointerEvent.clientX)
    })

    on(splitLayout, 'mouseleave', () => {
      clearActive(true)
    })

    on(splitLayout, 'focusin', (event) => {
      if (window.innerWidth <= 1024) {
        return
      }
      const target = event.target as Node
      const inTech = techPanel.contains(target)
      setActive(inTech ? 'tech' : 'life')
    })

    on(window, 'resize', () => {
      if (window.innerWidth <= 1024) {
        clearActive(false)
      }
    })

    on(window, 'wheel', suppressHoverAfterScroll, { passive: true })
    on(window, 'touchmove', suppressHoverAfterScroll, { passive: true })
    on(window, 'scroll', suppressHoverAfterScroll, { passive: true })

    return () => {
      for (const teardown of listeners) {
        teardown()
      }
      for (const observer of observers) {
        observer.disconnect()
      }
    }
  }, [enabled])
}

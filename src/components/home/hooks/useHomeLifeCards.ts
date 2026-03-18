import * as React from 'react'
import { fetchHomeContent, type HomeContentCard } from '~/lib/homeContentApi'

export type HomeLifeCardsStatus = 'loading' | 'ready' | 'empty' | 'error'

interface HomeLifeCardsState {
  status: HomeLifeCardsStatus
  cards: HomeContentCard[]
  message: string | null
}

const INITIAL_STATE: HomeLifeCardsState = {
  status: 'loading',
  cards: [],
  message: null,
}

export function useHomeLifeCards() {
  const [state, setState] = React.useState<HomeLifeCardsState>(INITIAL_STATE)
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    const controller = new AbortController()
    setState((current) => ({
      ...current,
      status: 'loading',
      message: null,
    }))

    fetchHomeContent(controller.signal)
      .then((snapshot) => {
        if (controller.signal.aborted) {
          return
        }

        const cards = snapshot.life
        setState({
          status: cards.length > 0 ? 'ready' : 'empty',
          cards,
          message: null,
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        const message = error instanceof Error ? error.message : 'Failed to load life cards.'
        setState({
          status: 'error',
          cards: [],
          message,
        })
      })

    return () => {
      controller.abort()
    }
  }, [reloadToken])

  const retry = React.useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  return {
    ...state,
    retry,
  }
}

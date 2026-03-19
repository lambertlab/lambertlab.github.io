import * as React from 'react'
import { type HomeContentCard } from '~/lib/homeContentApi'
import { loadHomeLifeCardsSnapshot, readHomeLifeCardsSnapshot } from '~/lib/pageDataCache'

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

function buildReadyState(cards: HomeLifeCardsState['cards']): HomeLifeCardsState {
  return {
    status: cards.length > 0 ? 'ready' : 'empty',
    cards,
    message: null,
  }
}

function buildErrorState(error: unknown): HomeLifeCardsState {
  const message = error instanceof Error ? error.message : 'Failed to load life cards.'

  return {
    status: 'error',
    cards: [],
    message,
  }
}

function getInitialState(): HomeLifeCardsState {
  const snapshot = readHomeLifeCardsSnapshot()

  if (snapshot.status === 'ready') {
    return buildReadyState(snapshot.data ?? [])
  }

  if (snapshot.status === 'error') {
    return buildErrorState(snapshot.error)
  }

  return INITIAL_STATE
}

export function useHomeLifeCards() {
  const [state, setState] = React.useState<HomeLifeCardsState>(() => getInitialState())
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    const forceReload = reloadToken > 0
    const snapshot = readHomeLifeCardsSnapshot()

    if (forceReload || snapshot.status === 'idle' || snapshot.status === 'pending') {
      setState((current) => ({
        ...current,
        status: 'loading',
        message: null,
      }))
    } else if (snapshot.status === 'ready') {
      setState(buildReadyState(snapshot.data ?? []))
    } else if (snapshot.status === 'error') {
      setState(buildErrorState(snapshot.error))
    }

    loadHomeLifeCardsSnapshot({ force: forceReload })
      .then((cards) => {
        if (cancelled) {
          return
        }

        setState(buildReadyState(cards))
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }

        setState(buildErrorState(error))
      })

    return () => {
      cancelled = true
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

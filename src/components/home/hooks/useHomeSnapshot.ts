import * as React from 'react'
import { type HomeCard, type HomeSnapshot } from '~/lib/homeApi'
import { loadHomeSnapshot, readHomeSnapshot } from '~/lib/pageDataCache'

export type HomeCardsStatus = 'loading' | 'ready' | 'empty' | 'error'

interface HomeCardsState {
  status: HomeCardsStatus
  cards: HomeCard[]
  message: string | null
}

interface HomeSnapshotState {
  technology: HomeCardsState
  life: HomeCardsState
}

const INITIAL_CARDS_STATE: HomeCardsState = {
  status: 'loading',
  cards: [],
  message: null,
}

const INITIAL_STATE: HomeSnapshotState = {
  technology: INITIAL_CARDS_STATE,
  life: INITIAL_CARDS_STATE,
}

function buildReadyState(cards: HomeCard[]): HomeCardsState {
  return {
    status: cards.length > 0 ? 'ready' : 'empty',
    cards,
    message: null,
  }
}

function buildErrorState(error: unknown): HomeCardsState {
  const message = error instanceof Error ? error.message : 'Failed to load homepage data.'

  return {
    status: 'error',
    cards: [],
    message,
  }
}

function buildSnapshotState(snapshot: HomeSnapshot): HomeSnapshotState {
  return {
    technology: buildReadyState(snapshot.technology),
    life: buildReadyState(snapshot.life),
  }
}

function getInitialState(): HomeSnapshotState {
  const snapshot = readHomeSnapshot()

  if (snapshot.status === 'ready' && snapshot.data) {
    return buildSnapshotState(snapshot.data)
  }

  if (snapshot.status === 'error') {
    const errorState = buildErrorState(snapshot.error)
    return {
      technology: errorState,
      life: errorState,
    }
  }

  return INITIAL_STATE
}

export function useHomeSnapshot() {
  const [state, setState] = React.useState<HomeSnapshotState>(() => getInitialState())
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    const forceReload = reloadToken > 0
    const snapshot = readHomeSnapshot()

    if (forceReload || snapshot.status === 'idle' || snapshot.status === 'pending') {
      setState(INITIAL_STATE)
    } else if (snapshot.status === 'ready' && snapshot.data) {
      setState(buildSnapshotState(snapshot.data))
    } else if (snapshot.status === 'error') {
      const errorState = buildErrorState(snapshot.error)
      setState({
        technology: errorState,
        life: errorState,
      })
    }

    loadHomeSnapshot({ force: forceReload })
      .then((nextSnapshot) => {
        if (cancelled) {
          return
        }

        setState(buildSnapshotState(nextSnapshot))
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }

        const errorState = buildErrorState(error)
        setState({
          technology: errorState,
          life: errorState,
        })
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

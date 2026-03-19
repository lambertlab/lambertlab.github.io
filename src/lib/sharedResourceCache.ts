export type SharedResourceStatus = 'idle' | 'pending' | 'ready' | 'error'

interface SharedResourceEntry<T> {
  status: SharedResourceStatus
  data?: T
  error?: unknown
  promise?: Promise<T>
  updatedAt: number
}

export interface SharedResourceSnapshot<T> {
  status: SharedResourceStatus
  data?: T
  error?: unknown
  updatedAt: number
}

interface LoadSharedResourceOptions {
  force?: boolean
  ttlMs?: number
}

const resourceEntries = new Map<string, SharedResourceEntry<unknown>>()

function isReadyAndFresh<T>(entry: SharedResourceEntry<T>, ttlMs: number): boolean {
  if (entry.status !== 'ready') {
    return false
  }

  if (ttlMs <= 0) {
    return false
  }

  return Date.now() - entry.updatedAt <= ttlMs
}

export function readSharedResourceSnapshot<T>(key: string): SharedResourceSnapshot<T> {
  const entry = resourceEntries.get(key) as SharedResourceEntry<T> | undefined

  if (!entry) {
    return {
      status: 'idle',
      updatedAt: 0,
    }
  }

  return {
    status: entry.status,
    data: entry.data,
    error: entry.error,
    updatedAt: entry.updatedAt,
  }
}

export function clearSharedResource(key: string) {
  resourceEntries.delete(key)
}

export function loadSharedResource<T>(
  key: string,
  loader: () => Promise<T>,
  options: LoadSharedResourceOptions = {},
): Promise<T> {
  const ttlMs = options.ttlMs ?? 0
  const currentEntry = resourceEntries.get(key) as SharedResourceEntry<T> | undefined

  if (!options.force && currentEntry) {
    if (currentEntry.status === 'pending' && currentEntry.promise) {
      return currentEntry.promise
    }

    if (isReadyAndFresh(currentEntry, ttlMs)) {
      return Promise.resolve(currentEntry.data as T)
    }
  }

  const nextPromise = loader()
    .then((data) => {
      resourceEntries.set(key, {
        status: 'ready',
        data,
        updatedAt: Date.now(),
      })

      return data
    })
    .catch((error: unknown) => {
      resourceEntries.set(key, {
        status: 'error',
        error,
        updatedAt: Date.now(),
      })

      throw error
    })

  resourceEntries.set(key, {
    status: 'pending',
    promise: nextPromise,
    updatedAt: Date.now(),
  })

  return nextPromise
}

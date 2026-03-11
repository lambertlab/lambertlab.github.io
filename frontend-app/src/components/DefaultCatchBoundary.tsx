import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  })

  console.error('DefaultCatchBoundary Error:', error)

  return (
    <div
      style={{
        minWidth: 0,
        padding: '96px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <ErrorComponent error={error} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            router.invalidate()
          }}
          style={{
            border: '1px solid #dce7fb',
            borderRadius: 999,
            background: '#ffffff',
            color: '#334155',
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
        {isRoot ? (
          <Link to="/index.html" style={{ color: '#2563eb' }}>
            Home
          </Link>
        ) : (
          <Link
            to="/index.html"
            style={{ color: '#2563eb' }}
            onClick={(e) => {
              e.preventDefault()
              window.history.back()
            }}
          >
            Go Back
          </Link>
        )}
      </div>
    </div>
  )
}

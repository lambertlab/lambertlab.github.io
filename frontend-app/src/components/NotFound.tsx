import { Link } from '@tanstack/react-router'

export function NotFound({ children }: { children?: any }) {
  return (
    <div style={{ padding: '96px 16px 24px', maxWidth: 920, margin: '0 auto', color: '#334155' }}>
      <div>
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
      <p style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => window.history.back()}
          style={{
            border: '1px solid #dce7fb',
            borderRadius: 999,
            background: '#ffffff',
            color: '#334155',
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          Go back
        </button>
        <Link to="/index.html" style={{ color: '#2563eb' }}>
          Start Over
        </Link>
      </p>
    </div>
  )
}

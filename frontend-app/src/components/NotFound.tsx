import { Link } from '@tanstack/react-router'
import { notFoundMetadata } from '~/lib/siteCopy'
import { useDocumentMetadata, useUiLocale } from '~/lib/uiLocale'

export function NotFound({ children }: { children?: any }) {
  const { locale } = useUiLocale()
  useDocumentMetadata(notFoundMetadata.title[locale], notFoundMetadata.description[locale])

  return (
    <div style={{ padding: '96px 16px 24px', maxWidth: 920, margin: '0 auto', color: '#334155' }}>
      <div>
        {children || <p>{locale === 'zh-CN' ? '你访问的页面不存在。' : 'The page you are looking for does not exist.'}</p>}
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
          {locale === 'zh-CN' ? '返回上页' : 'Go back'}
        </button>
        <Link to="/index.html" style={{ color: '#2563eb' }}>
          {locale === 'zh-CN' ? '回到首页' : 'Start over'}
        </Link>
      </p>
    </div>
  )
}

import * as React from 'react'
import { verifyAdminToken } from '~/lib/api/adminProjectsApi'
import { useDocumentMetadata, useUiLocale } from '~/lib/uiLocale'
import type { AdminSidebarMode } from './AdminConsoleSidebar'
import { AdminConsoleFrame } from './AdminConsoleFrame'
import { mapAdminError } from './adminConsoleUtils'

const TOKEN_KEY = 'll-admin-token-v1'

type AuthStatus = 'checking' | 'locked' | 'verifying' | 'ready' | 'error'

export type AdminConsoleMode = AdminSidebarMode

interface AuthContextValue {
  token: string
  invalidate: (message?: string) => void
}

interface Props {
  mode: AdminConsoleMode
  title: string
  description: string
  children: React.ReactNode
}

const AdminConsoleAuthContext = React.createContext<AuthContextValue | null>(null)

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readToken(): string {
  if (typeof window === 'undefined') return ''
  try {
    return toText(window.localStorage.getItem(TOKEN_KEY))
  } catch {
    return ''
  }
}

function saveToken(token: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // noop
  }
}

function clearToken() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // noop
  }
}

export function useAdminConsoleAuth(): AuthContextValue {
  const context = React.useContext(AdminConsoleAuthContext)
  if (!context) {
    throw new Error('useAdminConsoleAuth must be used within AdminConsoleShell')
  }
  return context
}

export function AdminConsoleShell({ mode, title, description, children }: Props) {
  useDocumentMetadata(title, description)

  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])

  const [tokenInput, setTokenInput] = React.useState('')
  const [token, setToken] = React.useState('')
  const [authStatus, setAuthStatus] = React.useState<AuthStatus>('checking')
  const [authMessage, setAuthMessage] = React.useState('')

  const invalidate = React.useCallback((message?: string) => {
    clearToken()
    setToken('')
    setAuthStatus('error')
    setAuthMessage(message || t('Admin Token 已失效，请重新验证。', 'Admin token expired. Please verify again.'))
  }, [t])

  const verify = React.useCallback(async (candidate: string, silent = false) => {
    const value = candidate.trim()
    if (!value) {
      setAuthStatus('locked')
      setAuthMessage(t('请输入 Admin Token。', 'Please input admin token.'))
      return
    }

    setAuthStatus(silent ? 'checking' : 'verifying')
    setAuthMessage('')

    try {
      await verifyAdminToken(value)
      saveToken(value)
      setToken(value)
      setAuthStatus('ready')
    } catch (error) {
      const mapped = mapAdminError(error)
      clearToken()
      setToken('')
      setAuthStatus('error')
      setAuthMessage(mapped.message)
    }
  }, [t])

  React.useEffect(() => {
    const stored = readToken()
    if (!stored) {
      setAuthStatus('locked')
      return
    }

    setTokenInput(stored)
    void verify(stored, true)
  }, [verify])

  return (
    <AdminConsoleFrame mode={mode}>
      {authStatus !== 'ready' ? (
        <section className="admin-auth-card" aria-live="polite">
          <h2>{t('Admin Token 校验', 'Admin Token Verification')}</h2>
          <form
            className="admin-auth-form"
            onSubmit={(event) => {
              event.preventDefault()
              void verify(tokenInput)
            }}
          >
            <label htmlFor="admin-token">X-Admin-Token</label>
            <input id="admin-token" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} type="password" autoComplete="off" />
            <div className="admin-auth-actions">
              <button className="admin-primary-button" type="submit" disabled={authStatus === 'checking' || authStatus === 'verifying'}>
                {authStatus === 'checking' || authStatus === 'verifying' ? t('校验中...', 'Verifying...') : t('验证 Token', 'Verify Token')}
              </button>
              <button
                className="admin-secondary-button"
                type="button"
                onClick={() => {
                  clearToken()
                  setTokenInput('')
                  setAuthStatus('locked')
                  setAuthMessage('')
                }}
              >
                {t('清空', 'Clear')}
              </button>
            </div>
          </form>
          {authStatus === 'checking' ? <p className="admin-feedback" data-tone="info">{t('正在检查已保存 token...', 'Checking stored token...')}</p> : null}
          {authStatus === 'locked' && authMessage ? <p className="admin-feedback" data-tone="warn">{authMessage}</p> : null}
          {authStatus === 'error' ? <p className="admin-feedback" data-tone="error">{authMessage}</p> : null}
        </section>
      ) : (
        <AdminConsoleAuthContext.Provider value={{ token, invalidate }}>{children}</AdminConsoleAuthContext.Provider>
      )}
    </AdminConsoleFrame>
  )
}

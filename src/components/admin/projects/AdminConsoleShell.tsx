import { Link } from '@tanstack/react-router'
import * as React from 'react'
import { verifyAdminToken } from '~/lib/api/adminProjectsApi'
import { useDocumentMetadata } from '~/lib/uiLocale'
import { DEFAULT_ADMIN_PROJECTS_SEARCH_STATE } from './adminProjectsSearch'
import { mapAdminError } from './adminConsoleUtils'

const TOKEN_KEY = 'll-admin-token-v1'

type AuthStatus = 'checking' | 'locked' | 'verifying' | 'ready' | 'error'

export type AdminConsoleMode = 'overview' | 'projects' | 'sync' | 'logs' | 'status'

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

  const [tokenInput, setTokenInput] = React.useState('')
  const [token, setToken] = React.useState('')
  const [authStatus, setAuthStatus] = React.useState<AuthStatus>('checking')
  const [authMessage, setAuthMessage] = React.useState('')

  const invalidate = React.useCallback((message?: string) => {
    clearToken()
    setToken('')
    setAuthStatus('error')
    setAuthMessage(message || 'Admin Token 已失效，请重新验证。')
  }, [])

  const verify = React.useCallback(async (candidate: string, silent = false) => {
    const value = candidate.trim()
    if (!value) {
      setAuthStatus('locked')
      setAuthMessage('请输入 Admin Token。')
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
  }, [])

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
    <main className="admin-projects-shell" id="main-content">
      <section className="admin-projects-hero">
        <div>
          <p className="admin-projects-kicker">Control Center · Phase 2</p>
          <h1>多模块控制台与同步中心</h1>
          <p>覆盖概览、项目管理、同步中心、操作日志、系统状态。</p>
        </div>
        <nav className="admin-projects-tabs" aria-label="admin nav">
          <Link to="/admin/overview" className={mode === 'overview' ? 'is-active' : ''}>/admin/overview</Link>
          <Link to="/admin/projects" search={DEFAULT_ADMIN_PROJECTS_SEARCH_STATE} className={mode === 'projects' ? 'is-active' : ''}>/admin/projects</Link>
          <Link to="/admin/sync" className={mode === 'sync' ? 'is-active' : ''}>/admin/sync</Link>
          <Link to="/admin/logs" className={mode === 'logs' ? 'is-active' : ''}>/admin/logs</Link>
          <Link to="/admin/status" className={mode === 'status' ? 'is-active' : ''}>/admin/status</Link>
        </nav>
      </section>

      {authStatus !== 'ready' ? (
        <section className="admin-auth-card" aria-live="polite">
          <h2>Admin Token 校验</h2>
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
                {authStatus === 'checking' || authStatus === 'verifying' ? '校验中...' : '验证 Token'}
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
                清空
              </button>
            </div>
          </form>
          {authStatus === 'checking' ? <p className="admin-feedback" data-tone="info">正在检查已保存 token...</p> : null}
          {authStatus === 'locked' && authMessage ? <p className="admin-feedback" data-tone="warn">{authMessage}</p> : null}
          {authStatus === 'error' ? <p className="admin-feedback" data-tone="error">{authMessage}</p> : null}
        </section>
      ) : (
        <AdminConsoleAuthContext.Provider value={{ token, invalidate }}>{children}</AdminConsoleAuthContext.Provider>
      )}
    </main>
  )
}
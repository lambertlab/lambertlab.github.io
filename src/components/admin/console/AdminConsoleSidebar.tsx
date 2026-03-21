import { Link } from '@tanstack/react-router'
import * as React from 'react'
import { useUiLocale } from '~/lib/uiLocale'
import { DEFAULT_ADMIN_PROJECTS_SEARCH_STATE } from '../projects/adminProjectsSearch'

export type AdminSidebarMode = 'overview' | 'projects' | 'repositories' | 'logs' | 'home'

interface AdminConsoleSidebarProps {
  activeMode: AdminSidebarMode
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProjectsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RepoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 13h8M8 17h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LogsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12a9 9 0 1118 0 9 9 0 01-18 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 11.5L12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10.5V20h12v-9.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20v-5h4v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AdminConsoleSidebar({ activeMode }: AdminConsoleSidebarProps) {
  const { locale } = useUiLocale()
  const t = React.useCallback((zh: string, en: string) => (locale === 'zh-CN' ? zh : en), [locale])

  return (
    <aside className="admin-reference-sidebar" aria-label={t('\u7ba1\u7406\u4fa7\u8fb9\u680f', 'Admin sidebar')}>
      <div className="admin-reference-sidebar__brand">
        <a className="admin-reference-sidebar__brand-link" href="/">
          <span className="admin-reference-sidebar__brand-mark">L</span>
          <span className="admin-reference-sidebar__brand-text">lambertlab</span>
        </a>
      </div>

      <nav className="admin-reference-sidebar__nav">
        <Link to="/admin/overview" className={activeMode === 'overview' ? 'admin-reference-sidebar__item is-active' : 'admin-reference-sidebar__item'}>
          <DashboardIcon />
          <span>{t('Overview', 'Overview')}</span>
        </Link>
        <Link
          to="/admin/projects"
          search={DEFAULT_ADMIN_PROJECTS_SEARCH_STATE}
          className={activeMode === 'projects' ? 'admin-reference-sidebar__item is-active' : 'admin-reference-sidebar__item'}
        >
          <ProjectsIcon />
          <span>{t('Projects', 'Projects')}</span>
        </Link>
        <Link
          to="/admin/repositories"
          className={activeMode === 'repositories' ? 'admin-reference-sidebar__item is-active' : 'admin-reference-sidebar__item'}
        >
          <RepoIcon />
          <span>{t('Repositories', 'Repositories')}</span>
        </Link>
        <Link to="/admin/logs" className={activeMode === 'logs' ? 'admin-reference-sidebar__item is-active' : 'admin-reference-sidebar__item'}>
          <LogsIcon />
          <span>{t('Logs', 'Logs')}</span>
        </Link>
        <Link to="/admin/home/life" className={activeMode === 'home' ? 'admin-reference-sidebar__item is-active' : 'admin-reference-sidebar__item'}>
          <HomeIcon />
          <span>{t('Home Life', 'Home Life')}</span>
        </Link>
      </nav>
    </aside>
  )
}

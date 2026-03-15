import type { UiLocale } from '~/lib/uiLocale'

export function buildAdminProjectsHead(locale: UiLocale = 'zh-CN') {
  return {
    meta: [
      {
        title: locale === 'zh-CN' ? 'Control Center · 管理控制台 | lambertlab' : 'Control Center · Admin Console | lambertlab',
      },
      {
        name: 'description',
        content:
          locale === 'zh-CN'
            ? 'Control Center 二期：概览、项目管理、同步中心、操作日志与系统状态。'
            : 'Control Center phase-2 console: overview, projects, sync center, logs, and status.',
      },
    ],
    links: [
      {
        rel: 'stylesheet' as const,
        href: '/css/page-admin-projects.css',
      },
      {
        rel: 'stylesheet' as const,
        href: '/css/theme-system.css',
      },
    ],
  }
}
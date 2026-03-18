import type { UiLocale } from '~/lib/uiLocale'

export function buildAdminProjectsHead(locale: UiLocale = 'zh-CN') {
  return {
    meta: [
      {
        title: 'Lambert Lab Admin | lambertlab',
      },
      {
        name: 'description',
        content:
          locale === 'zh-CN'
            ? 'Lambert Lab Admin：Overview 与 Projects 管理控制台。'
            : 'Lambert Lab Admin for overview and projects management.',
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

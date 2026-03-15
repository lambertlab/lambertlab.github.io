import type { UiLocale } from '~/lib/uiLocale'

export function buildAdminProjectsHead(locale: UiLocale = 'zh-CN') {
  return {
    meta: [
      {
        title: locale === 'zh-CN' ? 'Control Center · Projects 管理 | lambertlab' : 'Control Center · Projects Admin | lambertlab',
      },
      {
        name: 'description',
        content:
          locale === 'zh-CN'
            ? 'Control Center 一期 Projects 后台管理：token 门禁、列表筛选分页、编辑保存与仓库同步。'
            : 'Control Center phase-1 Projects admin with token gate, list filtering, edit save, and repository sync.',
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

import type { UiLocale } from '~/lib/uiLocale'

export function buildProjectDetailHead(locale: UiLocale = 'zh-CN') {
  return {
    meta: [
      {
        title: locale === 'zh-CN' ? '项目详情 | lambertlab' : 'Project Detail | lambertlab',
      },
      {
        name: 'description',
        content:
          locale === 'zh-CN'
            ? '基于统一 Projects 合同的项目详情页骨架。'
            : 'LambertLab project detail skeleton powered by the unified project contract.',
      },
    ],
    links: [
      {
        rel: 'stylesheet' as const,
        href: '/css/page-project-shell.css',
      },
      {
        rel: 'preload' as const,
        href: '/css/page-project-detail.css',
        as: 'style',
      },
      {
        rel: 'preload' as const,
        href: '/css/page-projects.css',
        as: 'style',
      },
      {
        rel: 'stylesheet' as const,
        href: '/css/page-project-detail.css',
      },
      {
        rel: 'stylesheet' as const,
        href: '/css/theme-system.css',
      },
    ],
  }
}

import type { UiLocale } from '~/lib/uiLocale'

export function buildStatusPageHead(locale: UiLocale = 'zh-CN') {
  return {
    meta: [
      {
        title: locale === 'zh-CN' ? '状态 | lambertlab' : 'Status | lambertlab',
      },
      {
        name: 'description',
        content:
          locale === 'zh-CN'
            ? '解释系统健康边界、公开可用性、内容新鲜度与访客可见问题的状态页。'
            : 'Public trust page for lambertlab explaining system health boundaries, public surface availability, content freshness, and visitor-facing issues.',
      },
    ],
    links: [
      {
        rel: 'stylesheet' as const,
        href: '/css/page-status.css',
      },
      {
        rel: 'stylesheet' as const,
        href: '/css/theme-system.css',
      },
    ],
  }
}

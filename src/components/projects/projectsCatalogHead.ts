import { legacyPageMetadata } from '~/lib/siteCopy'
import type { UiLocale } from '~/lib/uiLocale'

export function buildProjectsCatalogHead(locale: UiLocale = 'zh-CN') {
  return {
    meta: [
      {
        title: legacyPageMetadata.projects.title[locale],
      },
      {
        name: 'description',
        content: legacyPageMetadata.projects.description[locale],
      },
    ],
    links: [
      {
        rel: 'stylesheet' as const,
        href: '/css/page-projects.css',
      },
      {
        rel: 'stylesheet' as const,
        href: '/css/theme-system.css',
      },
    ],
  }
}

import type { LocalizedMetadata, UiLocale } from '~/lib/uiLocale'

export function buildContentPageHead(
  metadata: LocalizedMetadata,
  stylesheets: string[],
  locale: UiLocale = 'zh-CN',
) {
  const meta: Array<Record<string, string>> = [{ title: metadata.title[locale] }]

  if (metadata.description[locale]) {
    meta.push({
      name: 'description',
      content: metadata.description[locale],
    })
  }

  return {
    meta,
    links: [
      ...stylesheets.map((href) => ({
        rel: 'stylesheet' as const,
        href,
      })),
      {
        rel: 'stylesheet' as const,
        href: '/css/theme-system.css',
      },
    ],
  }
}

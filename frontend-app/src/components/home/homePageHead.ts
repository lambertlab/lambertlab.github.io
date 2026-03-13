import { rootMetadata } from '~/lib/siteCopy'
import type { UiLocale } from '~/lib/uiLocale'

const HOME_TAILWIND_HEAD_SCRIPTS = [
  {
    src: 'https://cdn.tailwindcss.com?plugins=forms,container-queries',
  },
  {
    children: `tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--ll-font-sans)"],
        mono: ["var(--ll-font-mono)"]
      },
      colors: {
        brand: {
          blue: "#2563eb",
          border: "#dce7fb",
          light: "#f9fbff"
        }
      }
    }
  }
};`,
  },
]

export function buildHomePageHead(locale: UiLocale = 'zh-CN') {
  return {
    meta: [
      {
        title: rootMetadata.title[locale],
      },
      {
        name: 'description',
        content: rootMetadata.description[locale],
      },
    ],
    links: [
      {
        rel: 'stylesheet' as const,
        href: '/css/page-home.css',
      },
      {
        rel: 'stylesheet' as const,
        href: '/css/theme-system.css',
      },
    ],
    scripts: HOME_TAILWIND_HEAD_SCRIPTS,
  }
}

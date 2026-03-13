import type { JSX } from 'react'
import aboutHtmlRaw from '~/legacy-html/about/index.html?raw'
import indexHtmlRaw from '~/legacy-html/index.html?raw'
import projectsIndexHtmlRaw from '~/legacy-html/projects/index.html?raw'
import projectAIMsgRaw from '~/legacy-html/projects/ai-message-value-triage/index.html?raw'
import projectToolboxRaw from '~/legacy-html/projects/personal-toolbox/index.html?raw'
import { legacyPageMetadata } from '~/lib/siteCopy'
import type { LocalizedMetadata, UiLocale } from '~/lib/uiLocale'
import { parseLegacyHtml } from './parseLegacyHtml'

export interface LegacyPage {
  id: string
  bodyContentHtml: string
  stylesheets: string[]
  metadata: LocalizedMetadata
  enableHomeSplit?: boolean
  runtimeScripts?: string[]
}

function buildLegacyPage(
  id: string,
  source: string,
  stylesheets: string[],
  options?: {
    enableHomeSplit?: boolean
    metadata?: LocalizedMetadata
    runtimeScripts?: string[]
  },
): LegacyPage {
  const parsed = parseLegacyHtml(source)

  return {
    id,
    bodyContentHtml: parsed.bodyContentHtml,
    stylesheets,
    metadata: options?.metadata ?? {
      title: {
        'zh-CN': parsed.title,
        en: parsed.title,
      },
      description: {
        'zh-CN': parsed.description,
        en: parsed.description,
      },
    },
    enableHomeSplit: options?.enableHomeSplit === true,
    runtimeScripts: options?.runtimeScripts ?? [],
  }
}

function toProjectsDetailSource(source: string): string {
  return source.replace(/href="\.\.\/index\.html"/g, 'href="../"')
}

export const legacyPages = {
  home: buildLegacyPage('home', indexHtmlRaw, ['/css/page-home.css'], {
    enableHomeSplit: true,
    metadata: legacyPageMetadata.home,
    runtimeScripts: ['/js/projects-runtime.js', '/js/home-featured-projects.js'],
  }),
  about: buildLegacyPage('about', aboutHtmlRaw, ['/css/page-about.css'], {
    metadata: legacyPageMetadata.about,
  }),
  projects: buildLegacyPage('projects', projectsIndexHtmlRaw, ['/css/page-projects.css'], {
    metadata: legacyPageMetadata.projects,
    runtimeScripts: ['/js/projects-runtime.js', '/js/projects-catalog.js'],
  }),
  projectPersonalToolbox: buildLegacyPage(
    'project-personal-toolbox',
    toProjectsDetailSource(projectToolboxRaw),
    ['/css/bento-pages.css'],
    {
      metadata: legacyPageMetadata['project-personal-toolbox'],
    },
  ),
  projectAiMessageValueTriage: buildLegacyPage(
    'project-ai-message-value-triage',
    toProjectsDetailSource(projectAIMsgRaw),
    ['/css/bento-pages.css'],
    {
      metadata: legacyPageMetadata['project-ai-message-value-triage'],
    },
  ),
}

export const homeTailwindHeadScripts: Array<JSX.IntrinsicElements['script']> = [
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

export function buildLegacyHead(page: LegacyPage, locale: UiLocale = 'zh-CN') {
  const meta: Array<Record<string, string>> = [{ title: page.metadata.title[locale] }]
  if (page.metadata.description[locale]) {
    meta.push({
      name: 'description',
      content: page.metadata.description[locale],
    })
  }

  return {
    meta,
    links: [
      ...page.stylesheets.map((href) => ({
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

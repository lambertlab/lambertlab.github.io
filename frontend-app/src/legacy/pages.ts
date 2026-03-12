import type { JSX } from 'react'
import aboutHtmlRaw from '~/legacy-html/about/index.html?raw'
import contactHtmlRaw from '~/legacy-html/contact/index.html?raw'
import indexHtmlRaw from '~/legacy-html/index.html?raw'
import journalAiCollabRaw from '~/legacy-html/journal/ai-collaboration-checklist.html?raw'
import journalIndexHtmlRaw from '~/legacy-html/journal/index.html?raw'
import journalModelFirstRaw from '~/legacy-html/journal/model-first-engineering.html?raw'
import journalHabitsRaw from '~/legacy-html/journal/operational-habits-that-stick.html?raw'
import projectsIndexHtmlRaw from '~/legacy-html/projects/index.html?raw'
import projectAIMsgRaw from '~/legacy-html/projects/ai-message-value-triage/index.html?raw'
import projectToolboxRaw from '~/legacy-html/projects/personal-toolbox/index.html?raw'
import { parseLegacyHtml } from './parseLegacyHtml'

export interface LegacyPage {
  id: string
  title: string
  description: string
  bodyContentHtml: string
  stylesheets: string[]
  enableHomeSplit?: boolean
  runtimeScripts?: string[]
}

function buildLegacyPage(
  id: string,
  source: string,
  stylesheets: string[],
  options?: {
    enableHomeSplit?: boolean
    runtimeScripts?: string[]
  },
): LegacyPage {
  const parsed = parseLegacyHtml(source)

  return {
    id,
    title: parsed.title,
    description: parsed.description,
    bodyContentHtml: parsed.bodyContentHtml,
    stylesheets,
    enableHomeSplit: options?.enableHomeSplit === true,
    runtimeScripts: options?.runtimeScripts ?? [],
  }
}

function toJournalIndexSource(source: string): string {
  return source
    .replace(/href="\.\/*model-first-engineering\.html"/g, 'href="./model-first-engineering/index.html"')
    .replace(/href="\.\/*ai-collaboration-checklist\.html"/g, 'href="./ai-collaboration-checklist/index.html"')
    .replace(/href="\.\/*operational-habits-that-stick\.html"/g, 'href="./operational-habits-that-stick/index.html"')
}

function toJournalDetailSource(source: string): string {
  return source
    .replace(/href="\.\.\/index\.html"/g, 'href="__LL_HOME_INDEX__"')
    .replace(/href="\.\/*index\.html"/g, 'href="../index.html"')
    .replace(/href="__LL_HOME_INDEX__"/g, 'href="../../index.html"')
}

function toProjectsDetailSource(source: string): string {
  return source.replace(/href="\.\.\/index\.html"/g, 'href="../"')
}

export const legacyPages = {
  home: buildLegacyPage('home', indexHtmlRaw, ['/css/page-home.css'], {
    enableHomeSplit: true,
    runtimeScripts: ['/js/projects-runtime.js', '/js/home-featured-projects.js'],
  }),
  about: buildLegacyPage('about', aboutHtmlRaw, ['/css/page-about.css']),
  contact: buildLegacyPage('contact', contactHtmlRaw, ['/css/bento-pages.css', '/css/page-contact.css']),
  projects: buildLegacyPage('projects', projectsIndexHtmlRaw, ['/css/page-projects.css'], {
    runtimeScripts: ['/js/projects-runtime.js', '/js/projects-catalog.js'],
  }),
  journal: buildLegacyPage('journal', toJournalIndexSource(journalIndexHtmlRaw), ['/css/page-journal.css']),
  projectPersonalToolbox: buildLegacyPage(
    'project-personal-toolbox',
    toProjectsDetailSource(projectToolboxRaw),
    ['/css/bento-pages.css'],
  ),
  projectAiMessageValueTriage: buildLegacyPage(
    'project-ai-message-value-triage',
    toProjectsDetailSource(projectAIMsgRaw),
    ['/css/bento-pages.css'],
  ),
  journalModelFirstEngineering: buildLegacyPage(
    'journal-model-first-engineering',
    toJournalDetailSource(journalModelFirstRaw),
    ['/css/bento-pages.css'],
  ),
  journalAiCollaborationChecklist: buildLegacyPage(
    'journal-ai-collaboration-checklist',
    toJournalDetailSource(journalAiCollabRaw),
    ['/css/bento-pages.css'],
  ),
  journalOperationalHabitsThatStick: buildLegacyPage(
    'journal-operational-habits-that-stick',
    toJournalDetailSource(journalHabitsRaw),
    ['/css/bento-pages.css'],
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

export function buildLegacyHead(page: LegacyPage) {
  const meta: Array<Record<string, string>> = [{ title: page.title }]
  if (page.description) {
    meta.push({
      name: 'description',
      content: page.description,
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
